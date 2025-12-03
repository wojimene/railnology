console.log("--- SCRIPT STARTING ---");

import mongoose from 'mongoose';

// --- CONFIGURATION ---
// 🔴 PASTE YOUR RENDER CONNECTION STRING HERE 🔴
const MONGO_URI = 'mongodb+srv://wsg_db_user:dRXAM6L3KjaYAdKE@cluster0.dz1naih.mongodb.net/?appName=Cluster0'; 

if (!MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is missing.");
    process.exit(1);
}

// --- SCHEMAS ---
const GlossarySchema = new mongoose.Schema({
  term: String,
  def: String,
  hasVisual: Boolean,
  visualTag: String, // Will now store paths like "/diagrams/pantograph.gif"
  videoUrl: String 
});
const Glossary = mongoose.model('Glossary', GlossarySchema);

const JobSchema = new mongoose.Schema({ title: String, company: String, location: String, salary: String, category: String, tags: [String] });
const SignalSchema = new mongoose.Schema({ id: String, name: String, rule: String, colors: [String] });
const Job = mongoose.model('Job', JobSchema);
const Signal = mongoose.model('Signal', SignalSchema);

// --- NEW SELF-HOSTED DATA ---
const GLOSSARY = [
  { 
    term: "Pantograph", 
    def: "An apparatus mounted on the roof of an electric train to collect power.", 
    hasVisual: true, 
    visualTag: "/diagrams/pantograph.gif", // ✅ Points to public/diagrams/pantograph.gif
    videoUrl: "https://www.youtube.com/watch?v=AgmvqY6hU4E"
  },
  { 
    term: "Bogie (Truck)", 
    def: "A chassis or framework carrying wheels attached to a vehicle.", 
    hasVisual: true, 
    visualTag: "/diagrams/bogie.jpg", // ✅ Points to public/diagrams/bogie.jpg
    videoUrl: "https://www.youtube.com/watch?v=45M24B9oVoI"
  },
  { 
    term: "Cant (Superelevation)", 
    def: "The difference in elevation between the two rails on a curve.", 
    hasVisual: true, 
    visualTag: "/diagrams/cant.png", // ✅ Points to public/diagrams/cant.png
    videoUrl: "" 
  },
  { 
    term: "Semaphore Signal", 
    def: "A mechanical railway signal displaying information by position.", 
    hasVisual: true, 
    visualTag: "/diagrams/semaphore.jpg", // ✅ Points to public/diagrams/semaphore.jpg
    videoUrl: "https://www.youtube.com/watch?v=U54F3H-gX64" 
  },
  { 
    term: "Fishplate", 
    def: "A metal bar bolted to the ends of two rails to join them.", 
    hasVisual: true, 
    visualTag: "/diagrams/fishplate.jpg", // ✅ Points to public/diagrams/fishplate.jpg
    videoUrl: "" 
  }
];

// Placeholder Data
const JOBS = [{ title: "Senior Locomotive Engineer", company: "BNSF Railway", location: "Fort Worth, TX", salary: "$95k - $125k", category: "Field", tags: ["Sign-on Bonus", "Union"] }];
const SIGNALS = [{ id: 'stop', colors: ['R', 'R', 'R'], name: 'Stop', rule: 'Stop.' }];

// --- RUN LOGIC ---
const run = async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'railnology' });
    console.log(`✅ Connected to: ${mongoose.connection.name}`);

    await Glossary.deleteMany({});
    await Glossary.insertMany(GLOSSARY);
    await Job.deleteMany({});
    await Job.insertMany(JOBS);
    await Signal.deleteMany({});
    await Signal.insertMany(SIGNALS);

    console.log("🎉 SUCCESS! Database updated to use Self-Hosted Assets.");
    process.exit();
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
};

run();