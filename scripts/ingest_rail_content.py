import os
import sys
import requests
import json
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pymongo import MongoClient
from openai import OpenAI

# ==========================================
# 🧱 CONFIGURATION (PRODUCTION)
# ==========================================

# 1. DATABASE CONNECTION
# We use .strip() to handle accidental spaces common in Windows CMD 'set' commands
MONGO_URI = (os.getenv("MONGO_URI") or "").strip()
DB_NAME = "railnology" # UPDATED: Pointing to your Production DB
COLLECTION_NAME = "knowledge_chunks"

# 2. AI CONFIGURATION
OPENAI_API_KEY = (os.getenv("OPENAI_API_KEY") or "").strip()
EMBEDDING_MODEL = "text-embedding-3-small"

# Token Limit Safety: 
# The model supports 8192 tokens. 
# 1 token ~= 4 chars. 
# We set a conservative limit of 15,000 characters (~3,750 tokens) 
# to leave ample room for metadata overhead.
MAX_CHARS_PER_CHUNK = 15000 

# 3. DATA SOURCES
ECFR_API_URL = "https://www.ecfr.gov/api/renderer/v1/content/enhanced/current/title-49"

# 4. SCOPE: ENTIRE FRA (Chapter II)
TARGET_PARTS = list(range(200, 300))

# ==========================================
# 🛠️ HELPER FUNCTIONS
# ==========================================

def check_environment():
    """Checks if environment variables are set and prints instructions if missing."""
    missing = []
    if not MONGO_URI:
        missing.append("MONGO_URI")
    if not OPENAI_API_KEY:
        missing.append("OPENAI_API_KEY")
    
    if missing:
        print("\n❌ CRITICAL ERROR: Missing Environment Variables")
        print("------------------------------------------------")
        for var in missing:
            print(f"   • {var} is not set.")
        print("\n👉 HOW TO FIX (Windows CMD):")
        print(f"   set MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net")
        print(f"   set OPENAI_API_KEY=sk-your-key")
        print("   (Do not put spaces around the '=' sign)")
        print("------------------------------------------------\n")
        sys.exit(1)

def get_mongo_client():
    return MongoClient(MONGO_URI)

def get_openai_client():
    return OpenAI(api_key=OPENAI_API_KEY)

def split_large_text(text, limit=MAX_CHARS_PER_CHUNK):
    """
    Splits text into chunks small enough for the embedding model.
    If text exceeds the limit, it finds the nearest sentence ending to split safely.
    """
    if len(text) <= limit:
        return [text]
        
    chunks = []
    while len(text) > limit:
        # Try to find a period, newline, or space to split naturally
        # We look backwards from the limit to find the best break point
        split_idx = text.rfind('.', 0, limit)
        if split_idx == -1:
            split_idx = text.rfind('\n', 0, limit)
        if split_idx == -1:
            split_idx = text.rfind(' ', 0, limit)
        if split_idx == -1:
            # Hard split if no punctuation found (extremely rare)
            split_idx = limit
        
        # Extract chunk and remove from main text
        chunk = text[:split_idx+1].strip()
        if chunk:
            chunks.append(chunk)
        text = text[split_idx+1:].strip()
    
    if text:
        chunks.append(text)
        
    return chunks

def generate_embedding(client, text):
    """Generates a vector embedding for a given text string with retry logic."""
    text = text.replace("\n", " ")
    retries = 3
    
    for attempt in range(retries):
        try:
            # Slight delay to respect OpenAI Rate Limits (RPM)
            time.sleep(0.05) 
            response = client.embeddings.create(input=[text], model=EMBEDDING_MODEL)
            return response.data[0].embedding
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1) # Wait 1s before retry
                continue
            print(f"   ⚠️ Embedding API Error (Final): {e}")
            return []

def clean_xml_text(xml_string):
    """Parses the raw XML from eCFR and extracts clean text."""
    try:
        # Strip XML declaration if present
        if xml_string.strip().startswith("<?xml"):
            xml_string = xml_string.split("?>", 1)[-1]
        
        # Wrap in root to ensure valid XML parsing
        root = ET.fromstring(f"<root>{xml_string}</root>")
        return "".join(root.itertext()).strip()
    except ET.ParseError:
        return xml_string 

