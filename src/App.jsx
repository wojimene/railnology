import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { 
  Train, Globe, BookOpen, Briefcase, Wrench, Lock, Search, 
  ChevronRight, Calculator, AlertTriangle, ArrowRight, Star, 
  Zap, Menu, X, Eye, RotateCcw, Filter, Loader2, WifiOff, ServerCrash,
  PlusCircle, Save, CheckCircle, Database, LogIn, User, Image as ImageIcon, Video, CreditCard, Unlock, FileText, Scale, ScrollText, Shield, UserCircle, Building2, LayoutDashboard, Edit3, MapPin, Plus, Trash2, ExternalLink, ArrowLeft, BarChart3, Calendar, Users, AlertCircle, History, Clock
} from 'lucide-react';

// ==========================================
// 1. AUTHENTICATION SETUP
// ==========================================

// 🅰️ REAL CLERK (UNCOMMENT THIS FOR PRODUCTION / LOCAL):
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

// --- MARKET RATE DATA ---
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

const formatDate = (dateString) => {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Pending"; 
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- FALLBACK DATA ---
const FALLBACK_JOBS = [];
const FALLBACK_GLOSSARY = [];
const FALLBACK_STANDARDS = [];
const FALLBACK_MANUALS = [];
const FALLBACK_REGULATIONS = [];
const FALLBACK_MANDATES = [];
const FALLBACK_SIGNALS = [];


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

// --- REUSABLE JOB CARD ---
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

// --- RAILOPS: CREW SCHEDULER (Startup 3.0) ---
const RailOpsView = () => {
  const [viewMode, setViewMode] = useState('live'); // live, planning, history
  const [crews, setCrews] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Assignment Modal State
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  useEffect(() => {
    const fetchUrl = viewMode === 'history' ? `${API_URL}/schedules?type=history` : `${API_URL}/schedules`;
    Promise.all([fetch(`${API_URL}/crew`), fetch(fetchUrl)])
      .then(async ([res1, res2]) => {
         // Handle potential errors if backend isn't ready
         const c = res1.ok ? await res1.json() : [];
         const s = res2.ok ? await res2.json() : [];
         setCrews(c);
         setSchedules(s);
         setLoading(false);
      })
      .catch(err => console.error("RailOps Fetch Error:", err));
  }, [viewMode]);

  const handleAssign = async (crewId) => {
    if(!selectedScheduleId) return;
    
    // 1. Send Assignment to Backend
    await fetch(`${API_URL}/schedules/${selectedScheduleId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crewId })
    });
    
    // 2. Refresh Schedules (Update Train Card)
    const schedRes = await fetch(`${API_URL}/schedules`);
    const newSchedules = await schedRes.json();
    setSchedules(newSchedules);

    // 3. Refresh Crews (Update Crew Status & Availability Pool)
    const crewRes = await fetch(`${API_URL}/crew`);
    const newCrews = await crewRes.json();
    setCrews(newCrews);

    setSelectedScheduleId(null); // Close modal
  };

  const getStatusColor = (status) => {
    if (status === 'Available') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'Resting') return 'bg-slate-100 text-slate-500 border-slate-200';
    if (status === 'On Duty') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-gray-100 text-gray-500';
  };

  const availableCrew = crews.filter(c => c.status === 'Available');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
       
       {/* ASSIGNMENT MODAL (Popup) */}
       {selectedScheduleId && (
         <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 animate-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900">Assign Crew Member</h3>
                  <button onClick={() => setSelectedScheduleId(null)}><X className="w-5 h-5 text-slate-400" /></button>
               </div>
               <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableCrew.length > 0 ? availableCrew.map(c => (
                     <button 
                       key={c._id} 
                       onClick={() => handleAssign(c._id)}
                       className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition text-left"
                     >
                        <div className="flex items-center">
                           <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mr-3">{c.name.charAt(0)}</div>
                           <div>
                              <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                              <div className="text-xs text-slate-500">{c.role} • {c.certification}</div>
                           </div>
                        </div>
                        <PlusCircle className="w-5 h-5 text-indigo-400" />
                     </button>
                  )) : (
                     <div className="text-center py-6 text-slate-400 text-sm italic">No crew available.</div>
                  )}
               </div>
            </div>
         </div>
       )}

       <div className="flex space-x-2 bg-white p-1 rounded-xl border border-slate-200 mb-4">
         {['live', 'planning', 'history'].map(m => (
           <button key={m} onClick={() => setViewMode(m)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition ${viewMode === m ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
             {m === 'history' ? <History className="w-3 h-3 inline mr-1"/> : m === 'planning' ? <Calendar className="w-3 h-3 inline mr-1"/> : <Clock className="w-3 h-3 inline mr-1"/>} {m}
           </button>
         ))}
       </div>

       {viewMode === 'live' && (
         <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg mb-4">
            <div className="flex items-center justify-between mb-2">
             <h3 className="font-bold text-lg flex items-center"><Train className="w-5 h-5 mr-2 text-amber-500" /> Dispatch Board</h3>
             <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">LIVE</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
             <div className="bg-slate-800 p-2 rounded-lg"><div className="text-xl font-bold">{schedules.length}</div><div className="text-[10px] text-slate-400">Active Trains</div></div>
             <div className="bg-slate-800 p-2 rounded-lg"><div className="text-xl font-bold text-emerald-400">{crews.filter(c => c.status === 'Available').length}</div><div className="text-[10px] text-slate-400">Crew Ready</div></div>
             <div className="bg-slate-800 p-2 rounded-lg"><div className="text-xl font-bold text-red-400">0</div><div className="text-[10px] text-slate-400">Alerts</div></div>
          </div>
         </div>
       )}

       <div>
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center"><Calendar className="w-4 h-4 mr-2 text-indigo-500" /> Schedule</h4>
          <div className="space-y-3">
             {schedules.map(sched => (
                <div key={sched._id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                   <div className="flex justify-between items-start mb-2">
                      <div>
                         <div className="text-sm font-bold text-slate-900 flex items-center">{sched.trainId} <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">{sched.status}</span></div>
                         <div className="text-xs text-slate-500 mt-0.5">{sched.origin} &rarr; {sched.destination}</div>
                      </div>
                      <div className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">{formatDate(sched.departureTime)}</div>
                   </div>
                   <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Assigned Crew</div>
                      <div className="flex gap-2">
                         {sched.assignedCrew && sched.assignedCrew.length > 0 ? sched.assignedCrew.map(c => (
                            <div key={c._id} className="flex items-center bg-slate-50 border border-slate-200 px-2 py-1 rounded-full">
                               <div className="w-4 h-4 bg-slate-300 rounded-full mr-1.5"></div>
                               <span className="text-[10px] font-medium text-slate-700">{c.name}</span>
                            </div>
                         )) : (
                            <div className="text-[10px] text-red-400 italic flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> No crew assigned</div>
                         )}
                         {viewMode !== 'history' && (
                           // ✅ Opens Modal on Click
                           <button onClick={() => setSelectedScheduleId(sched._id)} className="text-[10px] text-indigo-600 font-bold border border-dashed border-indigo-200 px-2 py-1 rounded-full hover:bg-indigo-50 transition">+ Assign</button>
                         )}
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>

       <div>
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center"><Users className="w-4 h-4 mr-2 text-emerald-500" /> Crew Status</h4>
          <div className="space-y-2">
             {crews.map(crew => (
                <div key={crew._id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                   <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-100 mr-3 flex items-center justify-center text-slate-400 text-xs font-bold">{crew.name.charAt(0)}</div>
                      <div>
                         <div className="text-xs font-bold text-slate-700">{crew.name}</div>
                         <div className="text-[10px] text-slate-400">{crew.role} • {crew.certification}</div>
                      </div>
                   </div>
                   <div className={`text-[10px] font-bold px-2 py-1 rounded border ${getStatusColor(crew.status)}`}>{crew.status}</div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

// --- COMPANY DASHBOARD (B2B Feature) ---
const CompanyView = ({ user, mongoUser, refreshData }) => {
  const [activeTab, setActiveTab] = useState('overview');
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
       <div className="mt-10 px-4 border-b border-slate-200 flex space-x-6 text-sm font-medium text-slate-500 overflow-x-auto">
          {['Overview', 'RailOps', 'Jobs', 'People'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab.toLowerCase())} 
              className={`pb-2 whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-slate-700'}`}
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
         
         {/* ✅ RAILOPS MODULE INTEGRATED HERE */}
         {activeTab === 'railops' && <RailOpsView />}
         
         {activeTab === 'jobs' && <div className="space-y-2">{jobs.map(job => <JobCard key={job._id} job={job} onClick={() => {}} />)}</div>}
         {activeTab === 'people' && <div className="text-center py-10 text-slate-400 text-xs">Employee Directory</div>}
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
             <span className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-bold border border-emerald-100">{compensation}</span>
          </div>
          {job.jobType && <span className="mt-2 text-[10px] text-slate-400 uppercase tracking-wider font-bold">{job.jobType}</span>}
        </div>

        {job.externalLink ? (
           <a href={job.externalLink} target="_blank" rel="noreferrer" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 flex items-center justify-center mb-6 transition">Apply Now <ExternalLink className="w-3 h-3 ml-2" /></a>
        ) : <button disabled className="w-full bg-slate-100 text-slate-400 py-3 rounded-xl font-bold text-sm mb-6 cursor-not-allowed">Application Unavailable</button>}

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
           <div>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">About The Job</h3>
             <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {/* Display FULL description if available */}
                {job.description || "No description available."}
             </p>
           </div>
           {job.tags && job.tags.length > 0 && (
             <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</h3>
               <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, i) => <span key={i} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded border border-slate-200">{tag}</span>)}
               </div>
             </div>
           )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between safe-area-pb z-50">
         <div className="text-xs font-medium text-slate-500">Ready to apply?</div>
         {job.externalLink && (
            <a href={job.externalLink} target="_blank" rel="noreferrer" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-xs shadow transition">Start Application</a>
         )}
      </div>
    </div>
  );
};

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

  // ✅ ERROR FIX: Define fallbacks to prevent crash if data is missing
  const activeData = (tabs.find(t => t.id === activeSubTab)?.data || []) || [];
  
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
              {/* ✅ Relaxed Check: Allows local paths AND urls */}
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

const ToolsView = ({ signalAspects, isPro, onUnlock }) => (
  <div className="pb-20 bg-slate-50 min-h-full px-4 pt-6">
    <SectionTitle title="Engineer's Toolkit" subtitle="Field utilities." />
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-4">
      <div className="flex items-center space-x-2 mb-4"><AlertTriangle className="w-5 h-5 text-amber-500" /><h3 className="font-bold text-slate-800">Signal Decoder</h3></div>
      <p className="text-xs text-slate-500">Interactive signal mast visualization coming soon.</p>
    </div>
    
    {/* LOCKED TOOL WITH PAYWALL */}
    <div className="relative bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
           <Calculator className="w-5 h-5 text-indigo-600" />
           <h3 className="font-bold text-slate-800">Curve Resistance</h3>
        </div>
        {!isPro && <Lock className="w-4 h-4 text-amber-600" />}
      </div>
      
      <CurveResistanceCalculator isPro={isPro} />
      
      {!isPro && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
          <button onClick={onUnlock} className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold text-xs shadow-lg flex items-center transition transform hover:scale-105">
            <Unlock className="w-3 h-3 mr-2" /> Unlock Calculator
          </button>
        </div>
      )}
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---
const MainContent = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedJob, setSelectedJob] = useState(null); // Tracks full page job detail
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
    // Check for Stripe success
    const query = new URLSearchParams(window.location.search);
    if (query.get('payment') === 'success') {
       setIsPro(true);
       localStorage.setItem('railnology_pro', 'true');
    }
    if (localStorage.getItem('railnology_pro') === 'true') {
       setIsPro(true);
    }

    if (isSignedIn && user) {
      fetch(`${API_URL}/users/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clerkId: user.id, email: user.primaryEmailAddress.emailAddress }) })
      .then(res => res.json()).then(userData => setMongoUser(userData)).catch(err => console.error("User Sync Error:", err));
    }
  }, [isSignedIn, user]);

  // Admin View Placeholder (Use your existing one locally)
  const AdminView = ({ refreshData }) => <div className="p-4 bg-white m-4 rounded shadow">Admin Panel (See local code for full view)</div>;
  
  const ADMIN_EMAIL = "wayne@railnology.com"; 
  const isSuperAdmin = isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  // Render Detail View if a job is selected
  if (selectedJob) {
    return <JobDetailView job={selectedJob} onBack={() => setSelectedJob(null)} />;
  }

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
                  {activeTab === 'home' && <HomeView changeTab={setActiveTab} jobs={data.jobs} onJobClick={setSelectedJob} />}
                  {activeTab === 'learn' && <LibraryView data={data} />}
                  {activeTab === 'tools' && <ToolsView isPro={isPro} onUnlock={() => setShowPaywall(true)} />}
                  {activeTab === 'jobs' && <JobsView jobs={data.jobs} onJobClick={setSelectedJob} />} 
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