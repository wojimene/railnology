console.log("--- RAILLLM INGESTION ENGINE ---");

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!MONGO_URI) { console.error("❌ MONGO_URI missing."); process.exit(1); }
if (!OPENAI_API_KEY) { console.error("❌ OPENAI_API_KEY missing. Cannot generate embeddings."); process.exit(1); }

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// --- SCHEMAS ---
// 1. The Source Data (Read-Only here)
const StandardSchema = new mongoose.Schema({ code: String, title: String, description: String });
const RegulationSchema = new mongoose.Schema({ code: String, title: String, summary: String });
const ManualSchema = new mongoose.Schema({ title: String, category: String, version: String });

const Standard = mongoose.model('Standard', StandardSchema);
const Regulation = mongoose.model('Regulation', RegulationSchema);
const Manual = mongoose.model('Manual', ManualSchema);

// 2. The Vector Store (Write Target)
const KnowledgeChunkSchema = new mongoose.Schema({
  sourceId: String,       // ID of the original document
  sourceType: String,     // "Standard", "Regulation", "Manual"
  content: String,        // The actual text chunk
  embedding: [Number],    // The vector (1536 dimensions for text-embedding-3-small)
  metadata: Object        // Extra info (e.g. title, code)
});

const KnowledgeChunk = mongoose.model('knowledge_chunk', KnowledgeChunkSchema); // Singular name forces collection 'knowledge_chunks'

// --- UTILS ---
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  return response.data[0].embedding;
}

const ingest = async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'railnology' });
    console.log("✅ Connected to DB.");

    // 1. Clear old vectors
    console.log("...Clearing old knowledge base...");
    await KnowledgeChunk.deleteMany({});

    // 2. Fetch Source Data
    const standards = await Standard.find();
    const regulations = await Regulation.find();
    const manuals = await Manual.find();

    const allDocs = [
        ...standards.map(d => ({ type: 'Standard', text: `${d.code}: ${d.title}. ${d.description}`, meta: { title: d.title } })),
        ...regulations.map(d => ({ type: 'Regulation', text: `${d.code}: ${d.title}. ${d.summary}`, meta: { title: d.title } })),
        ...manuals.map(d => ({ type: 'Manual', text: `${d.title} (${d.category}) - Ver ${d.version}`, meta: { title: d.title } }))
    ];

    console.log(`...Processing ${allDocs.length} documents...`);

    // 3. Generate Embeddings & Save
    let count = 0;
    for (const doc of allDocs) {
        const embedding = await generateEmbedding(doc.text);
        
        await KnowledgeChunk.create({
            sourceType: doc.type,
            content: doc.text,
            embedding: embedding,
            metadata: doc.meta
        });
        process.stdout.write("."); // Progress bar
        count++;
    }

    console.log(`\n🎉 SUCCESS! Ingested ${count} intelligent chunks into Vector Store.`);
    process.exit();

  } catch (err) {
    console.error("\n❌ INGEST ERROR:", err);
    process.exit(1);
  }
};

ingest();