import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); // Allows your React app to talk to this server
app.use(express.json());

// --- MONGODB CONNECTION ---
// PASTE YOUR MONGODB CONNECTION STRING HERE
const MONGO_URI = 'mongodb://admin1:gRRE0ua7R0GWidQmZr1hVIJmDksoZeycxo5Xt6n-zuGn3oFx@13eb9c56-ed25-4e5f-8879-7795281a53d9.nam5.firestore.goog:443/default?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false'; 

if (!MONGO_URI) {
  console.error("❌ Error: MONGO_URI is missing in server/server.js");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Enterprise'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- SCHEMAS (Data Models) ---
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
  visualTag: String
});

const SignalSchema = new mongoose.Schema({
  id: String,
  name: String,
  rule: String,
  colors: [String] // Array like ['G', 'R', 'R']
});

const Job = mongoose.model('Job', JobSchema);
const Glossary = mongoose.model('Glossary', GlossarySchema);
const Signal = mongoose.model('Signal', SignalSchema);

// --- API ENDPOINTS ---

// --- READ (GET) ---

// Get All Jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ _id: -1 }); // Newest first
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Glossary
app.get('/api/glossary', async (req, res) => {
  try {
    const terms = await Glossary.find().sort({ term: 1 }); // Alphabetical
    res.json(terms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Signals
app.get('/api/signals', async (req, res) => {
  try {
    const signals = await Signal.find();
    res.json(signals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- WRITE (POST) - FOR ADMIN PANEL ---

// Create Job
app.post('/api/jobs', async (req, res) => {
  try {
    const newJob = new Job(req.body);
    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create Glossary Term
app.post('/api/glossary', async (req, res) => {
  try {
    const newTerm = new Glossary(req.body);
    await newTerm.save();
    res.status(201).json(newTerm);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create Signal
app.post('/api/signals', async (req, res) => {
  try {
    const newSignal = new Signal(req.body);
    await newSignal.save();
    res.status(201).json(newSignal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});