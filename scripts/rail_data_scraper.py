import os
import sys
import requests
from bs4 import BeautifulSoup
import time
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
# --- MongoDB and OpenAI Imports ---
from pymongo import MongoClient
from openai import OpenAI
# --- PDF Library Import (Conceptual) ---
import PyPDF2 

# ==========================================
# 🧱 1. CONFIGURATION (REQUIRED CHANGES HERE)
# ==========================================

# Database and AI Configuration (Assumed to be set via ENV variables)
MONGO_URI = (os.getenv("MONGO_URI") or "").strip()
DB_NAME_PROD = "railnology"
DB_NAME_QA = "railnology_qa"
COLLECTION_NAME = "knowledge_chunks"
OPENAI_API_KEY = (os.getenv("OPENAI_API_KEY") or "").strip()
EMBEDDING_MODEL = "text-embedding-3-small"
MAX_CHARS_PER_CHUNK = 15000 

# --- FRA 49 CFR REGULATION BASELINE (From ingest_rail_content.py) ---
ECFR_API_URL = "https://www.ecfr.gov/api/renderer/v1/content/enhanced/current/title-49"
# Scope: ENTIRE FRA (Chapter II, Parts 200 through 299)
TARGET_PARTS = list(range(200, 300))
# -------------------------------------------------------------------

# Public FRA Data Sources (for Safety Guidance)
FRA_ADVISORY_URL = "https://railroads.dot.gov/safety-data-analysis/safety/safety-advisories" 
FRA_BULLETIN_URL = "https://railroads.dot.gov/safety/technical-advisories-bulletins-notices" 

# --- 🎯 THE ONLY SECTION YOU MUST MANUALLY EDIT ---
# Replace the "path/to/file.pdf" placeholders with the actual local file paths.
RULES_TO_PROCESS = [
    {
        'system_name': 'GCOR', 
        'title': 'General Code of Operating Rules',
        'effective_date': '2025-09-23',
        'pdf_path': "../GCOR8.pdf" # <--- PASTE GCOR PDF PATH HERE
    },
    {
        'system_name': 'NORAC',
        'title': 'NORAC Operating Rules',
        'effective_date': '2024-01-01',
        'pdf_path': "../Norac.pdf" # <--- PASTE NORAC PDF PATH HERE
    },
]
# --------------------------------------------------------------------

# ==========================================
# 🛠️ HELPER FUNCTIONS 
# ==========================================

def get_mongo_client():
    return MongoClient(MONGO_URI)

def get_openai_client():
    return OpenAI(api_key=OPENAI_API_KEY)

def get_db_name():
    """Determines database name based on environment variable."""
    node_env = os.getenv("NODE_ENV", "production")
    return DB_NAME_QA if node_env == 'qa' else DB_NAME_PROD

def split_large_text(text, limit=MAX_CHARS_PER_CHUNK):
    """Splits text into chunks small enough for the embedding model."""
    if len(text) <= limit:
        return [text]
    chunks = []
    current_text = text
    while len(current_text) > limit:
        split_idx = current_text.rfind('.', 0, limit)
        if split_idx == -1: split_idx = current_text.rfind('\n', 0, limit)
        if split_idx == -1: split_idx = current_text.rfind(' ', 0, limit)
        if split_idx == -1: split_idx = limit
        
        chunk = current_text[:split_idx+1].strip()
        if chunk: chunks.append(chunk)
        current_text = current_text[split_idx+1:].strip()
    
    if current_text: chunks.append(current_text)
    return chunks

def generate_embedding(client, text):
    """Generates a vector embedding for a given text string with retry logic."""
    text = text.replace("\n", " ")
    retries = 3
    for attempt in range(retries):
        try:
            time.sleep(0.05) 
            response = client.embeddings.create(input=[text], model=EMBEDDING_MODEL)
            return response.data[0].embedding
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1) 
                continue
            # Note: We do not exit here to allow other ingestion processes to continue
            print(f"   ⚠️ Embedding API Error (Final): {e}") 
            return []

def clean_xml_text(xml_string):
    """Parses the raw XML from eCFR and extracts clean text."""
    try:
        if xml_string.strip().startswith("<?xml"):
            xml_string = xml_string.split("?>", 1)[-1]
        
        root = ET.fromstring(f"<root>{xml_string}</root>")
        return "".join(root.itertext()).strip()
    except ET.ParseError:
        return xml_string 
        
