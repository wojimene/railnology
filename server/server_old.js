import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import OpenAI from 'openai';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Environment Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(express.json());
app.use(cors()); 

// Configuration
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DB_NAME = "railnology";
const COLLECTION_KNOWLEDGE = "knowledge_chunks";
const VECTOR_INDEX_NAME = "default"; 

if (!MONGO_URI || !OPENAI_API_KEY) {
  console.error("❌ FATAL ERROR: Missing MONGO_URI or OPENAI_API_KEY.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
let db;

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

const api = express.Router();

async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\n/g, " "),
  });
  return response.data[0].embedding;
}

// ==========================================
// 🧠 RAILLY CHAT (RAG + USAGE CONTROLS)
// ==========================================
api.post('/chat', async (req, res) => {
  try {
    const { query, filterPart, userId, deviceId } = req.body;
    
    if (!query) return res.status(400).json({ error: "Query required" });
    if (!userId || !deviceId) return res.status(400).json({ error: "User/Device identification required" });

    // 1. FETCH USER CONTEXT
    const users = db.collection('users');
    const user = await users.findOne({ clerkId: userId });

    if (!user) return res.status(404).json({ error: "User not found" });

    // 2. DEVICE CONCURRENCY CHECK
    // If the active device in DB doesn't match the requester, block access.
    if (user.activeDeviceId && user.activeDeviceId !== deviceId) {
        return res.status(409).json({ 
            error: "Session active on another device.",
            code: "DEVICE_CONFLICT" 
        });
    }

    // 3. USAGE LIMIT CHECK (10 per 24h)
    const now = new Date();
    const lastDate = user.lastQueryDate ? new Date(user.lastQueryDate) : new Date(0);
    const isSameDay = now.toDateString() === lastDate.toDateString();
    
    // Reset count if new day
    let currentCount = isSameDay ? (user.dailyQueryCount || 0) : 0;

    // Check Limit (10 for Free, Unlimited for Pro)
    // NOTE: In production, 'role' or a specific 'isPro' flag determines this.
    // For now, we assume 'company' role implies Pro, or check a flag.
    const isPro = user.role === 'company' || user.isPro === true;
    const DAILY_LIMIT = 10;

    if (!isPro && currentCount >= DAILY_LIMIT) {
        return res.status(402).json({ 
            error: "Daily limit reached.",
            code: "PAYMENT_REQUIRED"
        });
    }

    // 4. PERFORM VECTOR SEARCH
    console.log(`🔍 Railly Processing: "${query}" (Count: ${currentCount + 1}/${DAILY_LIMIT})`);
    
    const queryVector = await getEmbedding(query);
    const collection = db.collection(COLLECTION_KNOWLEDGE);
    
    const pipeline = [];
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
        searchStep["$vectorSearch"]["filter"] = { "part": { "$eq": filterPart } };
    }
    pipeline.push(searchStep);
    pipeline.push({
      "$project": {
        "_id": 0, "part": 1, "section_id": 1, "text": 1, "title": 1, "source_type": 1,
        "score": { "$meta": "vectorSearchScore" }
      }
    });
    
    const results = await collection.aggregate(pipeline).toArray();

    // 5. GENERATE ANSWER
    let contextText = results.length > 0 
        ? results.map(doc => `[Source: 49 CFR § ${doc.part}.${doc.section_id}]\n${doc.text}`).join("\n\n")
        : "No specific regulations found.";
    
    let sources = results.map(doc => ({ 
        part: doc.part, section: doc.section_id, title: doc.title, source_type: doc.source_type, score: doc.score 
    }));

    const systemPrompt = `You are Railly, an expert FRA compliance assistant. Use the CONTEXT to answer. Cite sources. CONTEXT: ${contextText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", 
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: query }],
      temperature: 0.1
    });

    // 6. UPDATE USAGE METRICS
    await users.updateOne(
        { clerkId: userId },
        { 
            $set: { 
                dailyQueryCount: currentCount + 1, 
                lastQueryDate: now,
                activeDeviceId: deviceId // Refresh active status
            } 
        }
    );

    res.json({ answer: completion.choices[0].message.content, sources });

  } catch (error) {
    console.error("❌ Chat Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==========================================
// 👤 USER MANAGEMENT & DEVICE CONTROL
// ==========================================

// Sync User (and initialize device)
api.post('/users/sync', async (req, res) => {
  try {
    const { clerkId, email, fullName, deviceId } = req.body;
    const users = db.collection('users');
    const existing = await users.findOne({ clerkId });
    
    if (existing) {
        // If syncing, we allow updating the active device logic here?
        // Usually sync happens on login. We can auto-claim device on login.
        if (deviceId) {
            await users.updateOne({ clerkId }, { $set: { activeDeviceId: deviceId } });
        }
        return res.json(existing);
    }
    
    const newUser = { 
        clerkId, email, fullName, 
        role: 'individual', 
        isPro: false,
        dailyQueryCount: 0,
        activeDeviceId: deviceId, // Set initial device
        createdAt: new Date() 
    };
    await users.insertOne(newUser);
    res.json(newUser);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Claim Device (Kick other sessions)
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

// --- STANDARD ENDPOINTS (Jobs, Glossary, etc.) ---
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
app.get('/', (req, res) => res.status(200).send('Railnology API is Live.'));
app.get('/health', (req, res) => res.status(200).send('OK'));
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));