# ==========================================
# 📥 INGESTION LOGIC
# ==========================================

def fetch_and_process_cfr_part(part_number, mongo_collection, openai_client):
    url = f"{ECFR_API_URL}?part={part_number}"
    print(f"   Drafting GET request for Part {part_number}...")
    
    # IDEMPOTENCY: Delete existing entries for this part to prevent duplicates
    mongo_collection.delete_many({"part": part_number, "source": "FRA"})

    try:
        response = requests.get(url)
        
        if response.status_code == 404:
            print(f"   ℹ️ Part {part_number} does not exist (Reserved/Gap). Skipping.")
            return

        response.raise_for_status()
        
        raw_text = clean_xml_text(response.text)
        
        if len(raw_text) < 200 and "Reserved" in raw_text:
             print(f"   ℹ️ Part {part_number} is marked 'Reserved'. Skipping.")
             return

        # Split by Section Symbol (§)
        chunks = raw_text.split("§")
        
        operations = []
        print(f"   Processing {len(chunks)} sections...", end=" ")

        for chunk in chunks:
            if len(chunk) < 50: continue 
            
            base_section_text = "§" + chunk.strip()
            
            # Metadata Extraction
            parts = base_section_text.split(" ")
            section_id = parts[1] if len(parts) > 1 else "General"
            
            # SPLIT LOGIC: Handle content exceeding token limits
            sub_chunks = split_large_text(base_section_text)
            
            for i, sub_text in enumerate(sub_chunks):
                vector = generate_embedding(openai_client, sub_text)
                
                if not vector:
                    continue

                # Create a smart suffix for sub-chunks (e.g., 213.1, 213.1-part2)
                doc_section_id = section_id if len(sub_chunks) == 1 else f"{section_id}-part{i+1}"

                doc = {
                    "source": "FRA",
                    "document_type": "Regulation",
                    "title": "49 CFR",
                    "part": part_number,
                    "section_id": doc_section_id,
                    "text": sub_text,
                    "embedding": vector,
                    "last_updated": datetime.now(timezone.utc),
                    "url": f"https://www.ecfr.gov/current/title-49/part-{part_number}"
                }
                operations.append(doc)

            # Batch Insert (Chunks of 50)
            if len(operations) >= 50:
                mongo_collection.insert_many(operations)
                operations = []
                print(".", end="", flush=True)

        if operations:
            mongo_collection.insert_many(operations)
            
        print(f" ✅ Indexed.")

    except requests.exceptions.RequestException as e:
        print(f"   ❌ Network/API Error fetching Part {part_number}: {e}")

def process_private_manuals(mongo_collection, openai_client):
    print("\n--- 🔒 Processing Private Manuals (Skipping - Requires Licenses) ---")

def main():
    print("==================================================")
    print("   RAILNOLOGY: PRODUCTION INGESTION ENGINE        ")
    print("   Target: 49 CFR Parts 200 - 299                 ")
    print("   Database: Railnology                           ")
    print("==================================================")
    
    # 0. Check Windows Environment
    check_environment()

    try:
        mongo = get_mongo_client()
        db = mongo[DB_NAME]
        collection = db[COLLECTION_NAME]
        openai_client = get_openai_client()
        
        print(f"✅ Connected to MongoDB ({DB_NAME}) and OpenAI.")
        
        # 1. Ingest Public Data
        print(f"\n--- 🏛️  Ingesting FRA Regulations (Chapter II) ---")
        
        total_parts = len(TARGET_PARTS)
        for i, part in enumerate(TARGET_PARTS):
            print(f"[{i+1}/{total_parts}] ", end="")
            fetch_and_process_cfr_part(part, collection, openai_client)
            # Short sleep to be polite to the government API
            time.sleep(1.0)
            
        process_private_manuals(collection, openai_client)
        
        print("\n==================================================")
        print("   INGESTION COMPLETE")
        print("==================================================")

    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")

if __name__ == "__main__":
    main()