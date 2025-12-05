import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { 
  Train, Globe, BookOpen, Briefcase, Wrench, Lock, Search, 
  ChevronRight, Calculator, AlertTriangle, ArrowRight, Star, 
  Zap, Menu, X, Eye, RotateCcw, Filter, Loader2, WifiOff, ServerCrash,
  PlusCircle, Save, CheckCircle, Database, LogIn, User, Image as ImageIcon, Video, CreditCard, Unlock, FileText, Scale, ScrollText, Shield, UserCircle, Building2, LayoutDashboard, Edit3, MapPin, Plus, Trash2
} from 'lucide-react';

// ==========================================
// 1. AUTHENTICATION SETUP
// ==========================================

// 🅰️ REAL CLERK (UNCOMMENT FOR PRODUCTION / LOCAL):
 import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

// ==========================================
// 2. CONFIGURATION & SECRETS
// ==========================================

// 🅰️ PRODUCTION (UNCOMMENT THIS BLOCK FOR PRODUCTION):

const API_URL = import.meta.env.VITE_API_URL;
const CLERK_KEY = import.meta.env.VITE_CLERK_KEY;
const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

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
];
const FALLBACK_GLOSSARY = [
  { term: "Pantograph", def: "An apparatus mounted on the roof of an electric train to collect power.", hasVisual: true, visualTag: "/diagrams/pantograph.gif" },
];
const FALLBACK_STANDARDS = [{ code: "AREMA", title: "Manual for Railway Engineering", description: "Standard specifications for design and construction." }];
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

const Header = ({ isOffline, isPro, onProfileClick }) => (
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
          <p className="text-[9px] text-slate-400 tracking-widest font-medium flex items-center">
            EST. 2025 {isPro && <span className="ml-2 bg-emerald-500 text-white px-1 rounded text-[8px]">PRO</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center">
              <LogIn className="w-3 h-3 mr-1.5" /> Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
           <button 
             onClick={onProfileClick} 
             className="flex items-center text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition mr-2 border border-white/10"
           >
             <UserCircle className="w-4 h-4 mr-1.5" /> My Profile
           </button>
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

// --- Paywall Component ---
const PaywallModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto border-4 border-white shadow-sm">
          <Lock className="w-6 h-6 text-amber-600" />
        </div>
        <h3 className="text-xl font-extrabold text-center text-slate-900 mb-2">Unlock Pro Tools</h3>
        <p className="text-center text-slate-500 text-sm mb-6 leading-relaxed">
          Get access to the **Signal Decoder**, automated compliance tools, and advanced data.
        </p>
        <div className="space-y-3">
          <a 
            href={STRIPE_PAYMENT_LINK} 
            target="_blank" 
            rel="noreferrer"
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition flex items-center justify-center"
          >
            <CreditCard className="w-4 h-4 mr-2" /> Subscribe for $4.99/mo
          </a>
          <button onClick={onClose} className="w-full py-2 text-sm text-slate-400 font-medium hover:text-slate-600">Restore Purchases</button>
        </div>
        <p className="text-[10px] text-center text-slate-300 mt-4">Secured by Stripe</p>
      </div>
    </div>
  );
};

