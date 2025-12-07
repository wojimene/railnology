import dotenv from 'dotenv';
dotenv.config(); // Load environment variables immediately

import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import OpenAI from 'openai';
import cors from 'cors';

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // In production, you might restrict this to your frontend domain

// ==========================================
// 1. SERVER CONFIGURATION
// ==========================================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Database Constants (Must match your Ingestion Script)
const DB_NAME = "Railnology";
const COLLECTION_KNOWLEDGE = "knowledge_chunks";
const VECTOR_INDEX_NAME = "default"; 

// Validation
if (!MONGO_URI || !OPENAI_API_KEY) {
  console.error("❌ FATAL ERROR: Missing MONGO_URI or OPENAI_API_KEY in environment variables.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
let db;

// ==========================================
// 2. DATABASE CONNECTION
// ==========================================
// Using Native Driver for best performance with Vector Search
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
// 3. AI HELPER FUNCTIONS
// ==========================================

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

// ==========================================
// 4. AI FEATURE: RAILLY CHAT (RAG)
// ==========================================

app.post('/chat', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });

    console.log(`🔍 Railly Processing: "${query}"`);

    // Step A: Vector Search (Retrieve Context)
    const queryVector = await getEmbedding(query);
    const collection = db.collection(COLLECTION_KNOWLEDGE);
    
    // Atlas Vector Search Aggregation
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

    // Step B: Build Context String
    let contextText = "";
    let sources = [];

    if (results.length > 0) {
      contextText = results.map(doc => `[Source: 49 CFR § ${doc.part}.${doc.section_id}]\n${doc.text}`).join("\n\n");
      sources = results.map(doc => ({ part: doc.part, section: doc.section_id, score: doc.score }));
    } else {
      contextText = "No specific regulations found in the database matching this query.";
    }

    // Step C: Generate Answer with GPT
    const systemPrompt = `
      You are Railly, an expert Federal Railroad Administration (FRA) compliance assistant.
      
      INSTRUCTIONS:
      1. Use the provided "CONTEXT" from 49 CFR regulations to answer the user's question.
      2. Always cite your sources explicitly in the text (e.g., "According to § 213.9...").
      3. If the answer isn't in the context, admit it politely and offer general knowledge, but verify that it's general knowledge.
      4. Keep answers professional, concise, and safety-focused.
      
      CONTEXT:
      ${contextText}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.1 // Low temperature for factual consistency
    });

    res.json({ answer: completion.choices[0].message.content, sources });

  } catch (error) {
    console.error("❌ Chat Endpoint Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==========================================
// 5. CORE PLATFORM FEATURES
// ==========================================

// --- JOBS ---
app.get('/jobs', async (req, res) => {
  try {
    const jobs = await db.collection('jobs').find({}).sort({ postedAt: -1 }).toArray();
    res.json(jobs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/jobs', async (req, res) => {
  try {
    const newJob = { ...req.body, postedAt: new Date() };
    const result = await db.collection('jobs').insertOne(newJob);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- GLOSSARY & SIGNALS ---
app.get('/glossary', async (req, res) => {
  try {
    const terms = await db.collection('glossary').find({}).toArray();
    res.json(terms);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/signals', async (req, res) => {
  try {
    const signals = await db.collection('signals').find({}).toArray();
    res.json(signals);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- RAILOPS: SCHEDULES & CREW ---
app.get('/schedules', async (req, res) => {
  try {
    const schedules = await db.collection('schedules').find({}).toArray();
    res.json(schedules);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/crew', async (req, res) => {
  try {
    const crew = await db.collection('crew').find({}).toArray();
    res.json(crew);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Assign Crew
app.post('/schedules/:id/assign', async (req, res) => {
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

// Unassign Crew
app.post('/schedules/:id/unassign', async (req, res) => {
  try {
    const { crewId } = req.body;
    const scheduleId = req.params.id;
    
    // Attempt removal by ObjectId first, then string fallback
    await db.collection('schedules').updateOne(
      { _id: new ObjectId(scheduleId) },
      { $pull: { assignedCrew: { _id: new ObjectId(crewId) } } } 
    );
    
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- USER MANAGEMENT ---
app.post('/users/sync', async (req, res) => {
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

app.put('/users/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const updateData = req.body;
    delete updateData._id; 
    
    await db.collection('users').updateOne({ clerkId }, { $set: updateData });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/my-assignments', async (req, res) => {
  try {
    const { email } = req.query;
    // Returns all schedules for MVP. In full prod, filter by: { "assignedCrew.email": email }
    const schedules = await db.collection('schedules').find({}).toArray();
    res.json(schedules); 
  } catch (e) { res.status(500).json({ error: e.message }); }
});