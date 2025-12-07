import os
import sys
from pymongo import MongoClient
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

# ==========================================
# 🔧 ENVIRONMENT SETUP
# ==========================================

# 1. Locate the .env file in the ROOT directory
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent
env_path = root_dir / '.env'

print(f"🔍 Looking for .env at: {env_path}")

# 2. Load environment variables
load_dotenv(dotenv_path=env_path, override=True)

# ==========================================
# 🔎 RAILNOLOGY SEARCH TESTER
# ==========================================

# 3. CONFIGURATION
MONGO_URI = (os.getenv("MONGO_URI") or "").strip()
OPENAI_API_KEY = (os.getenv("OPENAI_API_KEY") or "").strip()

# Database Config
DB_NAME = "railnology" 
COLLECTION_NAME = "knowledge_chunks" 
VECTOR_INDEX_NAME = "default"

def check_environment():
    if not MONGO_URI or not OPENAI_API_KEY:
        print("\n❌ CRITICAL ERROR: Missing Keys")
        print(f"   The script found the .env file at {env_path}, but it didn't contain the keys.")
        print("   Please check that 'MONGO_URI' and 'OPENAI_API_KEY' are saved in that file.")
        sys.exit(1)

def get_embedding(client, text):
    text = text.replace("\n", " ")
    response = client.embeddings.create(input=[text], model="text-embedding-3-small")
    return response.data[0].embedding

def vector_search(collection, query_vector):
    pipeline = [
        {
            "$vectorSearch": {
                "index": VECTOR_INDEX_NAME,
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 100, 
                "limit": 3 
            }
        },
        {
            "$project": {
                "_id": 0,
                "title": 1,
                "section_id": 1,
                "part": 1,
                "text": 1,
                "score": { "$meta": "vectorSearchScore" }
            }
        }
    ]
    return list(collection.aggregate(pipeline))

def main():
    check_environment()
    
    try:
        mongo = MongoClient(MONGO_URI)
        db = mongo[DB_NAME]
        collection = db[COLLECTION_NAME]
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        
        count = collection.count_documents({})
        print(f"✅ Connected to {DB_NAME}.{COLLECTION_NAME}")
        print(f"📊 Total Knowledge Chunks: {count}")
        
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    print("\n🚂 RAILNOLOGY AI SEARCH TEST")
    print("-----------------------------------")
    print("Type 'exit' to quit.\n")
    
    while True:
        query = input("Ask Railly a question: ")
        if query.lower() in ['exit', 'quit']:
            break
            
        print("   ... Thinking ...")
        
        try:
            query_vector = get_embedding(openai_client, query)
            results = vector_search(collection, query_vector)
            
            if not results:
                print(f"   ❌ No matches found via index '{VECTOR_INDEX_NAME}'.")
            else:
                for i, doc in enumerate(results):
                    source_label = f"§ {doc.get('part')}.{doc.get('section_id')}"
                    if doc.get('part') == 0:
                        source_label = f"INDUSTRY INTEL: {doc.get('title')}"

                    print(f"\n   [{i+1}] {source_label} (Match: {doc.get('score', 0):.4f})")
                    print(f"       \"{doc.get('text', '')[:200].replace(chr(10), ' ')}...\"")
                    
        except Exception as e:
            print(f"   ⚠️ Error: {e}")

if __name__ == "__main__":
    main()