// --- COMPANY DASHBOARD (B2B Feature) ---
const CompanyView = ({ user, mongoUser, refreshData }) => {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: '', location: '', salary: '', category: 'Field' });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (mongoUser?.companyName) {
       fetch(`${API_URL}/jobs`)
         .then(res => res.json())
         .then(data => {
            const myJobs = data.filter(j => j.company === mongoUser.companyName);
            setJobs(myJobs);
         });
    }
  }, [mongoUser]);

  const handlePostJob = async () => {
    if (!mongoUser?.companyName) return alert("Please set your Company Name in Profile first.");
    setStatus('submitting');
    try {
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, company: mongoUser.companyName, tags: ['New'] })
      });
      if (res.ok) {
        setStatus('success');
        setForm({ title: '', location: '', salary: '', category: 'Field' });
        refreshData(); // Refresh global data
        const newJob = await res.json();
        setJobs([newJob, ...jobs]);
      } else {
        setStatus('error');
      }
    } catch (e) { setStatus('error'); }
  };

  return (
    <div className="pb-20 px-4 pt-6 bg-slate-50 min-h-full">
       <SectionTitle title="Company Dashboard" subtitle={`Manage listings for ${mongoUser?.companyName || 'Your Company'}`} />
       
       <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
             <div className="text-2xl font-bold text-indigo-600">{jobs.length}</div>
             <div className="text-xs text-slate-500 font-bold uppercase">Active Listings</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
             <div className="text-2xl font-bold text-emerald-600">0</div>
             <div className="text-xs text-slate-500 font-bold uppercase">Applicants</div>
          </div>
       </div>

       <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
          <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center">
            <PlusCircle className="w-4 h-4 mr-2 text-amber-500" /> Post a New Job
          </h3>
          <div className="space-y-3">
             <input placeholder="Job Title" className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
             <div className="flex gap-2">
                <input placeholder="Location" className="flex-1 bg-slate-50 border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                <input placeholder="Salary" className="flex-1 bg-slate-50 border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} />
             </div>
             <select className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option>Field</option>
                <option>Engineering</option>
                <option>Management</option>
                <option>Office</option>
             </select>
             <button onClick={handlePostJob} className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-xs hover:bg-slate-800 transition">Post Job</button>
             {status === 'success' && <p className="text-emerald-600 text-xs font-bold mt-2 text-center">Job Posted Successfully!</p>}
          </div>
       </div>

       <h3 className="font-bold text-slate-800 text-sm mb-3">Your Active Listings</h3>
       <div className="space-y-2">
          {jobs.map(job => (
             <div key={job._id || Math.random()} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                   <div className="font-bold text-slate-700 text-sm">{job.title}</div>
                   <div className="text-xs text-slate-400">{job.location} • {job.salary}</div>
                </div>
                <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded border border-emerald-100">Active</div>
             </div>
          ))}
          {jobs.length === 0 && <div className="text-center text-slate-400 text-xs py-4 italic border-2 border-dashed border-slate-100 rounded-lg">No active jobs. Post one above!</div>}
       </div>
    </div>
  );
};

// --- PROFILE VIEW ---
const ProfileView = ({ user, mongoUser, refreshProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    role: 'individual', companyName: '', jobTitle: '', headline: '', location: '', about: '' 
  });
  
  const [experience, setExperience] = useState([
     { id: 1, title: "Senior Conductor", company: "Amtrak", dates: "2018 - Present" }
  ]);

  useEffect(() => {
    if (mongoUser) {
      setFormData(prev => ({
        ...prev,
        role: mongoUser.role || 'individual',
        companyName: mongoUser.companyName || '',
        jobTitle: mongoUser.jobTitle || ''
      }));
    }
  }, [mongoUser]);

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) { setIsEditing(false); refreshProfile(); }
    } catch (err) { console.error("Failed to update profile", err); }
  };

  const addExperience = () => {
     const title = prompt("Job Title:");
     if(title) setExperience([...experience, { id: Date.now(), title, company: "New Company", dates: "2024 - Present" }]);
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-full">
       {/* Profile Banner & Header */}
       <div className="bg-white border-b border-slate-200 pb-6 mb-4">
          <div className={`h-24 ${formData.role === 'company' ? 'bg-slate-900' : 'bg-gradient-to-r from-sky-500 to-indigo-500'} relative`}></div>
          <div className="px-4 -mt-10 relative">
             <div className="flex justify-between items-end">
                <img src={user.imageUrl} className="w-24 h-24 rounded-full border-4 border-white shadow-md" />
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="mb-2 flex items-center text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition">
                     <Edit3 className="w-3 h-3 mr-1.5" /> Edit Profile
                  </button>
                )}
             </div>
             <div className="mt-3">
                <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
                <p className="text-sm text-slate-600">{formData.headline || (formData.role === 'company' ? 'Railroad Operations Company' : 'Rail Industry Professional')}</p>
                <div className="flex items-center text-xs text-slate-400 mt-1">
                   <MapPin className="w-3 h-3 mr-1" /> {formData.location || "New York, USA"}
                   <span className="mx-2">•</span>
                   <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Contact Info</span>
                </div>
             </div>
          </div>
       </div>

       <div className="px-4 space-y-4">
          
          {/* Account Settings Card */}
          {isEditing && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4">
                <h4 className="font-bold text-slate-900 text-sm mb-4">Edit Intro</h4>
                <div className="space-y-3">
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Account Type</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                        <option value="individual">Individual</option><option value="company">Company</option>
                      </select>
                   </div>
                   {formData.role === 'individual' ? (
                      <input className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" placeholder="Headline (e.g. Signal Engineer)" value={formData.headline} onChange={e => setFormData({...formData, headline: e.target.value})} />
                   ) : (
                      <input className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm" placeholder="Company Name" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                   )}
                   <div className="flex gap-2 pt-2">
                      <button onClick={() => setIsEditing(false)} className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg">Cancel</button>
                      <button onClick={handleSave} className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow">Save</button>
                   </div>
                </div>
            </div>
          )}

          {/* About Section */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-900 text-sm">About</h3>
             </div>
             <p className="text-xs text-slate-600 leading-relaxed">
               {formData.about || "Passionate rail industry professional with experience in signaling and operations. Focused on safety and efficiency."}
             </p>
          </div>

          {/* Experience Section (Only for Individuals) */}
          {formData.role === 'individual' && (
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-900 text-sm">Experience</h3>
                   <button onClick={addExperience}><Plus className="w-4 h-4 text-slate-400 hover:text-indigo-600" /></button>
                </div>
                <div className="space-y-4">
                   {experience.map((exp, i) => (
                      <div key={exp.id} className="flex gap-3">
                         <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center flex-shrink-0"><Building2 className="w-5 h-5 text-slate-400" /></div>
                         <div className="flex-1 border-b border-slate-100 pb-4 last:border-0">
                            <h4 className="text-sm font-bold text-slate-800">{exp.title}</h4>
                            <p className="text-xs text-slate-600">{exp.company}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{exp.dates}</p>
                         </div>
                         {isEditing && <button onClick={() => setExperience(experience.filter(e => e.id !== exp.id))}><Trash2 className="w-3 h-3 text-red-300 hover:text-red-500" /></button>}
                      </div>
                   ))}
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

// --- ADMIN VIEW (System Admin) ---
const AdminInput = ({ label, value, onChange, placeholder, type="text" }) => (
  <div className="mb-3"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label><input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" /></div>
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
      const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed to save");
      setStatus('success'); refreshData();
      setJobForm({ title: '', company: '', location: '', salary: '', category: 'Field' });
      setTermForm({ term: '', def: '', hasVisual: false, visualTag: '', videoUrl: '' });
    } catch (err) { console.error(err); setStatus('error'); }
  };

  return (
    <div className="mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex items-center space-x-2 mb-4"><Lock className="w-4 h-4 text-slate-900" /><h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">System Admin Dashboard</h3></div>
      <div className="flex bg-white p-1 rounded-lg border border-slate-200 mb-4">
        {['job', 'term'].map(m => (<button key={m} onClick={() => setMode(m)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md capitalize transition ${mode === m ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Add {m}</button>))}
      </div>
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        {mode === 'job' && ( <> <AdminInput label="Job Title" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} /> <AdminInput label="Company" value={jobForm.company} onChange={e => setJobForm({...jobForm, company: e.target.value})} /> <AdminInput label="Location" value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} /> <AdminInput label="Salary" value={jobForm.salary} onChange={e => setJobForm({...jobForm, salary: e.target.value})} /> </> )}
        {mode === 'term' && ( <> <AdminInput label="Term" value={termForm.term} onChange={e => setTermForm({...termForm, term: e.target.value})} /> <textarea className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm h-20 mb-3" placeholder="Definition..." value={termForm.def} onChange={e => setTermForm({...termForm, def: e.target.value})}></textarea> <AdminInput label="Image Path" value={termForm.visualTag} onChange={e => setTermForm({...termForm, visualTag: e.target.value, hasVisual: !!e.target.value})} placeholder="/diagrams/image.jpg" /> <AdminInput label="Video URL" value={termForm.videoUrl} onChange={e => setTermForm({...termForm, videoUrl: e.target.value})} /> </> )}
        <button onClick={handleSubmit} disabled={isOffline} className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-xs hover:bg-slate-800 transition">Save Data</button>
        {status === 'success' && <p className="text-emerald-600 text-xs font-bold mt-2 text-center">Saved!</p>}
      </div>
    </div>
  );
};

// --- Standard Views ---
const LoadingScreen = () => (<div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-slate-400"><Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" /><p className="text-xs font-bold uppercase tracking-widest">Connecting...</p></div>);
const ErrorScreen = ({ msg }) => (<div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-slate-400 px-6 text-center"><WifiOff className="w-10 h-10 text-slate-300 mb-4" /><p className="text-sm font-bold text-slate-600 mb-2">Connection Issue</p><p className="text-xs leading-relaxed max-w-[280px] mx-auto">{msg}</p></div>);

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
        {jobs.slice(0, 3).map((job, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition relative overflow-hidden">
             <div className="flex justify-between items-start gap-3">
               {/* Logo Section */}
               {job.logo && (
                 <div className="w-12 h-12 flex-shrink-0 bg-white rounded-lg border border-slate-100 p-1 flex items-center justify-center">
                    <img src={job.logo} alt={job.company} className="w-full h-full object-contain" onError={(e) => e.target.style.display='none'} />
                 </div>
               )}
               <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-slate-800 text-sm truncate pr-6">{job.title}</h3>
                 <p className="text-xs font-medium text-slate-500 flex items-center">
                   {job.company} 
                   {job.tags && job.tags.includes('External') && <span className="ml-2 text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">External</span>}
                 </p>
                 <div className="flex items-center text-xs text-slate-400 mt-1.5 mb-2">
                   <Globe className="w-3 h-3 mr-1" /> {job.location}
                   <span className="mx-2 text-slate-200">|</span>
                   <span className="text-emerald-600 font-bold">{job.salary}</span>
                 </div>
                 {/* Description Snippet */}
                 {job.description && (
                   <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 mb-3">{job.description}</p>
                 )}
                 {/* Apply Button */}
                 {job.externalLink ? (
                    <a 
                      href={job.externalLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
                    >
                      Apply Now 
                    </a>
                 ) : (
                    <button className="text-xs bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg cursor-not-allowed">Apply on Site</button>
                 )}
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- EXPANDED LIBRARY VIEW ---
const LibraryView = ({ data }) => {
  const [activeSubTab, setActiveSubTab] = useState('glossary');
  const [term, setTerm] = useState('');

  // Sub-tabs configuration
  const tabs = [
    { id: 'glossary', label: 'Glossary', icon: BookOpen, data: data.glossary },
    { id: 'standards', label: 'Standards', icon: Scale, data: data.standards },
    { id: 'manuals', label: 'Manuals', icon: FileText, data: data.manuals },
    { id: 'regulations', label: 'Regs', icon: Shield, data: data.regulations },
    { id: 'mandates', label: 'Mandates', icon: ScrollText, data: data.mandates },
  ];

  const activeData = tabs.find(t => t.id === activeSubTab)?.data || [];
  
  const filtered = useMemo(() => 
    activeData.filter(item => {
      const searchStr = (item.term || item.title || item.code || '').toLowerCase();
      return searchStr.includes(term.toLowerCase());
    }),
  [term, activeData]);

  // Media Card Logic
  const MediaCard = ({ item }) => {
    const getYoutubeId = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url?.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeId(item.videoUrl);

    return (
      <div className="mt-3 bg-slate-50 rounded-lg border border-slate-200 p-3">
        {item.hasVisual && (
          <div className="mb-3">
            <div className="flex items-center text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
              <Eye className="w-3 h-3 mr-1.5" /> Visual Reference
            </div>
            <div className="bg-white p-2 rounded border border-dashed border-slate-300 flex flex-col items-center justify-center text-center overflow-hidden min-h-[150px] relative">
              {item.visualTag ? (
                <img 
                  src={item.visualTag} 
                  alt={item.term} 
                  className="w-full h-auto max-h-48 object-contain rounded"
                  onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/300x150?text=Image+Unavailable"; }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-slate-400 text-xs italic py-4">No schematic available.</div>
              )}
            </div>
          </div>
        )}
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
      <SectionTitle title="Industry Library" subtitle="The comprehensive knowledge base." />
      
      {/* Search Bar */}
      <div className="relative mb-4">
        <input type="text" placeholder="Search library..." className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={term} onChange={(e) => setTerm(e.target.value)} />
        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 opacity-0" />
      </div>

      {/* Sub-Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {tabs.map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveSubTab(t.id)}
            className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${activeSubTab === t.id ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            <t.icon className="w-3 h-3 mr-1.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-sm text-slate-900">{item.term || item.title}</h3>
              {item.code && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">{item.code}</span>}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
              {item.def || item.description || item.summary || "No description available."}
            </p>
            {/* Visuals for Glossary */}
            {activeSubTab === 'glossary' && (item.hasVisual || item.videoUrl) && <MediaCard item={item} />}
            
            {/* Metadata for others */}
            {activeSubTab !== 'glossary' && (
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-400">
                {item.agency && <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{item.agency}</span>}
                {item.version && <span>Ver: {item.version}</span>}
                {item.deadline && <span className="text-red-400 font-bold">Deadline: {item.deadline}</span>}
                {item.url && item.url !== '#' && <a href={item.url} target="_blank" rel="noreferrer" className="text-amber-600 font-bold hover:underline">View Source &rarr;</a>}
              </div>
            )}
          </div>
        )) : (
          <div className="text-center p-8 text-slate-400 text-xs italic border-2 border-dashed border-slate-200 rounded-xl">
            No entries found in {tabs.find(t => t.id === activeSubTab).label}.
          </div>
        )}
      </div>
    </div>
  );
};

// --- Other Views (Home, Jobs, Tools) ---
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

const ToolsView = ({ signalAspects, isPro, onUnlock }) => (
  <div className="pb-20 bg-slate-50 min-h-full px-4 pt-6">
    <SectionTitle title="Engineer's Toolkit" subtitle="Field utilities." />
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-4">
      <div className="flex items-center space-x-2 mb-4"><AlertTriangle className="w-5 h-5 text-amber-500" /><h3 className="font-bold text-slate-800">Signal Decoder</h3></div>
      <p className="text-xs text-slate-500">Interactive signal mast visualization coming soon.</p>
    </div>
    
    {/* LOCKED TOOL WITH PAYWALL */}
    <div className="relative bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2"><Wrench className="w-5 h-5 text-slate-800" /><h3 className="font-bold text-slate-800">Pro Compliance Calc</h3></div>
        <Lock className="w-4 h-4 text-amber-600" />
      </div>
      <p className="text-xs text-slate-400 mb-3">Automated compliance checker.</p>
      
      {!isPro && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
          <button onClick={onUnlock} className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold text-xs shadow-lg flex items-center transition transform hover:scale-105">
            <Unlock className="w-3 h-3 mr-2" /> Unlock Pro
          </button>
        </div>
      )}
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---
const MainContent = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ jobs: [], glossary: [], standards: [], manuals: [], regulations: [], mandates: [], signals: [] });
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [mongoUser, setMongoUser] = useState(null);
  const { user, isSignedIn } = useUser();

  const fetchData = async () => {
    setLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000));
      const results = await Promise.race([
        Promise.all([
          fetch(`${API_URL}/jobs`), fetch(`${API_URL}/glossary`), fetch(`${API_URL}/signals`),
          fetch(`${API_URL}/standards`), fetch(`${API_URL}/manuals`), fetch(`${API_URL}/regulations`), fetch(`${API_URL}/mandates`)
        ]),
        timeoutPromise
      ]);
      
      // Parse all results safely
      const [jobs, glossary, signals, standards, manuals, regulations, mandates] = await Promise.all(results.map(r => r.json()));
      
      setData({ jobs, glossary, signals, standards, manuals, regulations, mandates });
    } catch (err) { console.error(err); setError("Could not load data."); setData({jobs: FALLBACK_JOBS, glossary: FALLBACK_GLOSSARY, signals: FALLBACK_GLOSSARY, standards: FALLBACK_STANDARDS, manuals: [], regulations: [], mandates: []}); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (isSignedIn && user) {
      fetch(`${API_URL}/users/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clerkId: user.id, email: user.primaryEmailAddress.emailAddress }) })
      .then(res => res.json()).then(userData => setMongoUser(userData)).catch(err => console.error("User Sync Error:", err));
    }
  }, [isSignedIn, user]);

  // Admin View Placeholder (Use your existing one locally)
  const AdminView = ({ refreshData }) => <div className="p-4 bg-white m-4 rounded shadow">Admin Panel (See local code for full view)</div>;
  
  const ADMIN_EMAIL = "wayne@railnology.com"; 
  const isSuperAdmin = isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center font-sans">
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      <div className="w-full max-w-md h-full min-h-screen bg-slate-50 shadow-2xl relative flex flex-col">
        <Header onProfileClick={() => setActiveTab('profile')} isOffline={false} isPro={isPro} />
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {activeTab === 'home' && isSuperAdmin && <AdminView refreshData={fetchData} isOffline={false} />}
          
          {/* Company View: Only show if user role is company */}
          {activeTab === 'company' && mongoUser?.role === 'company' ? (
             <CompanyView user={user} mongoUser={mongoUser} refreshData={fetchData} />
          ) : null}
          
          {/* Profile Tab */}
          {activeTab === 'profile' && isSignedIn ? (
             <ProfileView user={user} mongoUser={mongoUser} refreshProfile={() => { 
               // Refresh logic: refetch the specific user to update state
                if (isSignedIn && user) {
                  fetch(`${API_URL}/users/${user.id}`)
                  .then(res => res.json()).then(userData => setMongoUser(userData)).catch(err => console.error("User Refresh Error:", err));
                }
             }} />
          ) : (
             // Standard Tab Views
             activeTab !== 'company' && activeTab !== 'profile' && (
              loading ? <LoadingScreen /> : error ? <ErrorScreen msg={error} /> : (
                <>
                  {activeTab === 'home' && <HomeView changeTab={setActiveTab} jobs={data.jobs} />}
                  {activeTab === 'learn' && <LibraryView data={data} />}
                  {activeTab === 'tools' && <ToolsView isPro={isPro} onUnlock={() => setShowPaywall(true)} />}
                  {activeTab === 'jobs' && <JobsView jobs={data.jobs} />} 
                </>
              )
            )
          )}
        </div>
        <div className="bg-white border-t border-slate-200 px-4 pb-safe sticky bottom-0 z-50">
          <div className="flex justify-between items-center h-16">
            <TabButton active={activeTab} id="home" icon={Train} label="Home" onClick={setActiveTab} />
            <TabButton active={activeTab} id="learn" icon={BookOpen} label="Library" onClick={setActiveTab} />
            <TabButton active={activeTab} id="tools" icon={Wrench} label="Tools" onClick={setActiveTab} />
            <TabButton active={activeTab} id="jobs" icon={Briefcase} label="Jobs" onClick={setActiveTab} />
            {/* Dynamic Dashboard Button for Companies */}
            {mongoUser?.role === 'company' && (
              <TabButton active={activeTab} id="company" icon={LayoutDashboard} label="Dash" onClick={setActiveTab} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => (<ClerkProvider publishableKey={CLERK_KEY}><MainContent /></ClerkProvider>);
export default App;