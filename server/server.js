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
    mongoose.connect(MONGO_URI, { dbName: 'railnology' })
    .then(() => console.log('✅ Connected to MongoDB Enterprise'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// --- SCHEMAS (Startup 3.0: RailOps) ---

// 1. CREW MEMBER SCHEMA (New)
const CrewSchema = new mongoose.Schema({
  name: String,
  role: String,           // e.g. "Conductor", "Engineer"
  status: String,         // "Available", "Resting", "On Duty"
  company: String,        // Links to Company Profile
  certification: String   // e.g. "Class 1 License"
});

// 2. SCHEDULE SCHEMA (New)
const ScheduleSchema = new mongoose.Schema({
  trainId: String,        // e.g. "A-450"
  origin: String,
  destination: String,
  departureTime: String,
  status: String,         // "Scheduled", "En Route", "Completed"
  company: String,
  assignedCrew: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Crew' }] // Links to Crew
});

// Existing Schemas
const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: String,
  role: { type: String, enum: ['individual', 'company'], default: 'individual' },
  fullName: String, headline: String, location: String, about: String,
  companyName: String, jobTitle: String,
  experience: [{ title: String, company: String, dates: String }],
  education: [{ school: String, degree: String, dates: String }],
  skills: [String],
  createdAt: { type: Date, default: Date.now }
});

const JobSchema = new mongoose.Schema({ title: String, company: String, location: String, salary: String, category: String, tags: [String], postedAt: { type: Date, default: Date.now }, externalLink: String, description: String, logo: String, jobType: String });
const GlossarySchema = new mongoose.Schema({ term: String, def: String, hasVisual: Boolean, visualTag: String, videoUrl: String });
const StandardSchema = new mongoose.Schema({ code: String, title: String, description: String, agency: String, url: String });
const ManualSchema = new mongoose.Schema({ title: String, category: String, version: String, url: String });
const RegulationSchema = new mongoose.Schema({ code: String, title: String, summary: String, effectiveDate: String, url: String });
const MandateSchema = new mongoose.Schema({ title: String, deadline: String, description: String, url: String });
const SignalSchema = new mongoose.Schema({ id: String, name: String, rule: String, colors: [String] });

const Crew = mongoose.model('Crew', CrewSchema);
const Schedule = mongoose.model('Schedule', ScheduleSchema);
const User = mongoose.model('User', UserSchema);
const Job = mongoose.model('Job', JobSchema);
const Signal = mongoose.model('Signal', SignalSchema);
const Glossary = mongoose.model('Glossary', GlossarySchema);
const Standard = mongoose.model('Standard', StandardSchema);
const Manual = mongoose.model('Manual', ManualSchema);
const Regulation = mongoose.model('Regulation', RegulationSchema);
const Mandate = mongoose.model('Mandate', MandateSchema);

// --- API ENDPOINTS ---

// RAILOPS ROUTES
app.get('/api/crew', async (req, res) => res.json(await Crew.find()));
app.get('/api/schedules', async (req, res) => res.json(await Schedule.find().populate('assignedCrew')));

// User Routes
app.post('/api/users/sync', async (req, res) => {
  const { clerkId, email, fullName } = req.body;
  if (!clerkId) return res.status(400).json({ error: "Missing Clerk ID" });
  try {
    let user = await User.findOne({ clerkId });
    if (!user) { user = new User({ clerkId, email, fullName }); await user.save(); }
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/users/:clerkId', async (req, res) => {
  try { const user = await User.findOne({ clerkId: req.params.clerkId }); if (!user) return res.status(404).json({ error: "User not found" }); res.json(user); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/users/:clerkId', async (req, res) => {
  try { const user = await User.findOneAndUpdate({ clerkId: req.params.clerkId }, { $set: req.body }, { new: true }); res.json(user); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Standard Data Routes
app.get('/api/jobs', async (req, res) => res.json(await Job.find().sort({ postedAt: -1 })));
app.get('/api/signals', async (req, res) => res.json(await Signal.find()));
app.get('/api/glossary', async (req, res) => res.json(await Glossary.find().sort({ term: 1 })));
app.get('/api/standards', async (req, res) => res.json(await Standard.find()));
app.get('/api/manuals', async (req, res) => res.json(await Manual.find()));
app.get('/api/regulations', async (req, res) => res.json(await Regulation.find()));
app.get('/api/mandates', async (req, res) => res.json(await Mandate.find()));

// Write Endpoints
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
app.post('/api/crew', createHandler(Crew)); // New
app.post('/api/schedules', createHandler(Schedule)); // New

app.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });