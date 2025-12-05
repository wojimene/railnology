console.log("--- RAILOPS & LIBRARY EXPANSION SEEDER ---");

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI; 
if (!MONGO_URI) { console.error("❌ MONGO_URI missing in .env"); process.exit(1); }

// --- SCHEMAS (Must match server.js) ---
const CrewSchema = new mongoose.Schema({ name: String, role: String, status: String, company: String, certification: String });
const ScheduleSchema = new mongoose.Schema({ trainId: String, origin: String, destination: String, departureTime: String, status: String, company: String, assignedCrew: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Crew' }] });

const GlossarySchema = new mongoose.Schema({ term: String, def: String, hasVisual: Boolean, visualTag: String, videoUrl: String });
const JobSchema = new mongoose.Schema({ title: String, company: String, location: String, salary: String, category: String, tags: [String], postedAt: { type: Date, default: Date.now }, externalLink: String, description: String, logo: String, jobType: String });
const SignalSchema = new mongoose.Schema({ id: String, name: String, rule: String, colors: [String] });
const StandardSchema = new mongoose.Schema({ code: String, title: String, description: String, agency: String, url: String });
const ManualSchema = new mongoose.Schema({ title: String, category: String, version: String, url: String });
const RegulationSchema = new mongoose.Schema({ code: String, title: String, summary: String, effectiveDate: String, url: String });
const MandateSchema = new mongoose.Schema({ title: String, deadline: String, description: String, url: String });

const Crew = mongoose.model('Crew', CrewSchema);
const Schedule = mongoose.model('Schedule', ScheduleSchema);
const Glossary = mongoose.model('Glossary', GlossarySchema);
const Job = mongoose.model('Job', JobSchema);
const Signal = mongoose.model('Signal', SignalSchema);
const Standard = mongoose.model('Standard', StandardSchema);
const Manual = mongoose.model('Manual', ManualSchema);
const Regulation = mongoose.model('Regulation', RegulationSchema);
const Mandate = mongoose.model('Mandate', MandateSchema);

// --- RAILOPS DATA ---
const CREW_MEMBERS = [
  { name: "John Henry", role: "Engineer", status: "Available", company: "Union Pacific", certification: "Class 1" },
  { name: "Casey Jones", role: "Engineer", status: "On Duty", company: "Union Pacific", certification: "Class 1" },
  { name: "Sarah Miller", role: "Conductor", status: "Available", company: "Union Pacific", certification: "Level 3" },
  { name: "Mike Davis", role: "Conductor", status: "Resting", company: "Union Pacific", certification: "Level 3" }
];

// --- LIBRARY DATA ---
const STANDARDS = [
  { code: "AREMA Ch. 1", title: "Roadway & Ballast", description: "Guidelines for railway track ballast and roadbed.", agency: "AREMA", url: "#" },
  { code: "IEEE 1474.1", title: "CBTC Performance", description: "Standard for Communications-Based Train Control.", agency: "IEEE", url: "#" },
  { code: "EN 50126", title: "RAMS", description: "Specification and demonstration of Reliability, Availability, Maintainability and Safety (RAMS).", agency: "CENELEC", url: "#" }
];

const MANUALS = [
  { title: "General Code of Operating Rules (GCOR)", category: "Operations", version: "8th Edition", url: "#" },
  { title: "Track Safety Standards Compliance Manual", category: "Safety", version: "2024", url: "#" },
  { title: "Bridge Welding Manual", category: "Maintenance", version: "2.1", url: "#" }
];

const REGULATIONS = [
  { code: "49 CFR Part 213", title: "Track Safety Standards", summary: "Prescribes minimum safety requirements for railroad track.", effectiveDate: "2024", url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-II/part-213" },
  { code: "49 CFR Part 236", title: "Signal Systems", summary: "Rules regarding signal and train control systems.", effectiveDate: "2024", url: "#" },
  { code: "49 CFR Part 229", title: "Locomotive Safety Standards", summary: "Inspection and maintenance standards for steam and diesel locomotives.", effectiveDate: "2023", url: "#" }
];

const MANDATES = [
  { title: "Positive Train Control (PTC)", deadline: "Dec 31, 2020", description: "Implementation of PTC technology on all required main lines.", url: "#" },
  { title: "Electronically Controlled Pneumatic (ECP) Brakes", deadline: "Repealed", description: "Requirement for ECP brakes on high-hazard flammable unit trains.", url: "#" }
];

const GLOSSARY = [
  { term: "Pantograph", def: "Apparatus on top of an electric train to collect power.", hasVisual: true, visualTag: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Pantograph_Animation.gif", videoUrl: "https://www.youtube.com/watch?v=AgmvqY6hU4E" },
  { term: "Bogie", def: "Wheel chassis.", hasVisual: true, visualTag: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Baureihe_614_Drehgestell.jpg", videoUrl: "https://www.youtube.com/watch?v=45M24B9oVoI" }
];

const SIGNALS = [
  { id: 'stop', colors: ['R', 'R', 'R'], name: 'Stop', rule: 'Stop.' }
];

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'railnology' });
    console.log("✅ Connected.");

    console.log('...Wiping old data...');
    await Promise.all([
      Crew.deleteMany({}), Schedule.deleteMany({}),
      Standard.deleteMany({}), Manual.deleteMany({}), Regulation.deleteMany({}), Mandate.deleteMany({}),
      Glossary.deleteMany({}), Signal.deleteMany({})
      // Note: We do NOT wipe Jobs here to preserve scraped/user data
    ]);

    console.log('...Injecting RailOps Data...');
    // 1. Insert Crew
    const createdCrew = await Crew.insertMany(CREW_MEMBERS);
    
    // 2. Create Schedules linked to Crew (Relational Data)
    const schedules = [
      { 
        trainId: "UP-450", origin: "Chicago, IL", destination: "Omaha, NE", 
        departureTime: "08:00 AM", status: "Scheduled", company: "Union Pacific",
        assignedCrew: [createdCrew[0]._id, createdCrew[2]._id] // Engineer 1 + Conductor 1
      },
      { 
        trainId: "UP-882", origin: "Denver, CO", destination: "Salt Lake, UT", 
        departureTime: "02:30 PM", status: "En Route", company: "Union Pacific",
        assignedCrew: [createdCrew[1]._id] // Engineer 2
      }
    ];
    await Schedule.insertMany(schedules);

    console.log('...Injecting Library Data...');
    await Promise.all([
      Standard.insertMany(STANDARDS),
      Manual.insertMany(MANUALS),
      Regulation.insertMany(REGULATIONS),
      Mandate.insertMany(MANDATES),
      Glossary.insertMany(GLOSSARY),
      Signal.insertMany(SIGNALS)
    ]);

    console.log("🎉 SUCCESS! RailOps & Library Data Seeded.");
    process.exit();
  } catch (err) { console.error(err); process.exit(1); }
};

run();