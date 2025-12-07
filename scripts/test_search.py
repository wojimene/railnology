import os
import sys
from pymongo import MongoClient
from openai import OpenAI

# ==========================================
# 🔎 RAILNOLOGY SEARCH TESTER
# ==========================================

# 1. CONFIGURATION
MONGO_URI = (os.getenv("MONGO_URI") or "").strip()
OPENAI_API_KEY = (os.getenv("OPENAI_API_KEY") or "").strip()

# Database Config
# UPDATED: Matches your MongoDB Dashboard exactly (case-sensitive)
DB_NAME = "railnology" 
COLLECTION_NAME = "knowledge_chunks" 

# Vector Index Config
# UPDATED: Set back to 'default' per your Atlas configuration
VECTOR_INDEX_NAME = "default"

def check_environment():
    if not MONGO_URI or not OPENAI_API_KEY:
        print("❌ Error: Environment variables MONGO_URI or OPENAI_API_KEY are missing.")
        print("   Please run this using the 'run_test.bat' file or set them manually.")
        sys.exit(1)

def get_embedding(client, text):
    """Generates embedding for the search query."""
    text = text.replace("\n", " ")
    response = client.embeddings.create(input=[text], model="text-embedding-3-small")
    return response.data[0].embedding

def vector_search(collection, query_vector):
    """
    Performs a Vector Search using MongoDB Aggregation Pipeline.
    """
    pipeline = [
        {
            "$vectorSearch": {
                "index": VECTOR_INDEX_NAME, # Should be 'default'
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 100, 
                "limit": 3 
            }
        },
        {
            "$project": {
                "_id": 0,
                "part": 1,
                "section_id": 1,
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
        
        # Quick connection check
        count = collection.count_documents({})
        print(f"\n✅ Connected to {DB_NAME}.{COLLECTION_NAME}")
        print(f"📊 Total Knowledge Chunks: {count}")
        
        if count == 0:
            print("⚠️ WARNING: Collection is empty. Did you run the ingestion script?")
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    print("\n🚂 RAILNOLOGY AI SEARCH TEST")
    print("-----------------------------------")
    print(f"Using Index Name: '{VECTOR_INDEX_NAME}'")
    print("Type 'exit' to quit.\n")
    
    while True:
        query = input("Ask a compliance question: ")
        if query.lower() in ['exit', 'quit']:
            break
            
        print("   ... Searching Regulations ...")
        
        try:
            # 1. Convert Question to Vector
            query_vector = get_embedding(openai_client, query)
            
            # 2. Search Database
            results = vector_search(collection, query_vector)
            
            # 3. Print Results
            if not results:
                print(f"   ❌ No matches found via index '{VECTOR_INDEX_NAME}'.")
                print("      (Verify the index status is 'Active' in Atlas)")
            else:
                for i, doc in enumerate(results):
                    print(f"\n   [{i+1}] 49 CFR § {doc.get('part')}.{doc.get('section_id')} (Match: {doc.get('score', 0):.4f})")
                    # Preview first 300 chars
                    preview = doc.get('text', '')[:300].replace('\n', ' ')
                    print(f"       \"{preview}...\"")
                    
        except Exception as e:
            print(f"   ⚠️ Error: {e}")

if __name__ == "__main__":
    main()