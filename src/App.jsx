import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { 
  Train, Globe, BookOpen, Briefcase, Wrench, Lock, Search, 
  ChevronRight, Calculator, AlertTriangle, ArrowRight, Star, 
  Zap, Menu, X, Eye, RotateCcw, Filter, Loader2, WifiOff, ServerCrash,
  PlusCircle, Save, CheckCircle, Database, LogIn, User, Image as ImageIcon, Video
} from 'lucide-react';

// ==========================================
// 1. AUTHENTICATION SETUP
// ==========================================

// 🅰️ REAL CLERK (Uncomment this line for Local/Production use):
 import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";


// ==========================================
// 2. CONFIGURATION SETUP
// ==========================================

// 🅰️ PRODUCTION (Uncomment for Vercel deployment):
 const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// 🅱️ LOCAL/PREVIEW (Active for now):
//const API_URL = "http://localhost:5000/api";


// --- CLERK KEY ---
// PASTE YOUR PUBLISHABLE KEY HERE (from dashboard.clerk.com)
const CLERK_KEY = "pk_test_bm92ZWwtc2t1bmstNjUuY2xlcmsuYWNjb3VudHMuZGV2JA";

// ==========================================
// 2. CONFIGURATION SETUP
// ==========================================

// 🅰️ PRODUCTION (Uncomment for Vercel deployment):
// This tells the code: "Look for a variable named VITE_API_URL in Vercel settings."
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// 🅱️ LOCAL/PREVIEW (Comment out for production):
// const API_URL = "http://localhost:5000/api";


// --- CLERK KEY ---
// PASTE YOUR PUBLISHABLE KEY HERE (from dashboard.clerk.com)
const CLERK_KEY = "pk_test_PASTE_YOUR_KEY_HERE";

// --- Branding Constants ---
const BRAND = {
  name: "Railnology",
  domain: "railnology.com",
  color: "bg-slate-900", 
  accent: "text-amber-500" 
};

// --- FALLBACK DATA ---
const FALLBACK_JOBS = [
  { id: 1, title: "Senior Locomotive Engineer", company: "BNSF Railway", location: "Fort Worth, TX", salary: "$95k - $125k", category: "Field", tags: ["Sign-on Bonus", "Union"] },
  { id: 2, title: "Track Inspector (Geometry)", company: "Canadian National", location: "Chicago, IL", salary: "$36/hr + Benefits", category: "Engineering", tags: ["Urgent", "Travel Required"] },
];
const FALLBACK_GLOSSARY = [
  { term: "Pantograph", def: "An apparatus mounted on the roof of an electric train to collect power.", hasVisual: true, visualTag: "/diagrams/pantograph.gif" },
];
const FALLBACK_SIGNALS = [
  { id: 'stop', colors: ['R', 'R', 'R'], name: 'Stop', rule: 'Stop.' },
];

// --- Components ---

const TabButton = ({ active, id, icon: Icon, label, onClick }) => (
  <button 
    onClick={() => onClick(id)}
    className={`flex flex-col items-center justify-center w-full py-3 transition-all duration-200 border-t-2 ${
      active === id ? 'border-amber-500 text-slate-900 bg-slate-50' : 'border-transparent text-gray-400 hover:text-gray-600'
    }`}
  >
    <Icon className={`w-5 h-5 mb-1 ${active === id ? 'stroke-[2.5px]' : ''}`} />
    <span className="text-[10px] font-bold tracking-wide uppercase">{label}</span>
  </button>
);

const Header = ({ isOffline }) => (
  <div className={`${BRAND.color} text-white p-4 sticky top-0 z-50 shadow-md`}>
    {isOffline && (
      <div className="absolute top-0 left-0 right-0 bg-amber-500 text-slate-900 text-[10px] font-bold text-center py-0.5">
        OFFLINE / DEMO MODE
      </div>
    )}
    <div className={`flex justify-between items-center ${isOffline ? 'mt-2' : ''}`}>
      <div className="flex items-center space-x-2">
        <div className="bg-amber-500 p-1.5 rounded-md text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
          <Train className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight leading-none">{BRAND.name}</h1>
          <p className="text-[9px] text-slate-400 tracking-widest font-medium">EST. 2025</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        {/* AUTH BUTTONS */}
        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center">
              <LogIn className="w-3 h-3 mr-1.5" /> Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </div>
  </div>
);

