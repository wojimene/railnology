import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { 
  Train, Globe, BookOpen, Briefcase, Wrench, Lock, Search, 
  ChevronRight, Calculator, AlertTriangle, ArrowRight, Star, 
  Zap, Menu, X, Eye, RotateCcw, Filter, Loader2, WifiOff, ServerCrash,
  PlusCircle, Save, CheckCircle, Database, LogIn, User, Image as ImageIcon, Video, CreditCard, Unlock, FileText, Scale, ScrollText, Shield, UserCircle, Building2, LayoutDashboard, Edit3, MapPin, Plus, Trash2, ExternalLink, ArrowLeft, BarChart3
} from 'lucide-react';

// ==========================================
// 1. AUTHENTICATION SETUP
// ==========================================

// ✅ REAL CLERK (PRODUCTION):
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

// ==========================================
// 2. CONFIGURATION & SECRETS
// ==========================================

// ✅ PRODUCTION CONFIG:
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const CLERK_KEY = import.meta.env.VITE_CLERK_KEY;
const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

// Safety Check
if (!CLERK_KEY) console.error("Missing VITE_CLERK_KEY. Check Vercel Settings.");

// --- Branding Constants ---
const BRAND = {
  name: "Railnology",
  domain: "railnology.com",
  color: "bg-slate-900", 
  accent: "text-amber-500" 
};

// --- MARKET RATE DATA (Simulated Public Research) ---
const MARKET_RATES = {
  "conductor": "$60k - $85k (Mkt Est.)",
  "engineer": "$75k - $110k (Mkt Est.)",
  "dispatcher": "$80k - $105k (Mkt Est.)",
  "mechanic": "$28 - $42/hr (Mkt Est.)",
  "manager": "$95k - $130k (Mkt Est.)"
};

// --- HELPER: Salary Formatter ---
const formatSalary = (val) => {
  if (!val) return "DOE";
  if (val === "Competitive" || val === "DOE") return val;
  const num = parseFloat(val.replace(/[^0-9.]/g, ''));
  if (!isNaN(num)) {
    if (num > 1000) return `$${(num / 1000).toFixed(0)}k`;
    if (num < 1000 && num > 10) return `$${num}/hr`;
  }
  return val;
};

