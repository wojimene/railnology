import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import OpenAI from 'openai';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Environment Setup
// Removing complex path logic to prevent immediate server crash (Exit status 1)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// dotenv.config({ path: path.resolve(__dirname, '../.env') }); 

const app = express();
app.use(express.json());
app.use(cors()); 

// Configuration
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// --- QA ENVIRONMENT LOGIC ---
const NODE_ENV = process.env.NODE_ENV || 'production';
const IS_QA_ENV = NODE_ENV === 'qa';
// Database switching: Uses 'railnology_qa' database if NODE_ENV is set to 'qa'
const DB_NAME = IS_QA_ENV ? "railnology_qa" : "railnology"; 
const COLLECTION_KNOWLEDGE = "knowledge_chunks"; // Correct collection name
const VECTOR_INDEX_NAME = "default"; 

// Global list of authorized QA team emails (Load from ENV in production)
const QA_TEAM_EMAILS = [
    process.env.ADMIN_EMAIL, // Admin is always QA
    process.env.QA_MANAGER_EMAIL, // Set this in your .env file
    'tester@railnology.com' // Placeholder for QA colleague's email
].filter(Boolean);
// ----------------------------

// ===============================================
// CRITICAL: ROBUST OPENAI INITIALIZATION
// ===============================================

let openai;

if (!OPENAI_API_KEY) {
  console.error("❌ CRITICAL: OPENAI_API_KEY is MISSING. AI features will be disabled.");
  console.log(`🔑 OPENAI_API_KEY Status: MISSING.`);
} else {
    try {
        // Attempt to initialize OpenAI client
        openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        console.log(`🔑 OPENAI_API_KEY Status: Found (${OPENAI_API_KEY.length} chars).`);
    } catch (e) {
        console.error("❌ CRITICAL: OpenAI Client Initialization Failed (Check Key Validity).", e.message);
        openai = null; // Ensure openai remains null if initialization fails
    }
}
// ===============================================

let db;

// FIX: Added conditional MongoDB connection based on presence of MONGO_URI
if (MONGO_URI) {
    MongoClient.connect(MONGO_URI)
      .then(client => {
        db = client.db(DB_NAME);
        // FIX: Ensure the log shows the dynamically selected DB_NAME
        console.log(`✅ Connected to MongoDB Database: ${DB_NAME} (Environment: ${NODE_ENV.toUpperCase()})`);
        app.listen(PORT, () => console.log(`🚀 Railnology Server running on port ${PORT}`));
      })
      .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        // Do not exit process, just log error
        app.listen(PORT, () => console.log(`🚀 Railnology Server running on port ${PORT} (DB FAILED)`));
      });
} else {
    console.error("❌ CRITICAL: MONGO_URI is MISSING. Database features disabled.");
    // Start the server anyway for API key diagnostics
    app.listen(PORT, () => console.log(`🚀 Railnology Server running on port ${PORT} (DB MISSING)`));
}


const api = express.Router();

async function getEmbedding(text) {
  // CRITICAL CHECK: Ensure OpenAI object exists before calling it
  if (!openai) {
      console.error("❌ getEmbedding Failed: OpenAI client is not initialized.");
      return [];
  }
  
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.replace(/\n/g, " "),
    });
    return response.data[0].embedding;
  } catch (e) {
     // This catches network errors or invalid keys reported by the API call
     console.error("❌ Embedding Generation Failed:", e.message);
     return []; // Return empty array on failure
  }
}

