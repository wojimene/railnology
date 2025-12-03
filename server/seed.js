console.log("--- SCRIPT STARTING ---");

import mongoose from 'mongoose';

// --- CONFIGURATION ---
// 🔴 PASTE YOUR MONGODB CONNECTION STRING HERE 🔴
const MONGO_URI = 'mongodb+srv://wsg_db_user:dRXAM6L3KjaYAdKE@cluster0.dz1naih.mongodb.net/?appName=Cluster0'; 

if (!MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is missing. Please paste the string from Render/Atlas.");
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

// --- SCHEMAS FOR JOBS & SIGNALS ---
const JobSchema = new mongoose.Schema({ title: String, company: String, location: String, salary: String, category: String, tags: [String] });
const SignalSchema = new mongoose.Schema({ id: String, name: String, rule: String, colors: [String] });
const Job = mongoose.model('Job', JobSchema);
const Signal = mongoose.model('Signal', SignalSchema);

// --- NEW ROBUST DATA ---
const GLOSSARY = [
  { 
    term: "Pantograph", 
    def: "An apparatus mounted on the roof of an electric train to collect power through contact with an overhead catenary wire.", 
    hasVisual: true, 
    // Animated GIF (Direct Link)
    visualTag: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Pantograph_Animation.gif", 
    videoUrl: "https://www.youtube.com/watch?v=AgmvqY6hU4E"
  },
  { 
    term: "Bogie (Truck)", 
    def: "A chassis or framework carrying wheels, attached to a vehicle, serving as a modular subassembly of wheels and axles.", 
    hasVisual: true, 
    // Static JPG (Direct Link)
    visualTag: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Baureihe_614_Drehgestell.jpg",
    videoUrl: "https://www.youtube.com/watch?v=45M24B9oVoI"
  },
  { 
    term: "Cant (Superelevation)", 
    def: "The difference in elevation between the two rails on a curve, designed to counteract centrifugal force.", 
    hasVisual: true, 
    // PNG Diagram (Direct Link)
    visualTag: "https://upload.wikimedia.org/wikipedia/commons/c/c6/Rail_superelevation.svg",
    videoUrl: ""
  },
  { 
    term: "Semaphore Signal", 
    def: "A mechanical railway signal displaying information by the position of a moving arm (blade).", 
    hasVisual: true, 
    // JPG Photo (Direct Link)
    visualTag: "https://upload.wikimedia.org/wikipedia/commons/5/56/Semaphore_Signal_Go.jpg",
    videoUrl: "https://www.youtube.com/watch?v=U54F3H-gX64"
  },
  { term: "Fishplate", def: "A metal bar that is bolted to the ends of two rails to join them together in a track.", hasVisual: true, visualTag: "https://upload.wikimedia.org/wikipedia/commons/5/52/Rail_joint_fishplate.jpg", videoUrl: "" },
  { term: "Interlocking", def: "An arrangement of signal apparatus that prevents conflicting movements through an arrangement of tracks.", hasVisual: false, visualTag: "", videoUrl: "" },
  { term: "Ballast", def: "Crushed stones beneath the track that hold ties in place and allow drainage.", hasVisual: false, visualTag: "", videoUrl: "" },
  { term: "Standard Gauge", def: "The most common spacing of rail tracks globally: 1,435 mm (4 ft 8 1⁄2 in).", hasVisual: false, visualTag: "", videoUrl: "" },
  { term: "Deadman's Switch", def: "A safety device that automatically applies the brakes if the human operator becomes incapacitated.", hasVisual: false, visualTag: "", videoUrl: "" }
];

// Placeholder Data for other collections
const JOBS = [
  { title: "Senior Locomotive Engineer", company: "BNSF Railway", location: "Fort Worth, TX", salary: "$95k - $125k", category: "Field", tags: ["Sign-on Bonus", "Union"] },
  { title: "Track Inspector (Geometry)", company: "Canadian National", location: "Chicago, IL", salary: "$36/hr + Benefits", category: "Engineering", tags: ["Urgent", "Travel Required"] },
  { title: "Rail Systems Manager", company: "Brightline West", location: "Las Vegas, NV", salary: "$130k - $160k", category: "Management", tags: ["High Speed Rail", "New Project"] },
];
const SIGNALS = [
  { id: 'clear', colors: ['G', 'R', 'R'], name: 'Clear', rule: 'Proceed at track speed.' },
  { id: 'stop', colors: ['R', 'R', 'R'], name: 'Stop', rule: 'Stop.' }
];

// --- SEED LOGIC ---
const run = async () => {
  try {
    console.log("...Connecting...");
    // ⚡ Ensuring we connect to the correct DB name 'railnology'
    await mongoose.connect(MONGO_URI, { dbName: 'railnology' });
    console.log(`✅ Connected to Host: ${mongoose.connection.host}`);

    console.log('...Refreshing Glossary...');
    await Glossary.deleteMany({});
    await Glossary.insertMany(GLOSSARY);
    
    console.log('...Refreshing Jobs & Signals...');
    await Job.deleteMany({});
    await Job.insertMany(JOBS);
    await Signal.deleteMany({});
    await Signal.insertMany(SIGNALS);

    console.log("🎉 SUCCESS! Database updated with reliable image links.");
    process.exit();
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
};

run();