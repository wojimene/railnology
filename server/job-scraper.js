console.log("--- JOB AGGREGATOR ENGINE STARTING ---");

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const RAPID_API_KEY = process.env.RAPID_API_KEY; 

if (!MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is missing from .env file.");
    process.exit(1);
}

// --- SCHEMA DEFINITION (Must match server.js) ---
const JobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  salary: String,
  category: String,
  tags: [String],
  postedAt: { type: Date, default: Date.now },
  // ✅ Rich Data Fields
  externalLink: String,   // Direct Apply Link
  description: String,    // Job Summary
  logo: String,           // Company Logo URL
  jobType: String         // Full-time, Contract, etc.
});

const Job = mongoose.model('Job', JobSchema);

// --- FALLBACK DATA (High Quality Mock Data) ---
const FALLBACK_JOBS = [
    { 
        title: "Passenger Engineer Trainee", 
        company: "Amtrak", 
        location: "Philadelphia, PA", 
        salary: "$32.50/hr", 
        category: "Field", 
        tags: ["Union", "External"], 
        externalLink: "https://careers.amtrak.com",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Amtrak_logo.svg/512px-Amtrak_logo.svg.png",
        description: "Learn to operate locomotives safely and efficiently. Comprehensive training program provided.",
        jobType: "Full-time"
    },
    { 
        title: "Train Crew (Conductor)", 
        company: "Union Pacific", 
        location: "North Platte, NE", 
        salary: "$55k - $90k", 
        category: "Field", 
        tags: ["Sign-on Bonus", "External"], 
        externalLink: "https://up.jobs",
        logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a5/Union_Pacific_Logo.svg/512px-Union_Pacific_Logo.svg.png",
        description: "Responsible for the safe movement of trains and rail cars. Outdoor work environment.",
        jobType: "Full-time"
    },
    { 
        title: "Rail Systems Manager", 
        company: "Brightline", 
        location: "Orlando, FL", 
        salary: "$120k - $150k", 
        category: "Management", 
        tags: ["High Speed Rail", "External"], 
        externalLink: "https://www.gobrightline.com/careers",
        logo: "https://upload.wikimedia.org/wikipedia/commons/2/26/Brightline_logo.svg",
        description: "Oversee the implementation and maintenance of signaling and communication systems.",
        jobType: "Full-time"
    }
];

// --- FETCH REAL JOBS ---
const fetchRealJobs = async () => {
    if (!RAPID_API_KEY) {
        console.warn("⚠️  RAPID_API_KEY missing. Using rich fallback data.");
        return FALLBACK_JOBS;
    }

    console.log("🌐 Connecting to JSearch API (LinkedIn/Indeed)...");
    
    const url = 'https://jsearch.p.rapidapi.com/search?query=Railroad%20jobs%20in%20USA&num_pages=1';
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            console.log("🔍 API Debug Response:", JSON.stringify(data, null, 2));
            throw new Error("API returned no jobs.");
        }

        console.log(`✅ API Success! Retrieved ${data.data.length} real jobs.`);
        
        // Transform API data to match our Schema
        return data.data.map(job => ({
            title: job.job_title,
            company: job.employer_name,
            location: `${job.job_city || ''}, ${job.job_state || 'USA'}`,
            salary: job.job_min_salary ? `$${job.job_min_salary}` : (job.job_salary_currency ? "Competitive" : "DOE"),
            category: determineCategory(job.job_title),
            
            // ✅ Metadata & Rich Content
            tags: [job.job_is_remote ? "Remote" : "On-Site", "External"],
            externalLink: job.job_apply_link,
            logo: job.employer_logo || null, // API provides logo URLs often
            description: job.job_description ? job.job_description.substring(0, 200) + "..." : "Click to read full description.",
            jobType: job.job_employment_type || "Full-time",
            
            postedAt: new Date()
        }));

    } catch (error) {
        console.error("❌ API Fetch Failed:", error.message);
        console.log("⚠️  Reverting to fallback data...");
        return FALLBACK_JOBS;
    }
};

// Helper to guess category based on title
const determineCategory = (title) => {
    const t = title.toLowerCase();
    if (t.includes('engineer') || t.includes('conductor') || t.includes('mechanic')) return "Field";
    if (t.includes('manager') || t.includes('director') || t.includes('superintendent')) return "Management";
    if (t.includes('analyst') || t.includes('dispatcher') || t.includes('scheduler')) return "Office";
    return "Engineering";
};

const scrape = async () => {
  try {
    console.log("...Connecting to Database...");
    await mongoose.connect(MONGO_URI, { dbName: 'railnology' });
    console.log(`✅ Connected to: ${mongoose.connection.name}`);

    const newJobs = await fetchRealJobs();

    console.log('...Refreshing Job Board (External Jobs Only)...');
    
    // ⚠️ SAFETY: Only delete jobs tagged as "External".
    // This preserves jobs manually posted by your paying Company Users.
    const deleteResult = await Job.deleteMany({ tags: "External" });
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} old scraped jobs.`);

    await Job.insertMany(newJobs);

    console.log(`🎉 SUCCESS! ${newJobs.length} Rich Jobs Posted.`);
    process.exit();
  } catch (err) {
    console.error("❌ SCRIPT ERROR:", err);
    process.exit(1);
  }
};

scrape();