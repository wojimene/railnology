import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
// Load environment variables from .env file (for Local Development)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION ---
// ✅ SECURE: Uses process.env.MONGO_URI (Works on Render & Local with .env)
const MONGO_URI = process.env.MONGO_URI; 

if (!MONGO_URI) {
  console.error("❌ Error: MONGO_URI is missing. Check your .env file or Render Environment Variables.");
  // We don't exit here to allow the build to pass, but the app won't connect.
}

if (MONGO_URI) {
    // ⚡ Force connection to 'railnology' database
    mongoose.connect(MONGO_URI, { dbName: 'railnology' })
    .then(() => {
        console.log('✅ Connected to MongoDB Enterprise');
        console.log(`   -> Host: ${mongoose.connection.host}`);
        console.log(`   -> Database: ${mongoose.connection.name}`); 
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// --- SCHEMAS ---
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

// Debug Route
app.get('/api/debug', (req, res) => {
  res.json({
    status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    host: mongoose.connection.host,
    dbName: mongoose.connection.name,
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