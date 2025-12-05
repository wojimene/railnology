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

// --- SCHEMAS (RailOps 2.0 Upgrade) ---

// 1. USER SCHEMA
const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: String,
  fullName: String,
  role: { type: String, enum: ['individual', 'company'], default: 'individual' },
  headline: String, location: String, about: String,
  companyName: String, jobTitle: String,
  experience: [{ title: String, company: String, dates: String }],
  createdAt: { type: Date, default: Date.now }
});

// 2. CREW MEMBER SCHEMA (Linked to User)
const CrewSchema = new mongoose.Schema({
  name: String,
  email: String,          // Link to User Account
  role: String,           // "Conductor", "Engineer"
  status: String,         // "Available", "Resting", "On Duty"
  company: String,
  certification: String,
  serviceHours: { type: Number, default: 0 } // For tracking legal limits
});

// 3. SCHEDULE SCHEMA (Operations)
const ScheduleSchema = new mongoose.Schema({
  trainId: String,
  origin: String,
  destination: String,
  departureTime: Date,    // Changed to Date for sorting
  arrivalTime: Date,      // For 12-month planning
  status: String,         // "Scheduled", "En Route", "Completed", "History"
  company: String,
  assignedCrew: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Crew' }],
  notes: String
});

// Standard Schemas
const JobSchema = new mongoose.Schema({ title: String, company: String, location: String, salary: String, category: String, tags: [String], postedAt: { type: Date, default: Date.now }, externalLink: String, description: String, logo: String, jobType: String });
const GlossarySchema = new mongoose.Schema({ term: String, def: String, hasVisual: Boolean, visualTag: String, videoUrl: String });
const StandardSchema = new mongoose.Schema({ code: String, title: String, description: String, agency: String, url: String });
const ManualSchema = new mongoose.Schema({ title: String, category: String, version: String, url: String });
const RegulationSchema = new mongoose.Schema({ code: String, title: String, summary: String, effectiveDate: String, url: String });
const MandateSchema = new mongoose.Schema({ title: String, deadline: String, description: String, url: String });
const SignalSchema = new mongoose.Schema({ id: String, name: String, rule: String, colors: [String] });

const User = mongoose.model('User', UserSchema);
const Crew = mongoose.model('Crew', CrewSchema);
const Schedule = mongoose.model('Schedule', ScheduleSchema);
const Job = mongoose.model('Job', JobSchema);
const Signal = mongoose.model('Signal', SignalSchema);
const Glossary = mongoose.model('Glossary', GlossarySchema);
const Standard = mongoose.model('Standard', StandardSchema);
const Manual = mongoose.model('Manual', ManualSchema);
const Regulation = mongoose.model('Regulation', RegulationSchema);
const Mandate = mongoose.model('Mandate', MandateSchema);

// --- API ENDPOINTS ---

// RailOps: Get Operations Data
app.get('/api/crew', async (req, res) => res.json(await Crew.find()));
// Get Active vs History Schedules
app.get('/api/schedules', async (req, res) => {
  const { type } = req.query;
  let filter = {};
  if (type === 'history') {
    filter = { status: 'History' };
  } else {
    filter = { status: { $ne: 'History' } };
  }
  const schedules = await Schedule.find(filter).populate('assignedCrew').sort({ departureTime: 1 });
  res.json(schedules);
});

// RailOps: Assign Crew to Train
app.post('/api/schedules/:id/assign', async (req, res) => {
  try {
    const { crewId } = req.body;
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule.assignedCrew.includes(crewId)) {
      schedule.assignedCrew.push(crewId);
      await schedule.save();
      
      // Update Crew Status
      await Crew.findByIdAndUpdate(crewId, { status: 'On Duty' });
    }
    res.json(schedule);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Personal Profile: Get My Assignments
app.get('/api/my-assignments', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json([]);
  
  // 1. Find Crew ID for this email
  const crewMember = await Crew.findOne({ email });
  if (!crewMember) return res.json([]);

  // 2. Find Schedules where this Crew ID is assigned
  const mySchedules = await Schedule.find({ assignedCrew: crewMember._id }).sort({ departureTime: 1 });
  res.json(mySchedules);
});

// Standard User Routes
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

// Data Read/Write
app.get('/api/jobs', async (req, res) => res.json(await Job.find().sort({ postedAt: -1 })));
app.get('/api/glossary', async (req, res) => res.json(await Glossary.find()));
// (Omitting other getters for brevity, they remain same)

const createHandler = (Model) => async (req, res) => {
  try { const doc = new Model(req.body); await doc.save(); res.status(201).json(doc); } 
  catch (err) { res.status(400).json({ error: err.message }); }
};
app.post('/api/jobs', createHandler(Job));
app.post('/api/crew', createHandler(Crew));
app.post('/api/schedules', createHandler(Schedule));

app.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });