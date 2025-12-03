console.log("--- PRODUCTION SEEDER STARTING ---");

import mongoose from 'mongoose';

// --- CONFIGURATION ---
// 🔴 PASTE YOUR RENDER CONNECTION STRING HERE 🔴
const MONGO_URI = 'mongodb+srv://wsg_db_user:dRXAM6L3KjaYAdKE@cluster0.dz1naih.mongodb.net/?appName=Cluster0'; 

if (!MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is missing. Please paste the string from Render.");
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

// --- DATA (Stable Special:FilePath Links) ---
const GLOSSARY = [
  { 
    term: "Pantograph", 
    def: "An apparatus mounted on the roof of an electric train to collect power.", 
    hasVisual: true, 
    // Using standard Wikimedia redirect link which is more stable than direct /thumb/ links
    visualTag: "https://commons.wikimedia.org/wiki/Special:FilePath/Pantograph_Animation.gif", 
    videoUrl: "https://www.youtube.com/watch?v=AgmvqY6hU4E"
  },
  { 
    term: "Bogie (Truck)", 
    def: "A chassis or framework carrying wheels attached to a vehicle.", 
    hasVisual: true, 
    visualTag: "https://commons.wikimedia.org/wiki/Special:FilePath/Bogie_Y32.jpg",
    videoUrl: "https://www.youtube.com/watch?v=45M24B9oVoI"
  },
  { 
    term: "Cant (Superelevation)", 
    def: "The difference in elevation between the two rails on a curve.", 
    hasVisual: true, 
    visualTag: "https://commons.wikimedia.org/wiki/Special:FilePath/Rail_superelevation.svg",
    videoUrl: "" 
  }
];

// Placeholder data for others...
const JOBS = [{ title: "Senior Locomotive Engineer", company: "BNSF Railway", location: "Fort Worth, TX", salary: "$95k - $125k", category: "Field", tags: ["Sign-on Bonus", "Union"] }];
const SIGNALS = [{ id: 'stop', colors: ['R', 'R', 'R'], name: 'Stop', rule: 'Stop.' }];

// --- RUN LOGIC ---
const run = async () => {
  try {
    console.log("...Connecting to MongoDB...");
    
    // ⚡ Force connection to the 'railnology' database
    await mongoose.connect(MONGO_URI, { dbName: 'railnology' });
    
    console.log(`✅ Connected to Host: ${mongoose.connection.host}`);
    console.log(`✅ Database Name: ${mongoose.connection.name}`); 

    console.log('...Wiping old data...');
    await Glossary.deleteMany({});
    await Job.deleteMany({});
    await Signal.deleteMany({});

    console.log('...Injecting Stable Image URLs...');
    await Glossary.insertMany(GLOSSARY);
    await Job.insertMany(JOBS);
    await Signal.insertMany(SIGNALS);

    console.log("🎉 SUCCESS! Production Database Updated.");
    process.exit();
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
};

run();