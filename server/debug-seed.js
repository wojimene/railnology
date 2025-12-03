console.log("--- DIAGNOSTIC SEEDER STARTING ---");

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

// --- NEW DATA ---
const GLOSSARY = [
  { 
    term: "Pantograph", 
    def: "An apparatus mounted on the roof of an electric train to collect power.", 
    hasVisual: true, 
    visualTag: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Pantograph_Animation.gif/220px-Pantograph_Animation.gif", 
    videoUrl: "https://www.youtube.com/watch?v=AgmvqY6hU4E"
  },
  { 
    term: "Bogie (Truck)", 
    def: "A chassis or framework carrying wheels attached to a vehicle.", 
    hasVisual: true, 
    visualTag: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Baureihe_614_Drehgestell.jpg/640px-Baureihe_614_Drehgestell.jpg",
    videoUrl: "https://www.youtube.com/watch?v=45M24B9oVoI"
  }
];

const run = async () => {
  try {
    console.log("...Connecting...");
    // ⚡ FORCE connection to 'railnology' database
    await mongoose.connect(MONGO_URI, { dbName: 'railnology' });
    
    // 🔍 DIAGNOSTIC LOG: Where are we connected?
    console.log(`✅ Connected to Host: ${mongoose.connection.host}`);
    console.log(`✅ Database Name: ${mongoose.connection.name}`);

    console.log('...Deleting old glossary...');
    const deleteResult = await Glossary.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} old terms.`);

    console.log('...Inserting new glossary...');
    const insertResult = await Glossary.insertMany(GLOSSARY);
    console.log(`✨ Inserted ${insertResult.length} new terms.`);

    console.log("🎉 SUCCESS! Database updated.");
    process.exit();
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
};

run();