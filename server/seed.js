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

// --- SCHEMAS (Must match server.js exactly) ---
const Glossary = mongoose.model('Glossary', new mongoose.Schema({ term: String, def: String, hasVisual: Boolean, visualTag: String, videoUrl: String }));
const Job = mongoose.model('Job', new mongoose.Schema({ title: String, company: String, location: String, salary: String, category: String, tags: [String] }));
const Signal = mongoose.model('Signal', new mongoose.Schema({ id: String, name: String, rule: String, colors: [String] }));

// New Schemas
const Standard = mongoose.model('Standard', new mongoose.Schema({ code: String, title: String, description: String, agency: String, url: String }));
const Manual = mongoose.model('Manual', new mongoose.Schema({ title: String, category: String, version: String, url: String }));
const Regulation = mongoose.model('Regulation', new mongoose.Schema({ code: String, title: String, summary: String, effectiveDate: String, url: String }));
const Mandate = mongoose.model('Mandate', new mongoose.Schema({ title: String, deadline: String, description: String, url: String }));

// --- NEW DATA SETS ---
const STANDARDS = [
  { code: "AREMA Ch. 1", title: "Roadway & Ballast", description: "Guidelines for railway track ballast and roadbed.", agency: "AREMA", url: "#" },
  { code: "IEEE 1474.1", title: "CBTC Performance", description: "Standard for Communications-Based Train Control.", agency: "IEEE", url: "#" }
];

const MANUALS = [
  { title: "General Code of Operating Rules", category: "Operations", version: "8th Edition", url: "#" },
  { title: "Track Safety Standards Compliance Manual", category: "Safety", version: "2024", url: "#" }
];

const REGULATIONS = [
  { code: "49 CFR Part 213", title: "Track Safety Standards", summary: "Prescribes minimum safety requirements for railroad track.", effectiveDate: "2024", url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-II/part-213" },
  { code: "49 CFR Part 236", title: "Signal Systems", summary: "Rules regarding signal and train control systems.", effectiveDate: "2024", url: "#" }
];

const MANDATES = [
  { title: "Positive Train Control (PTC)", deadline: "Dec 31, 2020", description: "Implementation of PTC technology on all required main lines.", url: "#" }
];

// Existing Data (Preserved & Updated with Stable Links)
const GLOSSARY = [
  { term: "Pantograph", def: "An apparatus mounted on the roof of an electric train to collect power.", hasVisual: true, visualTag: "/diagrams/pantograph.gif", videoUrl: "https://www.youtube.com/watch?v=AgmvqY6hU4E" },
  { term: "Bogie", def: "Wheel chassis.", hasVisual: true, visualTag: "/diagrams/bogie.jpg", videoUrl: "https://www.youtube.com/watch?v=45M24B9oVoI" }
];
const JOBS = [{ title: "Senior Locomotive Engineer", company: "BNSF", location: "TX", salary: "$125k", category: "Field", tags: ["Union"] }];
const SIGNALS = [{ id: 'stop', colors: ['R','R','R'], name: 'Stop', rule: 'Stop.' }];

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'railnology' });
    console.log("✅ Connected. Updating Database...");

    // Clear & Insert All Tables
    await Promise.all([
      Standard.deleteMany({}), Manual.deleteMany({}), Regulation.deleteMany({}), Mandate.deleteMany({}),
      Glossary.deleteMany({}), Job.deleteMany({}), Signal.deleteMany({})
    ]);

    await Promise.all([
      Standard.insertMany(STANDARDS), Manual.insertMany(MANUALS), Regulation.insertMany(REGULATIONS), Mandate.insertMany(MANDATES),
      Glossary.insertMany(GLOSSARY), Job.insertMany(JOBS), Signal.insertMany(SIGNALS)
    ]);

    console.log("🎉 SUCCESS! Expanded Database Created.");
    process.exit();
  } catch (err) { console.error(err); process.exit(1); }
};

run();