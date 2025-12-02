console.log("--- SCRIPT STARTING ---"); // Debug line to confirm file is running

import mongoose from 'mongoose';

// --- CONFIGURATION ---
// PASTE YOUR MONGODB CONNECTION STRING HERE
const MONGO_URI = 'mongodb://admin1:gRRE0ua7R0GWidQmZr1hVIJmDksoZeycxo5Xt6n-zuGn3oFx@13eb9c56-ed25-4e5f-8879-7795281a53d9.nam5.firestore.goog:443/default?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false'; 

// --- SCHEMAS (Must match server.js) ---
const JobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  salary: String,
  category: String,
  tags: [String]
});

const GlossarySchema = new mongoose.Schema({
  term: String,
  def: String,
  hasVisual: Boolean,
  visualTag: String
});

const SignalSchema = new mongoose.Schema({
  id: String,
  name: String,
  rule: String,
  colors: [String]
});

const Job = mongoose.model('Job', JobSchema);
const Glossary = mongoose.model('Glossary', GlossarySchema);
const Signal = mongoose.model('Signal', SignalSchema);

// --- INITIAL DATA ---
const JOBS = [
  { title: "Senior Locomotive Engineer", company: "BNSF Railway", location: "Fort Worth, TX", salary: "$95k - $125k", category: "Field", tags: ["Sign-on Bonus", "Union"] },
  { title: "Track Inspector (Geometry)", company: "Canadian National", location: "Chicago, IL", salary: "$36/hr + Benefits", category: "Engineering", tags: ["Urgent", "Travel Required"] },
  { title: "Rail Systems Manager", company: "Brightline West", location: "Las Vegas, NV", salary: "$130k - $160k", category: "Management", tags: ["High Speed Rail", "New Project"] },
  { title: "Train Dispatcher", company: "Norfolk Southern", location: "Atlanta, GA", salary: "$85k - $110k", category: "Office", tags: ["Shift Work", "Critical"] },
  { title: "Signal Technician", company: "Union Pacific", location: "Omaha, NE", salary: "$38/hr", category: "Field", tags: ["Entry Level", "Apprenticeship"] },
  { title: "Project Engineer (Civil)", company: "Amtrak", location: "Philadelphia, PA", salary: "$105k - $135k", category: "Engineering", tags: ["Hybrid", "Northeast Corridor"] }
];

const GLOSSARY = [
  { term: "Pantograph", def: "An apparatus mounted on the roof of an electric train to collect power through contact with an overhead catenary wire.", hasVisual: true, visualTag: "pantograph mechanism diagram" },
  { term: "Bogie (Truck)", def: "A chassis or framework carrying wheels, attached to a vehicle, serving as a modular subassembly of wheels and axles.", hasVisual: true, visualTag: "train bogie suspension diagram" },
  { term: "Cant (Superelevation)", def: "The difference in elevation between the two rails on a curve, designed to counteract centrifugal force.", hasVisual: true, visualTag: "railway track superelevation diagram" },
  { term: "Semaphore Signal", def: "A mechanical railway signal displaying information by the position of a moving arm (blade).", hasVisual: true, visualTag: "railway semaphore signal meanings" },
  { term: "Fishplate", def: "A metal bar that is bolted to the ends of two rails to join them together in a track.", hasVisual: true, visualTag: "railway fishplate joint" },
  { term: "Interlocking", def: "An arrangement of signal apparatus that prevents conflicting movements through an arrangement of tracks (junctions/crossings).", hasVisual: false },
  { term: "Ballast", def: "Crushed stones beneath the track that hold ties in place and allow drainage.", hasVisual: false },
  { term: "Standard Gauge", def: "The most common spacing of rail tracks globally: 1,435 mm (4 ft 8 1⁄2 in).", hasVisual: false },
  { term: "Deadman's Switch", def: "A safety device that automatically applies the brakes if the human operator becomes incapacitated.", hasVisual: false }
];

const SIGNALS = [
  { id: 'clear', colors: ['G', 'R', 'R'], name: 'Clear', rule: 'Proceed at track speed.' },
  { id: 'approach', colors: ['Y', 'R', 'R'], name: 'Approach', rule: 'Proceed preparing to stop at next signal. Train exceeding 30 MPH must reduce to 30 MPH.' },
  { id: 'approach_medium', colors: ['Y', 'G', 'R'], name: 'Approach Medium', rule: 'Proceed approaching next signal at medium speed.' },
  { id: 'approach_slow', colors: ['Y', 'R', 'G'], name: 'Approach Slow', rule: 'Proceed approaching next signal at slow speed.' },
  { id: 'stop', colors: ['R', 'R', 'R'], name: 'Stop', rule: 'Stop.' },
  { id: 'advance_approach', colors: ['Y', 'Y', 'R'], name: 'Advance Approach', rule: 'Proceed preparing to stop at second signal.' },
  { id: 'diverging_clear', colors: ['R', 'G', 'R'], name: 'Diverging Clear', rule: 'Proceed on diverging route at prescribed speed.' },
  { id: 'diverging_approach', colors: ['R', 'Y', 'R'], name: 'Diverging Approach', rule: 'Proceed on diverging route preparing to stop at next signal.' },
  { id: 'restricting', colors: ['R', 'R', 'Y'], name: 'Restricting', rule: 'Proceed at restricted speed.' },
  { id: 'clear_2', colors: ['G', 'G', 'R'], name: 'Clear (Variant)', rule: 'Proceed at track speed (System Specific).' },
];

// --- SEED LOGIC ---
const seedDB = async () => {
  if (!MONGO_URI) {
    console.error("❌ Error: MONGO_URI is missing. Please edit server/seed.js line 6.");
    process.exit(1);
  }

  try {
    console.log("...Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🧹 Clearing old data...');
    await Job.deleteMany({});
    await Glossary.deleteMany({});
    await Signal.deleteMany({});

    console.log('🌱 Seeding new data...');
    await Job.insertMany(JOBS);
    await Glossary.insertMany(GLOSSARY);
    await Signal.insertMany(SIGNALS);

    console.log('🎉 Database Populated Successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
};

seedDB();