console.log("--- PRODUCT EXPANSION SEEDER ---");

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
// Note: We redefine them here to keep the seeder standalone
const GlossarySchema = new mongoose.Schema({ term: String, def: String, hasVisual: Boolean, visualTag: String, videoUrl: String });
const JobSchema = new mongoose.Schema({ title: String, company: String, location: String, salary: String, category: String, tags: [String] });
const SignalSchema = new mongoose.Schema({ id: String, name: String, rule: String, colors: [String] });

// New Library Schemas
const StandardSchema = new mongoose.Schema({ code: String, title: String, description: String, agency: String, url: String });
const ManualSchema = new mongoose.Schema({ title: String, category: String, version: String, url: String });
const RegulationSchema = new mongoose.Schema({ code: String, title: String, summary: String, effectiveDate: String, url: String });
const MandateSchema = new mongoose.Schema({ title: String, deadline: String, description: String, url: String });

const Glossary = mongoose.model('Glossary', GlossarySchema);
const Job = mongoose.model('Job', JobSchema);
const Signal = mongoose.model('Signal', SignalSchema);
const Standard = mongoose.model('Standard', StandardSchema);
const Manual = mongoose.model('Manual', ManualSchema);
const Regulation = mongoose.model('Regulation', RegulationSchema);
const Mandate = mongoose.model('Mandate', MandateSchema);

// --- DATA: LIBRARY 2.0 CONTENT ---

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

// --- EXISTING DATA (Preserved) ---
const GLOSSARY = [
  { 
    term: "Pantograph", 
    def: "An apparatus mounted on the roof of an electric train to collect power through contact with an overhead catenary wire.", 
    hasVisual: true, 
    visualTag: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Pantograph_Animation.gif", 
    videoUrl: "https://www.youtube.com/watch?v=AgmvqY6hU4E"
  },
  { 
    term: "Bogie (Truck)", 
    def: "A chassis or framework carrying wheels, attached to a vehicle, serving as a modular subassembly of wheels and axles.", 
    hasVisual: true, 
    visualTag: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Baureihe_614_Drehgestell.jpg",
    videoUrl: "https://www.youtube.com/watch?v=45M24B9oVoI"
  },
  { 
    term: "Cant (Superelevation)", 
    def: "The difference in elevation between the two rails on a curve, designed to counteract centrifugal force.", 
    hasVisual: true, 
    visualTag: "https://upload.wikimedia.org/wikipedia/commons/c/c6/Rail_superelevation.svg",
    videoUrl: "" 
  },
  { 
    term: "Semaphore Signal", 
    def: "A mechanical railway signal displaying information by the position of a moving arm (blade).", 
    hasVisual: true, 
    visualTag: "https://upload.wikimedia.org/wikipedia/commons/5/56/Semaphore_Signal_Go.jpg",
    videoUrl: "https://www.youtube.com/watch?v=U54F3H-gX64" 
  },
  { term: "Fishplate", def: "A metal bar that is bolted to the ends of two rails to join them together in a track.", hasVisual: true, visualTag: "https://upload.wikimedia.org/wikipedia/commons/5/52/Rail_joint_fishplate.jpg", videoUrl: "" },
  { term: "Interlocking", def: "An arrangement of signal apparatus that prevents conflicting movements through an arrangement of tracks.", hasVisual: false, visualTag: "", videoUrl: "" },
  { term: "Ballast", def: "Crushed stones beneath the track that hold ties in place and allow drainage.", hasVisual: false, visualTag: "", videoUrl: "" },
  { term: "Standard Gauge", def: "The most common spacing of rail tracks globally: 1,435 mm (4 ft 8 1⁄2 in).", hasVisual: false, visualTag: "", videoUrl: "" },
  { term: "Deadman's Switch", def: "A safety device that automatically applies the brakes if the human operator becomes incapacitated.", hasVisual: false, visualTag: "", videoUrl: "" }
];

const JOBS = [
  { title: "Senior Locomotive Engineer", company: "BNSF Railway", location: "Fort Worth, TX", salary: "$95k - $125k", category: "Field", tags: ["Sign-on Bonus", "Union"] },
  { title: "Track Inspector (Geometry)", company: "Canadian National", location: "Chicago, IL", salary: "$36/hr + Benefits", category: "Engineering", tags: ["Urgent", "Travel Required"] },
  { title: "Rail Systems Manager", company: "Brightline West", location: "Las Vegas, NV", salary: "$130k - $160k", category: "Management", tags: ["High Speed Rail", "New Project"] }
];

const SIGNALS = [
  { id: 'clear', colors: ['G', 'R', 'R'], name: 'Clear', rule: 'Proceed at track speed.' },
  { id: 'approach', colors: ['Y', 'R', 'R'], name: 'Approach', rule: 'Proceed preparing to stop at next signal. Train exceeding 30 MPH must reduce to 30 MPH.' },
  { id: 'stop', colors: ['R', 'R', 'R'], name: 'Stop', rule: 'Stop.' }
];

const run = async () => {
  try {
    // ⚡ Force 'railnology' database
    await mongoose.connect(MONGO_URI, { dbName: 'railnology' });
    console.log(`✅ Connected to: ${mongoose.connection.name}`);

    console.log('...Wiping old data...');
    // Clear all collections to ensure no duplicates or stale schemas
    await Promise.all([
      Standard.deleteMany({}),
      Manual.deleteMany({}),
      Regulation.deleteMany({}),
      Mandate.deleteMany({}),
      Glossary.deleteMany({}),
      Job.deleteMany({}),
      Signal.deleteMany({})
    ]);

    console.log('...Injecting New Library Content...');
    await Promise.all([
      Standard.insertMany(STANDARDS),
      Manual.insertMany(MANUALS),
      Regulation.insertMany(REGULATIONS),
      Mandate.insertMany(MANDATES),
      Glossary.insertMany(GLOSSARY),
      Job.insertMany(JOBS),
      Signal.insertMany(SIGNALS)
    ]);

    console.log("🎉 SUCCESS! Database Updated with Library 2.0 Content.");
    process.exit();
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
};

run();