const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-5 mt-2">
    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
    {subtitle && <p className="text-slate-500 text-xs font-medium mt-1">{subtitle}</p>}
  </div>
);

// --- Admin Components ---

const AdminInput = ({ label, value, onChange, placeholder, type="text" }) => (
  <div className="mb-3">
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
    />
  </div>
);

const AdminView = ({ refreshData, isOffline }) => {
  const [mode, setMode] = useState('job'); 
  const [status, setStatus] = useState(null); 
  const [jobForm, setJobForm] = useState({ title: '', company: '', location: '', salary: '', category: 'Field' });
  const [termForm, setTermForm] = useState({ term: '', def: '', hasVisual: false, visualTag: '', videoUrl: '' });
  
  const handleSubmit = async () => {
    if (isOffline) { alert("Cannot save in Offline Mode"); return; }
    setStatus(null);
    let endpoint = mode === 'job' ? '/jobs' : '/glossary';
    let body = mode === 'job' ? { ...jobForm, tags: ["New"] } : termForm;

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Failed to save");
      setStatus('success');
      refreshData();
      setJobForm({ title: '', company: '', location: '', salary: '', category: 'Field' });
      setTermForm({ term: '', def: '', hasVisual: false, visualTag: '', videoUrl: '' });
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex items-center space-x-2 mb-4">
        <Lock className="w-4 h-4 text-slate-900" />
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Admin Dashboard</h3>
      </div>
      
      <div className="flex bg-white p-1 rounded-lg border border-slate-200 mb-4">
        {['job', 'term'].map(m => (
          <button key={m} onClick={() => setMode(m)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md capitalize transition ${mode === m ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
            Add {m}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        {mode === 'job' && (
          <>
            <AdminInput label="Job Title" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} />
            <AdminInput label="Company" value={jobForm.company} onChange={e => setJobForm({...jobForm, company: e.target.value})} />
            <AdminInput label="Location" value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} />
            <AdminInput label="Salary" value={jobForm.salary} onChange={e => setJobForm({...jobForm, salary: e.target.value})} />
          </>
        )}
        {mode === 'term' && (
          <>
            <AdminInput label="Term" value={termForm.term} onChange={e => setTermForm({...termForm, term: e.target.value})} />
            <textarea className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm h-20 mb-3" placeholder="Definition..." value={termForm.def} onChange={e => setTermForm({...termForm, def: e.target.value})}></textarea>
            
            {/* IMAGE URL INPUT */}
            <div className="mb-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Image URL or Path (Optional)</label>
              <div className="flex items-center">
                <input 
                  type="text"
                  placeholder="/diagrams/image.jpg"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm"
                  value={termForm.visualTag}
                  onChange={e => setTermForm({...termForm, visualTag: e.target.value, hasVisual: !!e.target.value})}
                />
                {/* Preview Thumbnail */}
                {termForm.visualTag && (
                  <div className="ml-2 w-8 h-8 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                    <img src={termForm.visualTag} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

             {/* VIDEO URL INPUT */}
             <div className="mb-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">YouTube URL (Optional)</label>
              <input 
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm"
                value={termForm.videoUrl}
                onChange={e => setTermForm({...termForm, videoUrl: e.target.value})}
              />
            </div>
          </>
        )}
        <button onClick={handleSubmit} disabled={isOffline} className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-xs hover:bg-slate-800 transition">Save Data</button>
        {status === 'success' && <p className="text-emerald-600 text-xs font-bold mt-2 text-center">Saved!</p>}
      </div>
    </div>
  );
};

// --- Standard Views ---

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-slate-400">
    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
    <p className="text-xs font-bold uppercase tracking-widest">Connecting...</p>
  </div>
);

const ErrorScreen = ({ msg }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-slate-400 px-6 text-center">
    <WifiOff className="w-10 h-10 text-slate-300 mb-4" />
    <p className="text-sm font-bold text-slate-600 mb-2">Connection Issue</p>
    <p className="text-xs leading-relaxed max-w-[280px] mx-auto">{msg}</p>
  </div>
);

const HomeView = ({ changeTab, jobs }) => (
  <div className="pb-20">
    <div className="bg-slate-900 text-white pt-6 pb-12 px-6 rounded-b-[2rem] shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      <div className="relative z-10">
        <span className="inline-block px-2 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded mb-3 border border-amber-500/20">DAILY BRIEFING</span>
        <h2 className="text-2xl font-bold mb-2 leading-tight">Future of Freight</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-[90%] leading-relaxed">How autonomous rail cars are reshaping the supply chain in 2025.</p>
      </div>
    </div>
    <div className="mt-8 px-4">
      <div className="flex justify-between items-end mb-4">
        <SectionTitle title="Recent Listings" subtitle="Top-tier opportunities." />
        <button onClick={() => changeTab('jobs')} className="text-xs font-bold text-amber-600 flex items-center mb-5">View All <ArrowRight className="w-3 h-3 ml-1" /></button>
      </div>
      <div className="space-y-3">
        {jobs && jobs.length > 0 ? jobs.slice(0, 3).map((job) => (
          <div key={job._id || job.id || Math.random()} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{job.title}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{job.company}</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{job.salary ? job.salary.split(' ')[0] : 'DOE'}</span>
          </div>
        )) : <div className="text-center p-4 text-slate-400 text-xs italic">No jobs available.</div>}
      </div>
    </div>
  </div>
);

const LearnView = ({ glossary }) => {
  const [term, setTerm] = useState('');
  const filtered = useMemo(() => glossary.filter(g => (g.term || '').toLowerCase().includes(term.toLowerCase())), [term, glossary]);
  
  // --- VISUAL CARD (FIXED to allow relative paths) ---
  const MediaCard = ({ item }) => {
    const getYoutubeId = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url?.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };
    const videoId = getYoutubeId(item.videoUrl);

    return (
      <div className="mt-3 bg-slate-50 rounded-lg border border-slate-200 p-3">
        {/* Image Section */}
        {item.hasVisual && (
          <div className="mb-3">
            <div className="flex items-center text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
              <Eye className="w-3 h-3 mr-1.5" /> Visual Reference
            </div>
            <div className="bg-white p-2 rounded border border-dashed border-slate-300 flex flex-col items-center justify-center text-center overflow-hidden min-h-[150px] relative">
              {/* ✅ Logic Update: Now checks if visualTag exists, NOT if it starts with http */}
              {item.visualTag ? (
                <img 
                  src={item.visualTag} 
                  alt={item.term} 
                  className="w-full h-auto max-h-48 object-contain rounded"
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src="https://placehold.co/300x150?text=Image+Unavailable"; 
                  }}
                />
              ) : (
                <div className="text-slate-400 text-xs italic py-4">No schematic available.</div>
              )}
            </div>
          </div>
        )}

        {/* Video Section */}
        {videoId && (
          <div>
             <div className="flex items-center text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
              <Video className="w-3 h-3 mr-1.5" /> Video Lesson
            </div>
            <div className="bg-black rounded-lg overflow-hidden aspect-video shadow-sm">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${videoId}`} 
                title={item.term} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-20 px-4 pt-6 bg-slate-50 min-h-full">
      <SectionTitle title="Visual Dictionary" subtitle="Technical definitions." />
      <input type="text" placeholder="Search..." className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-4 py-3 mb-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={term} onChange={(e) => setTerm(e.target.value)} />
      <div className="space-y-4">
        {filtered.map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900">{item.term}</h3>
            <p className="text-sm text-slate-600 mt-2">{item.def}</p>
            {(item.hasVisual || item.videoUrl) && <MediaCard item={item} />}
          </div>
        ))}
      </div>
    </div>
  );
};

const JobsView = ({ jobs }) => (
  <div className="pb-20 px-4 pt-6 bg-slate-50 min-h-full">
    <SectionTitle title="Career Opportunities" subtitle="Find your next role." />
    <div className="space-y-3">
      {jobs.map((job) => (
        <div key={job._id || job.id || Math.random()} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-slate-800">{job.title}</h3>
              <p className="text-xs font-medium text-slate-500">{job.company}</p>
            </div>
            <div className="flex items-center text-xs text-slate-400 mt-2"><Globe className="w-3 h-3 mr-1" /> {job.location}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ToolsView = ({ signalAspects }) => (
  <div className="pb-20 bg-slate-50 min-h-full px-4 pt-6">
    <SectionTitle title="Engineer's Toolkit" subtitle="Field utilities." />
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-4">
      <div className="flex items-center space-x-2 mb-4"><AlertTriangle className="w-5 h-5 text-amber-500" /><h3 className="font-bold text-slate-800">Signal Decoder</h3></div>
      <p className="text-xs text-slate-500">Interactive signal mast visualization coming soon.</p>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---

const MainContent = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ jobs: [], glossary: [], signals: [] });
  const [isOffline, setIsOffline] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();

  const fetchData = async () => {
    setLoading(true);
    setIsOffline(false);
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000));
      const [jobsRes, glossaryRes, signalsRes] = await Promise.race([
        Promise.all([fetch(`${API_URL}/jobs`), fetch(`${API_URL}/glossary`), fetch(`${API_URL}/signals`)]),
        timeoutPromise
      ]);
      if (!jobsRes.ok) throw new Error('Failed to connect to API server.');
      setData({ jobs: await jobsRes.json(), glossary: await glossaryRes.json(), signals: await signalsRes.json() });
    } catch (err) {
      console.warn("API Unavailable, switching to demo mode.");
      setIsOffline(true);
      setData({ jobs: FALLBACK_JOBS, glossary: FALLBACK_GLOSSARY, signals: FALLBACK_SIGNALS });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- ADMIN CHECK LOGIC ---
  const ADMIN_EMAIL = "winstonjimenez@gmail.com"; 
  const isSuperAdmin = isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center font-sans">
      <div className="w-full max-w-md h-full min-h-screen bg-slate-50 shadow-2xl relative flex flex-col">
        <Header isOffline={isOffline} />
        
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* SECURE ADMIN PANEL */}
          {activeTab === 'home' && isSuperAdmin && (
            <AdminView refreshData={fetchData} isOffline={isOffline} />
          )}

          {loading ? <LoadingScreen /> : error ? <ErrorScreen msg={error} /> : (
            <>
              {activeTab === 'home' && <HomeView changeTab={setActiveTab} jobs={data.jobs} />}
              {activeTab === 'learn' && <LearnView glossary={data.glossary} />}
              {activeTab === 'tools' && <ToolsView signalAspects={data.signals} />}
              {activeTab === 'jobs' && <JobsView jobs={data.jobs} />} 
            </>
          )}
        </div>

        <div className="bg-white border-t border-slate-200 px-4 pb-safe sticky bottom-0 z-50">
          <div className="flex justify-between items-center h-16">
            <TabButton active={activeTab} id="home" icon={Train} label="Home" onClick={setActiveTab} />
            <TabButton active={activeTab} id="learn" icon={BookOpen} label="Library" onClick={setActiveTab} />
            <TabButton active={activeTab} id="tools" icon={Wrench} label="Tools" onClick={setActiveTab} />
            <TabButton active={activeTab} id="jobs" icon={Briefcase} label="Jobs" onClick={setActiveTab} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the App in the Clerk Provider
const App = () => {
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <MainContent />
    </ClerkProvider>
  );
};

export default App;