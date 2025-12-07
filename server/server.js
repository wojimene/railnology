import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import OpenAI from 'openai';
import cors from 'cors';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// ==========================================
// 1. CONFIGURATION
// ==========================================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const DB_NAME = "Railnology";
const COLLECTION_KNOWLEDGE = "knowledge_chunks";
const VECTOR_INDEX_NAME = "default"; 

if (!MONGO_URI || !OPENAI_API_KEY) {
  console.error("❌ FATAL ERROR: Missing MONGO_URI or OPENAI_API_KEY.");
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
    console.log(`✅ Connected to MongoDB: ${DB_NAME}`);
    app.listen(PORT, () => console.log(`🚀 Railnology Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  });

// ==========================================
// 3. API ROUTER (Prefix: /api)
// ==========================================
// We use a Router to group all endpoints under '/api'
// This fixes the 404 errors you were seeing on the frontend
const api = express.Router();

// --- AI HELPER ---
async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\n/g, " "),
  });
  return response.data[0].embedding;
}

// --- CHAT ENDPOINT ---
api.post('/chat', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });

    const queryVector = await getEmbedding(query);
    const collection = db.collection(COLLECTION_KNOWLEDGE);
    
    const results = await collection.aggregate([
      {
        "$vectorSearch": {
          "index": VECTOR_INDEX_NAME,
          "path": "embedding",
          "queryVector": queryVector,
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
    ]).toArray();

    let contextText = "";
    let sources = [];

    if (results.length > 0) {
      contextText = results.map(doc => `[Source: 49 CFR § ${doc.part}.${doc.section_id}]\n${doc.text}`).join("\n\n");
      sources = results.map(doc => ({ part: doc.part, section: doc.section_id, score: doc.score }));
    } else {
      contextText = "No specific regulations found in the database matching this query.";
    }

    const systemPrompt = `
      You are Railly, an expert Federal Railroad Administration (FRA) compliance assistant.
      INSTRUCTIONS:
      1. Use the provided "CONTEXT" from 49 CFR regulations.
      2. Always cite your sources explicitly (e.g., "According to § 213.9...").
      3. If the answer isn't in the context, admit it politely.
      
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
    console.error("❌ Chat Endpoint Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- CORE PLATFORM ENDPOINTS ---

// Jobs
api.get('/jobs', async (req, res) => {
  const jobs = await db.collection('jobs').find({}).sort({ postedAt: -1 }).toArray();
  res.json(jobs);
});

api.post('/jobs', async (req, res) => {
  const newJob = { ...req.body, postedAt: new Date() };
  const result = await db.collection('jobs').insertOne(newJob);
  res.json(result);
});

// Glossary & Signals
api.get('/glossary', async (req, res) => {
  const terms = await db.collection('glossary').find({}).toArray();
  res.json(terms);
});

api.get('/signals', async (req, res) => {
  const signals = await db.collection('signals').find({}).toArray();
  res.json(signals);
});

// RailOps
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
  const scheduleId = req.params.id;
  const crewMember = await db.collection('crew').findOne({ _id: new ObjectId(crewId) });
  if (!crewMember) return res.status(404).json({error: "Crew not found"});

  await db.collection('schedules').updateOne(
    { _id: new ObjectId(scheduleId) },
    { $push: { assignedCrew: crewMember } }
  );
  res.json({ success: true });
});

api.post('/schedules/:id/unassign', async (req, res) => {
  const { crewId } = req.body;
  const scheduleId = req.params.id;
  await db.collection('schedules').updateOne(
    { _id: new ObjectId(scheduleId) },
    { $pull: { assignedCrew: { _id: new ObjectId(crewId) } } } 
  );
  res.json({ success: true });
});

// User Management
api.post('/users/sync', async (req, res) => {
  const { clerkId, email, fullName } = req.body;
  const users = db.collection('users');
  const existing = await users.findOne({ clerkId });
  
  if (existing) return res.json(existing);
  
  const newUser = { clerkId, email, fullName, role: 'individual', createdAt: new Date() };
  await users.insertOne(newUser);
  res.json(newUser);
});

api.put('/users/:clerkId', async (req, res) => {
  const { clerkId } = req.params;
  const updateData = req.body;
  delete updateData._id; 
  await db.collection('users').updateOne({ clerkId }, { $set: updateData });
  res.json({ success: true });
});

api.get('/my-assignments', async (req, res) => {
  const schedules = await db.collection('schedules').find({}).toArray();
  res.json(schedules); 
});

// ==========================================
// 4. MOUNT ROUTER & ERROR HANDLING
// ==========================================

// Mount all routes under /api
app.use('/api', api);

// Root Health Check (Good for Render pings)
app.get('/', (req, res) => {
  res.status(200).send('Railnology API is Live. Use endpoints at /api/...');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 404 Handler (Prevents HTML response on missing routes)
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});