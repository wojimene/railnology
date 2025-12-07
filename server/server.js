import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import OpenAI from 'openai';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ==========================================
// 🔧 ENVIRONMENT SETUP
// ==========================================

// 1. Resolve current directory for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Load .env from the ROOT directory (one level up)
// This fixes the "Missing MONGO_URI" error by finding your existing .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// ==========================================
// 1. SERVER CONFIGURATION
// ==========================================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Database Constants
const DB_NAME = "Railnology";
const COLLECTION_KNOWLEDGE = "knowledge_chunks";
const VECTOR_INDEX_NAME = "default"; 

// Validation
if (!MONGO_URI || !OPENAI_API_KEY) {
  console.error("❌ FATAL ERROR: Missing MONGO_URI or OPENAI_API_KEY.");
  console.error(`   Checked for .env at: ${path.resolve(__dirname, '../.env')}`);
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
let db;

// ==========================================
// 2. DATABASE CONNECTION
// ==========================================
MongoClient.connect(MONGO_URI)
  .then(client => {
    db = client.db(DB_NAME);
    console.log(`✅ Connected to MongoDB Database: ${DB_NAME}`);
    app.listen(PORT, () => console.log(`🚀 Railnology Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// ==========================================
// 3. API ROUTER (Prefix: /api)
// ==========================================
const api = express.Router();

// --- AI HELPER ---
async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.replace(/\n/g, " "),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("⚠️ OpenAI Embedding Error:", error);
    throw error;
  }
}

// --- RAILLY CHAT ENDPOINT (RAG) ---
api.post('/chat', async (req, res) => {
  try {
    const { query, filterPart } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });

    console.log(`🔍 Railly Processing: "${query}" ${filterPart ? `[Filter: Part ${filterPart}]` : ''}`);

    const queryVector = await getEmbedding(query);
    const collection = db.collection(COLLECTION_KNOWLEDGE);
    
    // Construct Aggregation Pipeline
    const pipeline = [];

    // Vector Search Step
    const searchStep = {
      "$vectorSearch": {
        "index": VECTOR_INDEX_NAME,
        "path": "embedding",
        "queryVector": queryVector,
        "numCandidates": 100,
        "limit": 3
      }
    };

    if (filterPart) {
        searchStep["$vectorSearch"]["filter"] = {
            "part": { "$eq": filterPart } 
        };
    }

    pipeline.push(searchStep);

    // Projection
    pipeline.push({
      "$project": {
        "_id": 0,
        "part": 1,
        "section_id": 1,
        "text": 1,
        "score": { "$meta": "vectorSearchScore" }
      }
    });
    
    const results = await collection.aggregate(pipeline).toArray();

    // Context Building
    let contextText = "";
    let sources = [];

    if (results.length > 0) {
      contextText = results.map(doc => `[Source: 49 CFR § ${doc.part}.${doc.section_id}]\n${doc.text}`).join("\n\n");
      sources = results.map(doc => ({ part: doc.part, section: doc.section_id, score: doc.score }));
    } else {
      contextText = "No specific regulations found matching this query.";
    }

    // GPT Prompt
    const systemPrompt = `
      You are Railly, an expert Federal Railroad Administration (FRA) compliance assistant.
      INSTRUCTIONS:
      1. Use the provided "CONTEXT" from 49 CFR regulations to answer.
      2. If a specific Part (e.g., Part ${filterPart}) was requested, prioritize that context.
      3. Cite your sources explicitly (e.g., "According to § 213.9...").
      4. If the answer isn't in the context, admit it politely.
      
      CONTEXT:
      ${contextText}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.1
    });

    res.json({ answer: completion.choices[0].message.content, sources });

  } catch (error) {
    console.error("❌ Chat Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- CORE PLATFORM ENDPOINTS ---

api.get('/jobs', async (req, res) => {
  try {
    const jobs = await db.collection('jobs').find({}).sort({ postedAt: -1 }).toArray();
    res.json(jobs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.post('/jobs', async (req, res) => {
  try {
    const newJob = { ...req.body, postedAt: new Date() };
    const result = await db.collection('jobs').insertOne(newJob);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.get('/glossary', async (req, res) => {
  try {
    const terms = await db.collection('glossary').find({}).toArray();
    res.json(terms);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.get('/signals', async (req, res) => {
  try {
    const signals = await db.collection('signals').find({}).toArray();
    res.json(signals);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.get('/schedules', async (req, res) => {
  try {
    const schedules = await db.collection('schedules').find({}).toArray();
    res.json(schedules);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.get('/crew', async (req, res) => {
  try {
    const crew = await db.collection('crew').find({}).toArray();
    res.json(crew);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.post('/schedules/:id/assign', async (req, res) => {
  try {
    const { crewId } = req.body;
    const scheduleId = req.params.id;
    const crewMember = await db.collection('crew').findOne({ _id: new ObjectId(crewId) });
    if (!crewMember) return res.status(404).json({error: "Crew not found"});

    await db.collection('schedules').updateOne(
      { _id: new ObjectId(scheduleId) },
      { $push: { assignedCrew: crewMember } }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.post('/schedules/:id/unassign', async (req, res) => {
  try {
    const { crewId } = req.body;
    const scheduleId = req.params.id;
    await db.collection('schedules').updateOne(
      { _id: new ObjectId(scheduleId) },
      { $pull: { assignedCrew: { _id: new ObjectId(crewId) } } } 
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.post('/users/sync', async (req, res) => {
  try {
    const { clerkId, email, fullName } = req.body;
    const users = db.collection('users');
    const existing = await users.findOne({ clerkId });
    if (existing) return res.json(existing);
    const newUser = { clerkId, email, fullName, role: 'individual', createdAt: new Date() };
    await users.insertOne(newUser);
    res.json(newUser);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.put('/users/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const updateData = req.body;
    delete updateData._id; 
    await db.collection('users').updateOne({ clerkId }, { $set: updateData });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.get('/my-assignments', async (req, res) => {
  try {
    const schedules = await db.collection('schedules').find({}).toArray();
    res.json(schedules); 
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 4. MOUNT ROUTER
// ==========================================
app.use('/api', api);

app.get('/', (req, res) => res.status(200).send('Railnology API is Live.'));
app.get('/health', (req, res) => res.status(200).send('OK'));

app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));