def load_pdf_text(pdf_path):
    """Reads and extracts text from a local PDF file path using PyPDF2."""
    try:
        if not os.path.exists(pdf_path):
            print(f"   ❌ ERROR: PDF file not found at path: {pdf_path}")
            return None
            
        text = ""
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text() + "\n"
        
        if len(text.strip()) < 100:
            print(f"   ⚠️ WARNING: Extracted very little text from PDF. Check PDF quality/format.")
            
        return text.strip()
        
    except Exception as e:
        print(f"   ❌ FATAL PDF PROCESSING ERROR for {pdf_path}: {e}")
        return None


# ==========================================
# 📥 INGESTION & DATA STRUCTURE 
# ==========================================

def save_to_mongodb(mongo_collection, openai_client, data_list):
    """Generates embeddings and saves structured documents to MongoDB."""
    if not data_list:
        return
        
    print(f"\n--- MongoDB Insertion for {data_list[0]['source']} ({len(data_list)} primary records) ---")
    
    operations = []
    
    for doc_data in data_list:
        # Determine text source based on document type
        if doc_data['document_type'] == 'Regulation':
             text_to_chunk = doc_data.get('text', '')
        else:
             text_to_chunk = doc_data.get('rule_text') or doc_data.get('hazard_summary', '') + ' ' + doc_data.get('recommended_action', '')
        
        if not text_to_chunk: continue
             
        sub_chunks = split_large_text(text_to_chunk)
        
        for j, sub_text in enumerate(sub_chunks):
            vector = generate_embedding(openai_client, sub_text)
            
            if not vector: continue

            mongo_doc = {
                "source": doc_data.get('source'),
                "document_type": doc_data.get('document_type'),
                "title": doc_data.get('title'),
                "text": sub_text,
                "embedding": vector,
                "last_updated": datetime.now(timezone.utc),
            }
            
            # Add specific fields based on document type
            if mongo_doc['document_type'] == 'Regulation':
                # CFR Regulation Fields
                mongo_doc.update({
                    "part": doc_data.get('part'),
                    "section_id": doc_data.get('section_id'),
                    "url": doc_data.get('url'),
                })
                doc_key = f"{mongo_doc['part']}_{mongo_doc['section_id']}".replace('.', '_')
                mongo_doc['section_id'] = f"{doc_key}_p{j+1}"
            
            elif mongo_doc['document_type'] == 'Operating Rule':
                # GCOR/NORAC Fields
                mongo_doc.update({
                    "rule_system": doc_data.get('rule_system'),
                    "rule_number": doc_data.get('rule_number'),
                    "category": doc_data.get('category'),
                    "effective_date": doc_data.get('effective_date'),
                })
                doc_key = f"{doc_data['rule_system']}_{doc_data['rule_number']}".replace('.', '_')
                mongo_doc['section_id'] = f"{doc_key}_p{j+1}"
            
            elif mongo_doc['document_type'] == 'Safety Guidance':
                # FRA Advisory/Bulletin Fields
                mongo_doc.update({
                    "doc_type": doc_data.get('doc_type'),
                    "date_issued": doc_data.get('date_issued'),
                    "applicable_49cfr": doc_data.get('applicable_49cfr'),
                })
                doc_key = doc_data['title'].replace(' ', '_').replace('/', '_')[:30]
                mongo_doc['section_id'] = f"{doc_key}_p{j+1}"
            
            operations.append(mongo_doc)
            
            if len(operations) >= 50:
                mongo_collection.insert_many(operations)
                operations = []
                print(".", end="", flush=True)

    if operations:
        mongo_collection.insert_many(operations)
        
    print(f" ✅ Indexed chunks.")

