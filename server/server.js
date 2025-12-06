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

// --- SCHEMAS (Complete Platform Schema) ---

// 1. USER & CREW
const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: String,
  fullName: String,
  role: { type: String, enum: ['individual', 'company'], default: 'individual' },
  headline: String, location: String, about: String,
  companyName: String, jobTitle: String,
  experience: [{ title: String, company: String, dates: String }],
  education: [{ school: String, degree: String, dates: String }],
  skills: [String],
  createdAt: { type: Date, default: Date.now }
});

const CrewSchema = new mongoose.Schema({
  name: String,
  email: String,          
  role: String,           
  status: String,         
  company: String,
  certification: String
});

// 2. OPERATIONS
const ScheduleSchema = new mongoose.Schema({
  trainId: String,
  origin: String,
  destination: String,
  departureTime: Date,    
  arrivalTime: Date,      
  status: String,         
  company: String,
  assignedCrew: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Crew' }]
});

// 3. JOB BOARD
const JobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  salary: String,
  category: String,
  tags: [String],
  postedAt: { type: Date, default: Date.now },
  externalLink: String,
  description: String,
  logo: String,
  jobType: String
});

// 4. LIBRARY
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

// LIBRARY ROUTES
app.get('/api/standards', async (req, res) => res.json(await Standard.find()));
app.get('/api/manuals', async (req, res) => res.json(await Manual.find()));
app.get('/api/regulations', async (req, res) => res.json(await Regulation.find()));
app.get('/api/mandates', async (req, res) => res.json(await Mandate.find()));
app.get('/api/glossary', async (req, res) => res.json(await Glossary.find().sort({ term: 1 })));
app.get('/api/signals', async (req, res) => res.json(await Signal.find()));

// JOB ROUTES
app.get('/api/jobs', async (req, res) => res.json(await Job.find().sort({ postedAt: -1 })));

// RAILOPS ROUTES
app.get('/api/crew', async (req, res) => res.json(await Crew.find()));

app.get('/api/schedules', async (req, res) => {
  const { type } = req.query;
  const filter = type === 'history' ? { status: 'History' } : { status: { $ne: 'History' } };
  const schedules = await Schedule.find(filter).populate('assignedCrew').sort({ departureTime: 1 });
  res.json(schedules);
});

// ✅ ASSIGN CREW (Bulletproof)
app.post('/api/schedules/:id/assign', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Database not connected." });

    const { crewId } = req.body;
    const scheduleId = req.params.id;

    if (!crewId || !mongoose.Types.ObjectId.isValid(crewId)) return res.status(400).json({ error: "Invalid Crew ID" });
    if (!scheduleId || !mongoose.Types.ObjectId.isValid(scheduleId)) return res.status(400).json({ error: "Invalid Schedule ID" });

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ error: "Schedule not found." });

    if (!schedule.assignedCrew) schedule.assignedCrew = [];

    // Check for duplicates using string comparison
    const alreadyAssigned = schedule.assignedCrew.some(id => id && id.toString() === crewId);

    if (!alreadyAssigned) {
      schedule.assignedCrew.push(crewId);
      await schedule.save();
      // Update status to On Duty
      await Crew.findByIdAndUpdate(crewId, { status: 'On Duty' });
    }

    const populated = await Schedule.findById(scheduleId).populate('assignedCrew');
    res.json(populated);

  } catch (err) { 
    console.error("Assignment Error:", err);
    res.status(500).json({ error: err.message }); 
  }
});

// ✅ UNASSIGN CREW (New Feature)
app.post('/api/schedules/:id/unassign', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Database not connected." });

    const { crewId } = req.body;
    const scheduleId = req.params.id;

    if (!crewId || !scheduleId) return res.status(400).json({ error: "Missing IDs" });

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ error: "Schedule not found." });

    // Remove crew from array
    if (schedule.assignedCrew) {
      schedule.assignedCrew = schedule.assignedCrew.filter(id => id && id.toString() !== crewId);
      await schedule.save();
      
      // Reset status to Available
      await Crew.findByIdAndUpdate(crewId, { status: 'Available' });
    }

    const populated = await Schedule.findById(scheduleId).populate('assignedCrew');
    res.json(populated);

  } catch (err) { 
    console.error("Unassign Error:", err);
    res.status(500).json({ error: err.message }); 
  }
});

// USER ROUTES
app.get('/api/my-assignments', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json([]);
  const crewMember = await Crew.findOne({ email });
  if (!crewMember) return res.json([]);
  const mySchedules = await Schedule.find({ assignedCrew: crewMember._id }).sort({ departureTime: 1 });
  res.json(mySchedules);
});

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
app.post('/api/crew', createHandler(Crew));
app.post('/api/schedules', createHandler(Schedule));

app.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });