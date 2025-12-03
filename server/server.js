import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION ---
// Use the environment variable (Production) OR the local string (Development)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://wsg_db_user:dRXAM6L3KjaYAdKE@cluster0.dz1naih.mongodb.net/?appName=Cluster0"'

if (!MONGO_URI) {
  console.error("❌ Error: MONGO_URI is missing.");
}

if (MONGO_URI) {
    // ⚡ THE FIX: We explicitly add { dbName: 'railnology' } here.
    // This ensures the app reads from the same place the seeder wrote to.
    mongoose.connect(MONGO_URI, { dbName: 'railnology' })
    .then(() => {
        console.log('✅ Connected to MongoDB Enterprise');
        console.log(`   -> Host: ${mongoose.connection.host}`);
        console.log(`   -> Database: ${mongoose.connection.name}`); // Verify this says 'railnology'
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// --- SCHEMAS (Must match Seed) ---
const JobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  salary: String,
  category: String,
  tags: [String]
});

const GlossarySchema = new mongoose.Schema({
  term: String,
  def: String,
  hasVisual: Boolean,
  visualTag: String,
  videoUrl: String 
});

const SignalSchema = new mongoose.Schema({
  id: String,
  name: String,
  rule: String,
  colors: [String]
});

const Job = mongoose.model('Job', JobSchema);
const Glossary = mongoose.model('Glossary', GlossarySchema);
const Signal = mongoose.model('Signal', SignalSchema);

// --- API ENDPOINTS ---

// 🔍 DEBUG ENDPOINT: Visit /api/debug to see connection details
app.get('/api/debug', (req, res) => {
  res.json({
    status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    host: mongoose.connection.host,
    dbName: mongoose.connection.name, // <--- This is the source of truth
    envPort: process.env.PORT,
    mongoUriProvided: !!process.env.MONGO_URI
  });
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ _id: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/glossary', async (req, res) => {
  try {
    const terms = await Glossary.find().sort({ term: 1 });
    res.json(terms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/signals', async (req, res) => {
  try {
    const signals = await Signal.find();
    res.json(signals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Write Endpoints (Admin)
app.post('/api/jobs', async (req, res) => {
  try {
    const newJob = new Job(req.body);
    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/glossary', async (req, res) => {
  try {
    const newTerm = new Glossary(req.body);
    await newTerm.save();
    res.status(201).json(newTerm);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});