def fetch_and_process_cfr_part(part_number, mongo_collection, openai_client):
    """Fetches, cleans, and processes one 49 CFR Part from the eCFR API."""
    url = f"{ECFR_API_URL}?part={part_number}"
    print(f"   Drafting GET request for Part {part_number}...", end=" ")
    
    # Idempotency: Delete existing entries for this part
    mongo_collection.delete_many({"part": part_number, "source": "FRA", "document_type": "Regulation"})

    try:
        response = requests.get(url)
        response.raise_for_status()
        
        raw_text = clean_xml_text(response.text)
        
        if len(raw_text) < 200 and "Reserved" in raw_text:
             print(f"   ℹ️ Part {part_number} is marked 'Reserved'. Skipping.")
             return

        # Split by Section Symbol (§)
        chunks = raw_text.split("§")
        
        cfr_docs = []
        print(f"Processing {len(chunks)} sections...", end=" ")

        for chunk in chunks:
            if len(chunk) < 50: continue 
            
            base_section_text = "§" + chunk.strip()
            
            # Metadata Extraction
            parts = base_section_text.split(" ")
            section_id_base = parts[1] if len(parts) > 1 else str(part_number)
            
            # Create a single document object for saving
            doc = {
                "source": "FRA",
                "document_type": "Regulation",
                "title": "49 CFR",
                "part": part_number,
                "section_id": section_id_base,
                "text": base_section_text,
                "url": f"https://www.ecfr.gov/current/title-49/part-{part_number}"
            }
            cfr_docs.append(doc)

        # Use general save function to handle chunking and embedding
        save_to_mongodb(mongo_collection, openai_client, cfr_docs)

    except requests.exceptions.RequestException as e:
        print(f"   ❌ Network/API Error fetching Part {part_number}: {e}")

# (Other scraping and rule processing functions remain unchanged)

def scrape_fra_advisories(url, doc_type):
    """
    Scrapes FRA listing pages using generic link structures for robustness.
    """
    print(f"Starting generic scrape for FRA {doc_type} from: {url}")
    advisories = []
    
    last_error = None
    last_status = None
    
    for attempt in range(4): 
        try:
            response = requests.get(url, timeout=15) 
            last_status = response.status_code
            response.raise_for_status() 
            break
        except requests.exceptions.RequestException as e:
            last_error = e
            if attempt < 3:
                print(f"   Attempt {attempt+1} failed ({last_status or 'No Status'}). Retrying in {2**(attempt+1)}s...")
                time.sleep(2 ** (attempt + 1))
            else:
                pass 
    else:
        print(f"Failed to retrieve FRA {doc_type} after 4 attempts.")
        print(f"   Final Status: {last_status}. Final Error: {last_error}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    
    main_content = soup.find('div', class_='field-body') or soup.find('main')
    if not main_content:
        print("   Warning: Could not find main content area. Aborting scrape.")
        return []

    for link in main_content.find_all('a'):
        title = link.text.strip()
        pdf_url_rel = link.get('href')
        
        if not title or not pdf_url_rel:
            continue
            
        if ('safety' in title.lower() or doc_type.lower() in title.lower() or 'bulletin' in title.lower()) and (pdf_url_rel.endswith('.pdf') or pdf_url_rel.startswith('/sites/')):
            
            pdf_url_base = "https://railroads.dot.gov" 
            pdf_url = pdf_url_base + pdf_url_rel if pdf_url_rel.startswith('/') else pdf_url_rel
            
            date_issued = datetime.now(timezone.utc).isoformat()
            
            advisories.append({
                'source': 'FRA',
                'document_type': 'Safety Guidance',
                'title': title,
                'doc_type': doc_type,
                'date_issued': date_issued,
                'applicable_49cfr': 'TBD - Requires PDF analysis', 
                'hazard_summary': f"Document available at: {pdf_url}", 
                'recommended_action': "Requires PDF download and text extraction for full content."
            })
            
    print(f"Successfully identified {len(advisories)} potential {doc_type} links.")
    return advisories


def process_operating_rules(rule_data):
    """
    Loads text from the PDF path and processes the raw text for rule segmentation.
    """
    system_name = rule_data['system_name']
    effective_date = rule_data['effective_date']
    pdf_path = rule_data['pdf_path']

    rules = []
    
    rulebook_text = load_pdf_text(pdf_path)

    if not rulebook_text:
        return []
    
    print(f"--- Segmenting {system_name} Rulebook ({len(rulebook_text)} characters) ---")

    # The complexity of this regex is due to varied numbering (1.1, 5.2.1, 280-A).
    # You MUST tune this regex if segmentation is incorrect.
    rule_pattern = re.compile(r'\n(\d[\d\.\-]+[A-Z]?)\s+(.*?)(?=\n\d[\d\.\-]+[A-Z]?\s+|$)', re.DOTALL)
    
    matches = rule_pattern.findall('\n' + rulebook_text)
    
    if not matches:
        print(f"   ⚠️ WARNING: Segmentation failed. Zero rules extracted. Check regex.")
        return [{
            'source': f'{system_name} Committee', 'document_type': 'Operating Rule', 
            'title': rule_data['title'], 'rule_system': system_name, 'rule_number': '0.0', 
            'rule_title': 'Full Manual Text', 'rule_text': rulebook_text, 'category': 'Full Manual', 
            'effective_date': effective_date
        }]

    for rule_number, rule_content in matches:
        content_lines = rule_content.strip().split('\n', 1)
        rule_title = content_lines[0].strip() if content_lines else "Untitled Rule"
        rule_text = rule_content.strip()
        
        # Simple category inference (very basic and requires manual refinement)
        if rule_number.startswith('1'): category = 'General Responsibilities'
        elif rule_number.startswith('2'): category = 'Radio and Communication'
        elif rule_number.startswith('5') or rule_number.startswith('2'): category = 'Signals and Movement'
        elif rule_number.startswith('6') or rule_number.startswith('9'): category = 'Movement Authority'
        else: category = 'Miscellaneous'
             
        rules.append({
            'source': f'{system_name} Committee',
            'document_type': 'Operating Rule',
            'title': rule_data['title'],
            'rule_system': system_name,
            'rule_number': rule_number,
            'rule_title': rule_title,
            'rule_text': rule_text,
            'category': category,
            'effective_date': effective_date
        })
        
    print(f"Successfully segmented {len(rules)} rules for {system_name}.")
    return rules


# --- MAIN EXECUTION ---

def main():
    """Executes the complete data sourcing and saving process for all domains."""
    
    DB_NAME = get_db_name()
    NODE_ENV = os.getenv("NODE_ENV", "production")

    print("==================================================")
    print(f"   RAILLY: EXTERNAL KNOWLEDGE INGESTION ENGINE ({NODE_ENV.upper()})")
    print(f"   Target Database: {DB_NAME}")
    print("==================================================")
    
    if not MONGO_URI or not OPENAI_API_KEY:
        print("❌ CRITICAL ERROR: MONGO_URI or OPENAI_API_KEY environment variables are missing.")
        sys.exit(1)

    try:
        mongo = get_mongo_client()
        db = mongo[DB_NAME]
        collection = db[COLLECTION_NAME]
        openai_client = get_openai_client()
        
        print(f"✅ Connected to MongoDB ({DB_NAME}) and OpenAI.")
        
        # =======================================================
        # 1. INGEST 49 CFR REGULATIONS (MANDATE, DIRECTIVES)
        # =======================================================
        print(f"\n--- 🏛️  Ingesting FRA Regulations (49 CFR, Parts {TARGET_PARTS[0]} - {TARGET_PARTS[-1]}) ---")
        
        total_parts = len(TARGET_PARTS)
        for i, part in enumerate(TARGET_PARTS):
            print(f"[{i+1}/{total_parts}] ", end="", flush=True)
            fetch_and_process_cfr_part(part, collection, openai_client)
            time.sleep(0.5) # Short sleep to be polite to the government API
            
        # =======================================================
        # 2. INGEST FRA SAFETY GUIDANCE (ADVISORIES/BULLETINS)
        # =======================================================
        print(f"\n--- ⚠️  Ingesting FRA Safety Guidance (Advisories/Bulletins) ---")
        collection.delete_many({"source": "FRA", "document_type": "Safety Guidance"})

        fra_advisories = scrape_fra_advisories(FRA_ADVISORY_URL, 'Safety Advisory')
        fra_bulletins = scrape_fra_advisories(FRA_BULLETIN_URL, 'Technical Bulletin')
        
        all_fra_guidance = fra_advisories + fra_bulletins
        
        if all_fra_guidance:
            save_to_mongodb(collection, openai_client, all_fra_guidance)
        
        # =======================================================
        # 3. INGEST PROPRIETARY OPERATING RULES (GCOR/NORAC)
        # =======================================================
        print(f"\n--- 📜 Ingesting Proprietary Operating Rules ---")

        for rule_data in RULES_TO_PROCESS:
            # IDEMPOTENCY: Delete existing records for this system
            collection.delete_many({"rule_system": rule_data['system_name']})
            
            rules = process_operating_rules(rule_data)
            
            if rules:
                save_to_mongodb(collection, openai_client, rules)
            
        print("\n==================================================")
        print("   INGESTION COMPLETE")
        print("==================================================")

    except Exception as e:
        print(f"\n❌ FATAL ERROR during main execution: {e}")

if __name__ == "__main__":
    # Ensure environment is active and variables are set before running
    main()