import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai'; // ✅ New Import

// --- CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI; 
if (MONGO_URI) {
    mongoose.connect(MONGO_URI, { dbName: 'railnology' })
    .then(() => console.log('✅ Connected to MongoDB Enterprise'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// --- AI CONFIGURATION ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- SCHEMAS ---

// 1. KNOWLEDGE BASE (Vector Store)
const KnowledgeChunkSchema = new mongoose.Schema({
  sourceType: String,
  content: String,
  embedding: [Number], // The Vector
  metadata: Object
});
// Note: 'knowledge_chunk' forces collection 'knowledge_chunks'
const KnowledgeChunk = mongoose.model('knowledge_chunk', KnowledgeChunkSchema);

// 2. OPERATIONS & USERS
const User = mongoose.model('User', new mongoose.Schema({ clerkId: { type: String, unique: true }, email: String, fullName: String, role: { type: String, default: 'individual' }, headline: String, location: String, about: String, companyName: String, jobTitle: String, experience: Array, education: Array, skills: [String], createdAt: { type: Date, default: Date.now } }));
const Crew = mongoose.model('Crew', new mongoose.Schema({ name: String, email: String, role: String, status: String, company: String, certification: String }));
const Schedule = mongoose.model('Schedule', new mongoose.Schema({ trainId: String, origin: String, destination: String, departureTime: Date, arrivalTime: Date, status: String, company: String, assignedCrew: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Crew' }] }));

// 3. STANDARD DATA
const Job = mongoose.model('Job', new mongoose.Schema({ title: String, company: String, location: String, salary: String, category: String, tags: [String], postedAt: { type: Date, default: Date.now }, externalLink: String, description: String, logo: String, jobType: String }));
const Glossary = mongoose.model('Glossary', new mongoose.Schema({ term: String, def: String, hasVisual: Boolean, visualTag: String, videoUrl: String }));
const Standard = mongoose.model('Standard', new mongoose.Schema({ code: String, title: String, description: String, agency: String, url: String }));
const Manual = mongoose.model('Manual', new mongoose.Schema({ title: String, category: String, version: String, url: String }));
const Regulation = mongoose.model('Regulation', new mongoose.Schema({ code: String, title: String, summary: String, effectiveDate: String, url: String }));
const Mandate = mongoose.model('Mandate', new mongoose.Schema({ title: String, deadline: String, description: String, url: String }));
const Signal = mongoose.model('Signal', new mongoose.Schema({ id: String, name: String, rule: String, colors: [String] }));

// --- API ENDPOINTS ---

// 🧠 AI CHAT ENDPOINT (RAG)
app.post('/api/chat', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });

    // 1. Embed the Question
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    const vector = embeddingResponse.data[0].embedding;

    // 2. Vector Search (Find relevant Manuals/Regs)
    const results = await KnowledgeChunk.aggregate([
      {
        "$vectorSearch": {
          "index": "default", // Matches the index name you created in Atlas
          "path": "embedding",
          "queryVector": vector,
          "numCandidates": 100,
          "limit": 3
        }
      },
      {
        "$project": {
          "_id": 0,
          "content": 1,
          "sourceType": 1,
          "score": { "$meta": "vectorSearchScore" }
        }
      }
    ]);

    // 3. Generate Answer with Context
    const context = results.map(r => `[Source: ${r.sourceType}] ${r.content}`).join("\n");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are Railnology AI, an expert railway compliance assistant. Answer questions using ONLY the provided context. If the answer is not in the context, state that you cannot find it in the current database. Keep answers concise and professional." },
        { role: "user", content: `Context:\n${context}\n\nQuestion: ${query}` }
      ]
    });

    res.json({ 
      answer: completion.choices[0].message.content,
      sources: results 
    });

  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "AI Service Unavailable", details: err.message });
  }
});

// RAILOPS
app.get('/api/crew', async (req, res) => res.json(await Crew.find()));
app.get('/api/schedules', async (req, res) => {
  const { type } = req.query;
  const filter = type === 'history' ? { status: 'History' } : { status: { $ne: 'History' } };
  const schedules = await Schedule.find(filter).populate('assignedCrew').sort({ departureTime: 1 });
  res.json(schedules);
});
app.post('/api/schedules/:id/assign', async (req, res) => {
  try {
    const { crewId } = req.body;
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule.assignedCrew) schedule.assignedCrew = [];
    if (!schedule.assignedCrew.some(id => id && id.toString() === crewId)) {
      schedule.assignedCrew.push(crewId);
      await schedule.save();
      await Crew.findByIdAndUpdate(crewId, { status: 'On Duty' });
    }
    res.json(await Schedule.findById(req.params.id).populate('assignedCrew'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/schedules/:id/unassign', async (req, res) => {
  try {
    const { crewId } = req.body;
    const schedule = await Schedule.findById(req.params.id);
    if (schedule.assignedCrew) {
      schedule.assignedCrew = schedule.assignedCrew.filter(id => id && id.toString() !== crewId);
      await schedule.save();
      await Crew.findByIdAndUpdate(crewId, { status: 'Available' });
    }
    res.json(await Schedule.findById(req.params.id).populate('assignedCrew'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// STANDARD ROUTES
app.get('/api/standards', async (req, res) => res.json(await Standard.find()));
app.get('/api/manuals', async (req, res) => res.json(await Manual.find()));
app.get('/api/regulations', async (req, res) => res.json(await Regulation.find()));
app.get('/api/mandates', async (req, res) => res.json(await Mandate.find()));
app.get('/api/glossary', async (req, res) => res.json(await Glossary.find()));
app.get('/api/signals', async (req, res) => res.json(await Signal.find()));
app.get('/api/jobs', async (req, res) => res.json(await Job.find().sort({ postedAt: -1 })));
app.post('/api/jobs', async (req, res) => { try { await new Job(req.body).save(); res.status(201).json({ok:true}); } catch(e){ res.status(400).json(e); }});

// USER ROUTES
app.get('/api/my-assignments', async (req, res) => {
  const { email } = req.query;
  const crewMember = await Crew.findOne({ email });
  if (!crewMember) return res.json([]);
  res.json(await Schedule.find({ assignedCrew: crewMember._id }).sort({ departureTime: 1 }));
});
app.post('/api/users/sync', async (req, res) => {
  const { clerkId, email, fullName } = req.body;
  try {
    let user = await User.findOne({ clerkId });
    if (!user) { user = new User({ clerkId, email, fullName }); await user.save(); }
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/users/:clerkId', async (req, res) => {
  try { const user = await User.findOne({ clerkId: req.params.clerkId }); res.json(user || {}); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/users/:clerkId', async (req, res) => {
  try { const user = await User.findOneAndUpdate({ clerkId: req.params.clerkId }, { $set: req.body }, { new: true }); res.json(user); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });