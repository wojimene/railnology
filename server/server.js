import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

if (!MONGO_URI) {
  console.error("❌ Error: MONGO_URI is missing. Check your .env file.");
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

// --- EXTENDED SCHEMAS (Product 1.0 Expansion) ---
const JobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  salary: String,
  category: String,
  tags: [String]
});

const SignalSchema = new mongoose.Schema({
  id: String,
  name: String,
  rule: String,
  colors: [String]
});

// 1. Glossary (Existing)
const GlossarySchema = new mongoose.Schema({
  term: String,
  def: String,
  hasVisual: Boolean,
  visualTag: String,
  videoUrl: String 
});

// 2. Standards (New)
const StandardSchema = new mongoose.Schema({
  code: String,
  title: String,
  description: String,
  agency: String,
  url: String
});

// 3. Manuals (New)
const ManualSchema = new mongoose.Schema({
  title: String,
  category: String,
  version: String,
  url: String
});

// 4. Regulations (New)
const RegulationSchema = new mongoose.Schema({
  code: String,
  title: String,
  summary: String,
  effectiveDate: String,
  url: String
});

// 5. Mandates (New)
const MandateSchema = new mongoose.Schema({
  title: String,
  deadline: String,
  description: String,
  url: String
});

const Job = mongoose.model('Job', JobSchema);
const Signal = mongoose.model('Signal', SignalSchema);
const Glossary = mongoose.model('Glossary', GlossarySchema);
const Standard = mongoose.model('Standard', StandardSchema);
const Manual = mongoose.model('Manual', ManualSchema);
const Regulation = mongoose.model('Regulation', RegulationSchema);
const Mandate = mongoose.model('Mandate', MandateSchema);

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

// GET Routes (Read)
app.get('/api/jobs', async (req, res) => res.json(await Job.find().sort({ _id: -1 })));
app.get('/api/signals', async (req, res) => res.json(await Signal.find()));
app.get('/api/glossary', async (req, res) => res.json(await Glossary.find().sort({ term: 1 })));

app.get('/api/standards', async (req, res) => res.json(await Standard.find()));
app.get('/api/manuals', async (req, res) => res.json(await Manual.find()));
app.get('/api/regulations', async (req, res) => res.json(await Regulation.find()));
app.get('/api/mandates', async (req, res) => res.json(await Mandate.find()));

// POST Routes (Write - For Admin)
// Helper function to reduce code duplication
const createHandler = (Model) => async (req, res) => {
  try {
    const doc = new Model(req.body);
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

app.post('/api/jobs', createHandler(Job));
app.post('/api/glossary', createHandler(Glossary));
app.post('/api/standards', createHandler(Standard));
app.post('/api/manuals', createHandler(Manual));
app.post('/api/regulations', createHandler(Regulation));
app.post('/api/mandates', createHandler(Mandate));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});