// ==========================================
// 🧠 RAILLY CHAT (RAG + USAGE CONTROLS)
// ==========================================
api.post('/chat', async (req, res) => {
  try {
    const { query, filterDomain, userId, deviceId } = req.body; 
    
    if (!query) return res.status(400).json({ error: "Query required" });
    if (!userId || !deviceId) return res.status(400).json({ error: "User/Device identification required" });

    // 1. New Robustness Check for AI Status
    if (!openai) {
        console.error("❌ RAG ABORTED: OpenAI services are unavailable.");
        return res.status(200).json({ 
            answer: "System Error: Cannot connect to AI service. The server is misconfigured.", 
            sources: [] 
        });
    }

    // 1. FETCH USER CONTEXT
    const users = db.collection('users');
    const user = await users.findOne({ clerkId: userId });

    if (!user) return res.status(404).json({ error: "User not found" });

    // --- QA EXEMPTION CHECK ---
    const isQAUser = QA_TEAM_EMAILS.includes(user.email);
    // -------------------------

    // 2. DEVICE CONCURRENCY CHECK
    if (user.activeDeviceId && user.activeDeviceId !== deviceId) {
        return res.status(409).json({ 
            error: "Session active on another device.",
            code: "CONFLICT" 
        });
    }

    // 3. USAGE LIMIT CHECK (QA users and Pro users are exempt)
    const now = new Date();
    const lastDate = user.lastQueryDate ? new Date(user.lastQueryDate) : new Date(0);
    const isSameDay = now.toDateString() === lastDate.toDateString();
    
    let currentCount = isSameDay ? (user.dailyQueryCount || 0) : 0;
    const isPro = user.role === 'company' || user.isPro === true;
    const DAILY_LIMIT = 10;

    // Apply limit only if NOT QA and NOT Pro
    if (!isQAUser && !isPro && currentCount >= DAILY_LIMIT) { 
        return res.status(402).json({ 
            error: "Daily limit reached.",
            code: "PAYMENT_REQUIRED"
        });
    }

    // 4. PERFORM PURE VECTOR SEARCH (Stable Production RAG)
    console.log(`🔍 Raillie Processing: "${query}" (Domain: ${filterDomain || 'All'}) (User: ${user.email})`);
    
    const queryVector = await getEmbedding(query);
    
    // --- CRITICAL DEBUG CHECK ---
    if (!queryVector || queryVector.length === 0) {
        console.log("❌ RAG ABORTED: Query vector is empty. Check OpenAI API key or network connection.");
        // This clean return prevents the downstream MongoDB call from crashing the server
        return res.status(200).json({ 
            answer: "Error: Could not process query vector. Please check the backend connection or API key.", 
            sources: [] 
        });
    }
    // ----------------------------
    
    // Check if database connection is available before trying to query
    if (!db) {
         console.error("❌ RAG ABORTED: Database connection is not available.");
         return res.status(200).json({ 
            answer: "Error: Database connection is unavailable. Cannot perform vector search.", 
            sources: [] 
        });
    }


    const collection = db.collection(COLLECTION_KNOWLEDGE); 
    
    const pipeline = [];
    let domainFilter = {};

    // Determine the required filter logic for the $match stage (post vector search)
    if (filterDomain) {
        if (String(filterDomain).match(/^\d+$/)) { 
            // CFR PART filter (e.g., filterDomain = "213")
            domainFilter = { "document_type": "Regulation", "part": { "$eq": Number(filterDomain) } };
        } else if (filterDomain === "GCOR" || filterDomain === "NORAC") {
            // Operating Rule System filter
            domainFilter = { "document_type": "Operating Rule", "rule_system": { "$eq": filterDomain } };
        } else if (filterDomain === "ADVISORY") {
            // FRA Guidance filter
            domainFilter = { "document_type": "Safety Guidance", "source": "FRA" };
        }
    }
    
    // A. Vector Search Step (Semantic Search)
    pipeline.push({
      "$vectorSearch": {
        "index": VECTOR_INDEX_NAME,
        "path": "embedding",
        "queryVector": queryVector,
        // Reduced pool for speed and stability
        "numCandidates": 10, 
        "limit": 5, // Find 5 candidates based on vector search
        // NOTE: The $filter stage is REMOVED to avoid the index crash.
      }
    });
    
    // B. Filtering Stage (REINTRODUCED AS $MATCH)
    // Only apply the match filter if a specific domain was requested.
    if (Object.keys(domainFilter).length > 0) {
        pipeline.push({ "$match": domainFilter });
    }

    // C. Final Projection
    // Final limit after matching (ensures we only pass 3 relevant chunks to the LLM)
    pipeline.push({ "$limit": 3 }); 

    pipeline.push({
      "$project": {
        "_id": 0, "part": 1, "section_id": 1, "text": 1, "title": 1, "document_type": 1, "rule_system": 1, "doc_type": 1,
        "score": { "$meta": "vectorSearchScore" }
      }
    });
    
    // Using standard aggregate without maxTimeMS override for Production stability
    const results = await collection.aggregate(pipeline).toArray();
    
    // DEBUG LOGGING: Log the result count to diagnose RAG failures
    console.log(`🔎 MongoDB Vector Search Results Found: ${results.length} chunks.`);

    // --- 5. GENERATE ANSWER ---
    let sources = [];
    let contextText = results.length > 0 
        ? results.map(doc => {
            let sourceId;
            if (doc.document_type === "Regulation") {
                sourceId = `49 CFR § ${doc.part}.${doc.section_id}`;
            } else if (doc.document_type === "Operating Rule") {
                sourceId = `${doc.rule_system} Rule ${doc.section_id.split('_p')[0].split('_').pop()}`; // Clean rule ID: GCOR_6.27_p1 -> 6.27
            } else if (doc.document_type === "Safety Guidance") {
                sourceId = `${doc.doc_type} Ref: ${doc.title.substring(0, 30)}...`;
            } else {
                sourceId = doc.title || "Industry Info";
            }
            
            sources.push({ sourceId: sourceId, sourceType: doc.document_type, ...doc });
            
            return `[Source: ${sourceId}]\n${doc.text}`;
        }).join("\n\n")
        : "No specific regulations or rules found in the selected domain. Please try selecting a more focused domain filter.";

    // If context is empty, return the client-side error message immediately without calling OpenAI.
    if (results.length === 0) {
        return res.status(200).json({ answer: "I'm having trouble connecting to the knowledge base.", sources: [] });
    }
    
    // Updated prompt with Raillie name
    const systemPrompt = `You are Raillie, an expert FRA compliance and rail operations assistant. Use the CONTEXT to answer. Cite the specific Source ID provided in the context text, including the rule number or section. CONTEXT: ${contextText}`;

    const completion = await openai.chat.completions.create({
      // CRITICAL FIX: Switching to a stable OpenAI model
      model: "gpt-4o-mini", 
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: query }],
      // OPTIMIZATION: Increased temperature for better reasoning and synthesis
      temperature: 0.6
    });

    // 6. UPDATE USAGE METRICS (Skip increment for QA users)
    let updateFields = { lastQueryDate: now, activeDeviceId: deviceId };
    
    if (!isQAUser) { // Only increment the count if the user is NOT a QA user
        updateFields.dailyQueryCount = currentCount + 1;
    }

    await users.updateOne(
        { clerkId: userId },
        { $set: updateFields }
    );

    res.json({ answer: completion.choices[0].message.content, sources });

  } catch (error) {
    console.error("❌ Chat Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==========================================
// ⚙️ DIAGNOSTIC ENDPOINT
// ==========================================
api.get('/diag/db', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ error: "Database connection not initialized." });
        }
        
        // List all collection names in the current connected database
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        const knowledgeCollectionExists = collectionNames.includes(COLLECTION_KNOWLEDGE);

        let knowledgeCount = 0;
        if (knowledgeCollectionExists) {
            knowledgeCount = await db.collection(COLLECTION_KNOWLEDGE).countDocuments({});
        }

        res.json({
            status: "OK",
            db_name: DB_NAME,
            expected_knowledge_collection: COLLECTION_KNOWLEDGE,
            knowledge_collection_exists: knowledgeCollectionExists,
            knowledge_document_count: knowledgeCount,
            all_collections_found: collectionNames,
            environment: NODE_ENV.toUpperCase(),
        });

    } catch (e) {
        console.error("❌ Diagnostic Error:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// ... (Other standard endpoints remain unchanged)

api.post('/users/sync', async (req, res) => {
  try {
    const { clerkId, email, fullName, deviceId } = req.body;
    const users = db.collection('users');
    const existing = await users.findOne({ clerkId });
    
    if (existing) {
        if (deviceId) {
            await users.updateOne({ clerkId }, { $set: { activeDeviceId: deviceId } });
        }
        return res.json(existing);
    }
    
    // Check if new user email is a known QA tester email
    const isQA = QA_TEAM_EMAILS.includes(email);

    const newUser = { 
        clerkId, email, fullName, 
        role: isQA ? 'qa' : 'individual', // Optional: Tag QA users in DB for future filtering
        isPro: false,
        dailyQueryCount: 0,
        activeDeviceId: deviceId, // Set initial device
        createdAt: new Date() 
    };
    await users.insertOne(newUser);
    res.json(newUser);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.post('/users/claim-device', async (req, res) => {
    try {
        const { userId, deviceId } = req.body;
        if (!userId || !deviceId) return res.status(400).json({ error: "Missing data" });

        await db.collection('users').updateOne(
            { clerkId: userId },
            { $set: { activeDeviceId: deviceId } }
        );
        res.json({ success: true, message: "Device claimed successfully." });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- STANDARD ENDPOINTS ---
api.get('/jobs', async (req, res) => {
  const jobs = await db.collection('jobs').find({}).sort({ postedAt: -1 }).toArray();
  res.json(jobs);
});
api.post('/jobs', async (req, res) => {
  const newJob = { ...req.body, postedAt: new Date() };
  await db.collection('jobs').insertOne(newJob);
  res.json(newJob);
});
api.get('/glossary', async (req, res) => {
  const terms = await db.collection('glossary').find({}).toArray();
  res.json(terms);
});
api.get('/signals', async (req, res) => {
  const signals = await db.collection('signals').find({}).toArray();
  res.json(signals);
});
api.get('/schedules', async (req, res) => {
  const schedules = await db.collection('schedules').find({}).toArray();
  res.json(schedules);
});
api.get('/crew', async (req, res) => {
  const crew = await db.collection('crew').find({}).toArray();
  res.json(crew);
});
api.post('/schedules/:id/assign', async (req, res) => {
  const { crewId } = req.body;
  const crewMember = await db.collection('crew').findOne({ _id: new ObjectId(crewId) });
  await db.collection('schedules').updateOne({ _id: new ObjectId(req.params.id) }, { $push: { assignedCrew: crewMember } });
  res.json({ success: true });
});
api.post('/schedules/:id/unassign', async (req, res) => {
  const { crewId } = req.body;
  await db.collection('schedules').updateOne({ _id: new ObjectId(req.params.id) }, { $pull: { assignedCrew: { _id: crewId } } }); // Loose match for ID
  res.json({ success: true });
});
api.get('/my-assignments', async (req, res) => {
  const schedules = await db.collection('schedules').find({}).toArray();
  res.json(schedules); 
});

// Mount & Error Handling
app.use('/api', api);
app.get('/', (req, res) => res.status(200).send(`Railnology API is Live. Environment: ${NODE_ENV.toUpperCase()}`));
app.get('/health', (req, res) => res.status(200).send('OK'));
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));