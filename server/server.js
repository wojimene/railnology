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

// --- SCHEMAS (Updated for Rich Data) ---

// 1. JOB SCHEMA (Now with Logo & Description)
const JobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  salary: String,
  category: String,
  tags: [String],
  postedAt: { type: Date, default: Date.now },
  
  // ✅ New Rich Fields
  externalLink: String,   // The "Apply" Hot Link
  description: String,    // Short summary of the job
  logo: String,           // URL to company logo
  jobType: String         // Full-time, Contract, etc.
});

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: String,
  role: { type: String, enum: ['individual', 'company'], default: 'individual' },
  fullName: String,
  headline: String, location: String, about: String,
  companyName: String, jobTitle: String,
  experience: [{ title: String, company: String, dates: String }],
  education: [{ school: String, degree: String, dates: String }],
  skills: [String],
  createdAt: { type: Date, default: Date.now }
});

const GlossarySchema = new mongoose.Schema({ term: String, def: String, hasVisual: Boolean, visualTag: String, videoUrl: String });
const StandardSchema = new mongoose.Schema({ code: String, title: String, description: String, agency: String, url: String });
const ManualSchema = new mongoose.Schema({ title: String, category: String, version: String, url: String });
const RegulationSchema = new mongoose.Schema({ code: String, title: String, summary: String, effectiveDate: String, url: String });
const MandateSchema = new mongoose.Schema({ title: String, deadline: String, description: String, url: String });
const SignalSchema = new mongoose.Schema({ id: String, name: String, rule: String, colors: [String] });

const Job = mongoose.model('Job', JobSchema);
const User = mongoose.model('User', UserSchema);
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
    dbName: mongoose.connection.name
  });
});

// USER ROUTES
app.post('/api/users/sync', async (req, res) => {
  const { clerkId, email, fullName } = req.body;
  if (!clerkId) return res.status(400).json({ error: "Missing Clerk ID" });
  try {
    let user = await User.findOne({ clerkId });
    if (!user) {
      user = new User({ clerkId, email, fullName });
      await user.save();
    }
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:clerkId', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ clerkId: req.params.clerkId }, { $set: req.body }, { new: true });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DATA ROUTES
app.get('/api/jobs', async (req, res) => res.json(await Job.find().sort({ postedAt: -1 })));
app.get('/api/signals', async (req, res) => res.json(await Signal.find()));
app.get('/api/glossary', async (req, res) => res.json(await Glossary.find().sort({ term: 1 })));
app.get('/api/standards', async (req, res) => res.json(await Standard.find()));
app.get('/api/manuals', async (req, res) => res.json(await Manual.find()));
app.get('/api/regulations', async (req, res) => res.json(await Regulation.find()));
app.get('/api/mandates', async (req, res) => res.json(await Mandate.find()));

// WRITE ENDPOINTS
const createHandler = (Model) => async (req, res) => {
  try { const doc = new Model(req.body); await doc.save(); res.status(201).json(doc); } 
  catch (err) { res.status(400).json({ error: err.message }); }
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