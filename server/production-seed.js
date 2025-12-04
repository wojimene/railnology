console.log("--- SECURE SEEDER STARTING ---");

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix to locate the .env file in the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// --- CONFIGURATION ---
// ✅ SECURE: Reads from the hidden .env file on your computer/server
const MONGO_URI = process.env.MONGO_URI; 

if (!MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is missing from .env file.");
    console.error("   -> Make sure you created a '.env' file in the root folder.");
    console.error("   -> Make sure it contains: MONGO_URI=your_connection_string");
    process.exit(1);
}

// --- SCHEMAS ---
const GlossarySchema = new mongoose.Schema({
  term: String,
  def: String,
  hasVisual: Boolean,
  visualTag: String,
  videoUrl: String 
});
const Glossary = mongoose.model('Glossary', GlossarySchema);

const JobSchema = new mongoose.Schema({ title: String, company: String, location: String, salary: String, category: String, tags: [String] });
const SignalSchema = new mongoose.Schema({ id: String, name: String, rule: String, colors: [String] });
const Job = mongoose.model('Job', JobSchema);
const Signal = mongoose.model('Signal', SignalSchema);

// --- DATA: HIGH RELIABILITY CDNs (Unsplash & YouTube) ---
const GLOSSARY = [
  { 
    term: "Pantograph", 
    def: "Apparatus on top of an electric train to collect power from the overhead catenary wire.", 
    hasVisual: true, 
    visualTag: "https://images.unsplash.com/photo-1555662506-b838b9895198?auto=format&fit=crop&w=800&q=80", 
    videoUrl: "https://www.youtube.com/watch?v=AgmvqY6hU4E"
  },
  { 
    term: "Bogie (Truck)", 
    def: "Chassis carrying wheels, attached to a vehicle, serving as a modular subassembly of axles.", 
    hasVisual: true, 
    visualTag: "https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://www.youtube.com/watch?v=45M24B9oVoI"
  },
  { 
    term: "Cant (Superelevation)", 
    def: "The difference in elevation between the two rails on a curve to counteract centrifugal force.", 
    hasVisual: true, 
    visualTag: "https://images.unsplash.com/photo-1495570689269-d883b1e54f38?auto=format&fit=crop&w=800&q=80",
    videoUrl: "" 
  },
  { 
    term: "Semaphore Signal", 
    def: "A mechanical railway signal displaying information by the position of a moving arm.", 
    hasVisual: true, 
    visualTag: "https://images.unsplash.com/photo-1515165592879-1849b88c601e?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://www.youtube.com/watch?v=U54F3H-gX64" 
  },
  { 
    term: "Fishplate", 
    def: "A metal bar that is bolted to the ends of two rails to join them together in a track.", 
    hasVisual: true, 
    visualTag: "https://images.unsplash.com/photo-1533484218222-8951e287d448?auto=format&fit=crop&w=800&q=80",
    videoUrl: "" 
  }
];

const JOBS = [{ title: "Senior Locomotive Engineer", company: "BNSF Railway", location: "Fort Worth, TX", salary: "$95k - $125k", category: "Field", tags: ["Sign-on Bonus", "Union"] }];
const SIGNALS = [{ id: 'stop', colors: ['R', 'R', 'R'], name: 'Stop', rule: 'Stop.' }];

// --- RUN LOGIC ---
const run = async () => {
  try {
    // ⚡ Force 'railnology' database
    await mongoose.connect(MONGO_URI, { dbName: 'railnology' });
    console.log(`✅ Connected to: ${mongoose.connection.name}`);

    console.log('...Wiping old data...');
    await Glossary.deleteMany({});
    await Job.deleteMany({});
    await Signal.deleteMany({});

    console.log('...Injecting Secure Data...');
    await Glossary.insertMany(GLOSSARY);
    await Job.insertMany(JOBS);
    await Signal.insertMany(SIGNALS);

    console.log("🎉 SUCCESS! Database Updated via Secure Connection.");
    process.exit();
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
};

run();