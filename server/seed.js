console.log("--- RAILOPS DATA EXPANSION SEEDER ---");

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI; 
if (!MONGO_URI) { console.error("❌ MONGO_URI missing in .env"); process.exit(1); }

// --- SCHEMAS ---
const CrewSchema = new mongoose.Schema({ name: String, email: String, role: String, status: String, company: String, certification: String });
const ScheduleSchema = new mongoose.Schema({ trainId: String, origin: String, destination: String, departureTime: Date, arrivalTime: Date, status: String, company: String, assignedCrew: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Crew' }] });
const JobSchema = new mongoose.Schema({ title: String, company: String, location: String, salary: String, category: String, tags: [String], postedAt: { type: Date, default: Date.now }, externalLink: String, description: String, logo: String, jobType: String });
const GlossarySchema = new mongoose.Schema({ term: String, def: String, hasVisual: Boolean, visualTag: String, videoUrl: String });
const SignalSchema = new mongoose.Schema({ id: String, name: String, rule: String, colors: [String] });
const StandardSchema = new mongoose.Schema({ code: String, title: String, description: String, agency: String, url: String });
const ManualSchema = new mongoose.Schema({ title: String, category: String, version: String, url: String });
const RegulationSchema = new mongoose.Schema({ code: String, title: String, summary: String, effectiveDate: String, url: String });
const MandateSchema = new mongoose.Schema({ title: String, deadline: String, description: String, url: String });

const Crew = mongoose.model('Crew', CrewSchema);
const Schedule = mongoose.model('Schedule', ScheduleSchema);
const Job = mongoose.model('Job', JobSchema);
const Glossary = mongoose.model('Glossary', GlossarySchema);
const Signal = mongoose.model('Signal', SignalSchema);
const Standard = mongoose.model('Standard', StandardSchema);
const Manual = mongoose.model('Manual', ManualSchema);
const Regulation = mongoose.model('Regulation', RegulationSchema);
const Mandate = mongoose.model('Mandate', MandateSchema);

// --- EXPANDED CREW ROSTER (24 Members) ---
const CREW_ROSTER = [
  // EXISTING
  { name: "John Henry", role: "Engineer", status: "Available", company: "Union Pacific", certification: "Class 1" },
  { name: "Casey Jones", role: "Engineer", status: "On Duty", company: "Union Pacific", certification: "Class 1" },
  { name: "Sarah Miller", role: "Conductor", status: "Available", company: "Union Pacific", certification: "Level 3" },
  { name: "Mike Davis", role: "Conductor", status: "Resting", company: "Union Pacific", certification: "Level 3" },
  // NEW ENGINEERS
  { name: "Robert Pole", role: "Engineer", status: "Available", company: "Union Pacific", certification: "Class 1" },
  { name: "Chris Evans", role: "Engineer", status: "Available", company: "Union Pacific", certification: "Class 1" },
  { name: "Mark Ruffalo", role: "Engineer", status: "Resting", company: "Union Pacific", certification: "Class 1" },
  { name: "Scarlett Jo", role: "Engineer", status: "On Duty", company: "Union Pacific", certification: "Class 1" },
  { name: "Jeremy Ren", role: "Engineer", status: "Available", company: "Union Pacific", certification: "Class 1" },
  { name: "Don Cheadle", role: "Engineer", status: "Available", company: "Union Pacific", certification: "Class 1" },
  { name: "Paul Bettany", role: "Engineer", status: "On Duty", company: "Union Pacific", certification: "Class 1" },
  { name: "Liz Olsen", role: "Engineer", status: "Available", company: "Union Pacific", certification: "Class 1" },
  // NEW CONDUCTORS
  { name: "Anthony Mack", role: "Conductor", status: "Available", company: "Union Pacific", certification: "Level 3" },
  { name: "Seb Stan", role: "Conductor", status: "Available", company: "Union Pacific", certification: "Level 3" },
  { name: "Tom Hiddles", role: "Conductor", status: "Resting", company: "Union Pacific", certification: "Level 3" },
  { name: "Chris Pratt", role: "Conductor", status: "On Duty", company: "Union Pacific", certification: "Level 3" },
  { name: "Zoe Saldana", role: "Conductor", status: "Available", company: "Union Pacific", certification: "Level 3" },
  { name: "Dave Bautista", role: "Conductor", status: "Available", company: "Union Pacific", certification: "Level 3" },
  { name: "Vin Diesel", role: "Conductor", status: "Available", company: "Union Pacific", certification: "Level 3" },
  { name: "Brad Cooper", role: "Conductor", status: "Resting", company: "Union Pacific", certification: "Level 3" },
  // BRAKEMEN (Entry Level)
  { name: "Tom Holland", role: "Brakeman", status: "Available", company: "Union Pacific", certification: "Trainee" },
  { name: "Chad Boseman", role: "Brakeman", status: "On Duty", company: "Union Pacific", certification: "Trainee" },
  { name: "Bene Cumber", role: "Brakeman", status: "Available", company: "Union Pacific", certification: "Trainee" },
  { name: "Karen Gillan", role: "Brakeman", status: "Available", company: "Union Pacific", certification: "Trainee" }
];

// Library Content (Preserved)
const STANDARDS = [ { code: "AREMA Ch. 1", title: "Roadway & Ballast", description: "Guidelines for railway track ballast and roadbed.", agency: "AREMA", url: "#" } ];
const MANUALS = [ { title: "General Code of Operating Rules (GCOR)", category: "Operations", version: "8th Edition", url: "#" } ];
const REGULATIONS = [ { code: "49 CFR Part 213", title: "Track Safety Standards", summary: "Prescribes minimum safety requirements for railroad track.", effectiveDate: "2024", url: "#" } ];
const MANDATES = [ { title: "Positive Train Control (PTC)", deadline: "Dec 31, 2020", description: "Implementation of PTC technology.", url: "#" } ];
const GLOSSARY = [ { term: "Pantograph", def: "Apparatus on top of an electric train to collect power.", hasVisual: true, visualTag: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Pantograph_Animation.gif", videoUrl: "" } ];
const SIGNALS = [ { id: 'stop', colors: ['R', 'R', 'R'], name: 'Stop', rule: 'Stop.' } ];

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'railnology' });
    console.log("✅ Connected.");

    // WIPE ONLY RAILOPS DATA to preserve user accounts/jobs if needed, 
    // but for this seed we will refresh standard data too to ensure consistency.
    await Promise.all([
      Crew.deleteMany({}), 
      Schedule.deleteMany({}),
      // We keep Jobs/Users intact usually, but let's refresh Library
      Standard.deleteMany({}), Manual.deleteMany({}), Regulation.deleteMany({}), Mandate.deleteMany({}),
      Glossary.deleteMany({}), Signal.deleteMany({})
    ]);

    console.log('...Injecting Expanded Crew Roster...');
    const createdCrew = await Crew.insertMany(CREW_ROSTER);
    
    const today = new Date();
    const laterToday = new Date(today); laterToday.setHours(today.getHours() + 4);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    const schedules = [
      { 
        trainId: "UP-450", origin: "Chicago, IL", destination: "Omaha, NE", departureTime: today, status: "Scheduled", company: "Union Pacific",
        assignedCrew: [createdCrew[0]._id, createdCrew[2]._id] // Engineer 1 + Conductor 1
      },
      { 
        trainId: "UP-882", origin: "Denver, CO", destination: "Salt Lake, UT", departureTime: laterToday, status: "En Route", company: "Union Pacific",
        assignedCrew: [createdCrew[1]._id, createdCrew[21]._id] // Engineer 2 + Brakeman
      },
      { 
        trainId: "UP-101", origin: "Portland, OR", destination: "Seattle, WA", departureTime: tomorrow, status: "Planning", company: "Union Pacific",
        assignedCrew: [] // Needs assignment
      }
    ];
    
    await Schedule.insertMany(schedules);

    // Library
    await Promise.all([
      Standard.insertMany(STANDARDS), Manual.insertMany(MANUALS), Regulation.insertMany(REGULATIONS),
      Mandate.insertMany(MANDATES), Glossary.insertMany(GLOSSARY), Signal.insertMany(SIGNALS)
    ]);

    console.log(`🎉 SUCCESS! Added ${createdCrew.length} Crew Members and refreshed schedules.`);
    process.exit();
  } catch (err) { console.error(err); process.exit(1); }
};

run();