const getCompensation = (job) => {
  if (job.salary && job.salary !== "Competitive" && job.salary !== "DOE") {
    return formatSalary(job.salary);
  }
  const titleLower = job.title.toLowerCase();
  for (const [key, rate] of Object.entries(MARKET_RATES)) {
    if (titleLower.includes(key)) return rate;
  }
  return "DOE";
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

// --- HELPER: Job Logo Component ---
const JobLogo = ({ logo, company, size="sm" }) => {
  const [error, setError] = useState(false);
  const dims = size === "lg" ? "w-16 h-16 p-2" : "w-12 h-12 p-1";
  const iconSize = size === "lg" ? "w-8 h-8" : "w-6 h-6";

  if (!logo || error) {
    return (
      <div className={`${dims} flex-shrink-0 bg-slate-900 rounded-lg border border-slate-800 p-1 flex items-center justify-center shadow-sm`}>
        <Train className={`${iconSize} text-amber-500`} />
      </div>
    );
  }

  return (
    <div className={`${dims} flex-shrink-0 bg-white rounded-lg border border-slate-100 p-1 flex items-center justify-center shadow-sm`}>
      <img 
        src={logo} 
        alt={company} 
        className="w-full h-full object-contain rounded-md" 
        onError={() => setError(true)} 
      />
    </div>
  );
};

// --- REUSABLE JOB CARD (Defined BEFORE it is used) ---
const JobCard = ({ job, onClick }) => (
  <div onClick={() => onClick(job)} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition relative overflow-hidden cursor-pointer group mb-3">
    <div className="flex justify-between items-start gap-3">
      <JobLogo logo={job.logo} company={job.company} />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 text-sm truncate pr-6 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
        <p className="text-xs font-medium text-slate-500 flex items-center mt-0.5">
          {job.company} 
          {job.tags && job.tags.includes('External') && <span className="ml-2 text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100">External</span>}
        </p>
        <div className="flex items-center text-xs text-slate-400 mt-2 mb-2">
          <Globe className="w-3 h-3 mr-1" /> {job.location}
          <span className="mx-2 text-slate-200">|</span>
          <span className="text-emerald-600 font-bold">{getCompensation(job)}</span>
        </div>
        <div className="flex gap-2 mt-2">
            <button className="text-[10px] bg-slate-50 text-slate-600 font-bold px-3 py-1.5 rounded hover:bg-slate-100 border border-slate-200 transition">View Details</button>
            {job.externalLink && (
              <div className="inline-flex items-center text-[10px] bg-slate-900 text-white font-bold px-3 py-1.5 rounded hover:bg-slate-800 transition">
                Apply <ExternalLink className="w-2.5 h-2.5 ml-1" />
              </div>
            )}
        </div>
      </div>
    </div>
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

// --- CALCULATOR COMPONENT (TrackAid) ---
const CurveResistanceCalculator = ({ isPro }) => {
  const [weight, setWeight] = useState(5000); // Tons
  const [degree, setDegree] = useState(2); // Degrees
  const [resistance, setResistance] = useState(0);

  useEffect(() => {
    // Standard Formula: 0.8 lbs/ton per degree of curvature
    const r = 0.8 * weight * degree;
    setResistance(r);
  }, [weight, degree]);

  return (
    <div className="space-y-5">
        <div className="flex gap-4">
          <div className="w-full">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Train Weight (Tons)</label>
            <input 
              type="range" min="1000" max="20000" step="100" 
              value={weight} 
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full accent-indigo-600"
              disabled={!isPro}
            />
            <div className="text-right text-xs font-bold text-slate-700">{weight.toLocaleString()} tons</div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Curve Degree</label>
          <input 
            type="range" min="0" max="15" step="0.5" 
            value={degree} 
            onChange={(e) => setDegree(Number(e.target.value))}
            className="w-full accent-indigo-600"
            disabled={!isPro}
          />
          <div className="text-right text-xs font-bold text-slate-700">{degree}°</div>
        </div>

        {/* Visualization */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 relative overflow-hidden">
           <div className="flex justify-between items-end mb-1">
             <span className="text-xs font-bold text-slate-500 uppercase">Resistance Force</span>
             <span className="text-xl font-extrabold text-indigo-600">{resistance.toLocaleString()} <span className="text-sm text-slate-400">lbs</span></span>
           </div>
           <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300 ease-out" 
                style={{ width: `${Math.min((resistance / 240000) * 100, 100)}%` }} 
              ></div>
           </div>
        </div>
    </div>
  );
};

// --- COMPANY DASHBOARD (B2B Feature) ---
const CompanyView = ({ user, mongoUser, refreshData }) => {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: '', location: '', salary: '', category: 'Field' });
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
        refreshData(); 
        const newJob = await res.json();
        setJobs([newJob, ...jobs]);
      } else {
        setStatus('error');
      }
    } catch (e) { setStatus('error'); }
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-full">
       {/* Company Cover */}
       <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 relative">
          <div className="absolute -bottom-8 left-4 flex items-end">
             <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-lg">
                <div className="w-full h-full bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                   <Building2 className="w-8 h-8" />
                </div>
             </div>
             <div className="ml-3 mb-2">
                <h2 className="text-white font-bold text-lg leading-none">{mongoUser?.companyName || 'Company Name'}</h2>
                <p className="text-slate-300 text-[10px] mt-0.5">Transportation • Enterprise</p>
             </div>
          </div>
       </div>
       
       {/* Tab Nav */}
       <div className="mt-10 px-4 border-b border-slate-200 flex space-x-6 text-sm font-medium text-slate-500">
          {['Overview', 'Jobs', 'People'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-2 ${activeTab === tab.toLowerCase() ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-slate-700'}`}
            >
              {tab}
            </button>
          ))}
       </div>

       <div className="p-4">
         {activeTab === 'overview' && (
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                     <div className="text-2xl font-bold text-indigo-600">{jobs.length}</div>
                     <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">Active Listings</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                     <div className="text-2xl font-bold text-emerald-600">0</div>
                     <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">Applicants</div>
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
            </div>
         )}

         {activeTab === 'jobs' && (
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
         )}

         {activeTab === 'people' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
               <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-xs">Employee Directory</h3>
                  <button className="text-[10px] text-indigo-600 font-bold hover:underline">Invite +</button>
               </div>
               {[1,2].map(i => (
                 <div key={i} className="p-3 border-b border-slate-100 last:border-0 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-200 mr-3 flex items-center justify-center text-slate-400 text-[10px] font-bold">E{i}</div>
                    <div>
                       <div className="text-xs font-bold text-slate-700">Employee {i}</div>
                       <div className="text-[10px] text-slate-400">Staff</div>
                    </div>
                 </div>
               ))}
            </div>
         )}
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

// --- HOME VIEW ---
const HomeView = ({ changeTab, jobs, onJobClick }) => (
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
        {/* Use reusable JobCard here */}
        {jobs.slice(0, 3).map((job, idx) => (
          <JobCard key={idx} job={job} onClick={onJobClick} />
        ))}
      </div>
    </div>
  </div>
);

// --- JOBS VIEW (List & Detail) ---
const JobsView = ({ jobs, onJobClick }) => {
  return (
    <div className="pb-20 px-4 pt-6 bg-slate-50 min-h-full">
      <SectionTitle title="Career Opportunities" subtitle="Find your next role." />
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job._id || Math.random()} job={job} onClick={onJobClick} />
        ))}
      </div>
    </div>
  );
};

// --- JOB DETAIL VIEW (New!) ---
const JobDetailView = ({ job, onBack }) => {
  const compensation = getCompensation(job);
  
  return (
    <div className="pb-20 bg-slate-50 min-h-full animate-in slide-in-from-right duration-200">
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-40 flex items-center shadow-sm">
        <button onClick={onBack} className="mr-3 text-slate-500 hover:text-slate-900"><ArrowLeft className="w-5 h-5" /></button>
        <span className="font-bold text-slate-800 text-sm">Job Details</span>
      </div>
      <div className="p-6">
        <div className="flex flex-col items-center text-center mb-6">
          <JobLogo logo={job.logo} company={job.company} size="lg" />
          <h2 className="text-xl font-extrabold text-slate-900 mt-3 mb-1">{job.title}</h2>
          <p className="text-sm font-medium text-slate-500">{job.company}</p>
          <div className="flex items-center justify-center mt-3 space-x-2 text-xs">
             <span className="flex items-center text-slate-600 bg-slate-100 px-2 py-1 rounded"><Globe className="w-3 h-3 mr-1" /> {job.location}</span>
             <span className="flex items-center text-emerald-7