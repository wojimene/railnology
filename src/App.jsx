import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { 
  Train, Globe, BookOpen, Briefcase, Wrench, Lock, Search, 
  ChevronRight, Calculator, AlertTriangle, ArrowRight, Star, 
  Zap, Menu, X, Eye, RotateCcw, Filter, Loader2, WifiOff, ServerCrash,
  PlusCircle, Save, CheckCircle, Database, LogIn, User, Image as ImageIcon, Video, CreditCard, Unlock, FileText, Scale, ScrollText, Shield, UserCircle, Building2, LayoutDashboard, Edit3, MapPin, Plus, Trash2, ExternalLink, ArrowLeft, BarChart3, Calendar, Users, AlertCircle, History, Clock
} from 'lucide-react';

// ==========================================
// 1. AUTHENTICATION SETUP (PRODUCTION)
// ==========================================

// ✅ REAL CLERK:
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

// ==========================================
// 2. CONFIGURATION (PRODUCTION)
// ==========================================

// ✅ PRODUCTION CONFIG:
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const CLERK_KEY = import.meta.env.VITE_CLERK_KEY;
const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

if (!CLERK_KEY) console.error("Missing VITE_CLERK_KEY. Check Vercel Settings.");

// --- Branding ---
const BRAND = { name: "Railnology", color: "bg-slate-900", accent: "text-amber-500" };

// --- HELPERS ---
const MARKET_RATES = {
  "conductor": "$60k - $85k (Mkt Est.)", "engineer": "$75k - $110k (Mkt Est.)", "dispatcher": "$80k - $105k (Mkt Est.)", "mechanic": "$28 - $42/hr (Mkt Est.)", "manager": "$95k - $130k (Mkt Est.)"
};

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
  if (job.salary && job.salary !== "Competitive" && job.salary !== "DOE") return formatSalary(job.salary);
  const titleLower = job.title.toLowerCase();
  for (const [key, rate] of Object.entries(MARKET_RATES)) if (titleLower.includes(key)) return rate;
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

// --- COMPONENTS ---

const TabButton = ({ active, id, icon: Icon, label, onClick }) => (
  <button onClick={() => onClick(id)} className={`flex flex-col items-center justify-center w-full py-3 transition-all duration-200 border-t-2 ${active === id ? 'border-amber-500 text-slate-900 bg-slate-50' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
    <Icon className={`w-5 h-5 mb-1 ${active === id ? 'stroke-[2.5px]' : ''}`} /><span className="text-[10px] font-bold tracking-wide uppercase">{label}</span>
  </button>
);

const Header = ({ isOffline, isPro, onProfileClick }) => (
  <div className={`${BRAND.color} text-white p-4 sticky top-0 z-50 shadow-md`}>
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <div className="bg-amber-500 p-1.5 rounded-md text-slate-900"><Train className="w-5 h-5" /></div>
        <div><h1 className="text-lg font-extrabold tracking-tight leading-none">{BRAND.name}</h1><p className="text-[9px] text-slate-400 tracking-widest font-medium flex items-center">EST. 2025 {isPro && <span className="ml-2 bg-emerald-500 text-white px-1 rounded text-[8px]">PRO</span>}</p></div>
      </div>
      <div className="flex items-center space-x-3">
        <SignedOut><SignInButton mode="modal"><button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center"><LogIn className="w-3 h-3 mr-1.5" /> Sign In</button></SignInButton></SignedOut>
        <SignedIn><button onClick={onProfileClick} className="flex items-center text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition mr-2 border border-white/10"><UserCircle className="w-4 h-4 mr-1.5" /> My Profile</button><UserButton afterSignOutUrl="/" /></SignedIn>
      </div>
    </div>
  </div>
);

const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-5 mt-2"><h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>{subtitle && <p className="text-slate-500 text-xs font-medium mt-1">{subtitle}</p>}</div>
);

const JobLogo = ({ logo, company, size="sm" }) => {
  const [error, setError] = useState(false);
  const dims = size === "lg" ? "w-16 h-16 p-2" : "w-12 h-12 p-1";
  const iconSize = size === "lg" ? "w-8 h-8" : "w-6 h-6";
  if (!logo || error) return <div className={`${dims} flex-shrink-0 bg-slate-900 rounded-lg border border-slate-800 p-1 flex items-center justify-center shadow-sm`}><Train className={`${iconSize} text-amber-500`} /></div>;
  return <div className={`${dims} flex-shrink-0 bg-white rounded-lg border border-slate-100 p-1 flex items-center justify-center shadow-sm`}><img src={logo} alt={company} className="w-full h-full object-contain rounded-md" onError={() => setError(true)} /></div>;
};

const JobCard = ({ job, onClick }) => (
  <div onClick={() => onClick(job)} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition relative overflow-hidden cursor-pointer group mb-3">
    <div className="flex justify-between items-start gap-3">
      <JobLogo logo={job.logo} company={job.company} />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 text-sm truncate pr-6 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
        <p className="text-xs font-medium text-slate-500 flex items-center mt-0.5">{job.company} {job.tags && job.tags.includes('External') && <span className="ml-2 text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100">External</span>}</p>
        <div className="flex items-center text-xs text-slate-400 mt-2 mb-2"><Globe className="w-3 h-3 mr-1" /> {job.location} <span className="mx-2 text-slate-200">|</span> <span className="text-emerald-600 font-bold">{getCompensation(job)}</span></div>
        <div className="flex gap-2 mt-2"><button className="text-[10px] bg-slate-50 text-slate-600 font-bold px-3 py-1.5 rounded hover:bg-slate-100 border border-slate-200 transition">View Details</button>{job.externalLink && (<div className="inline-flex items-center text-[10px] bg-slate-900 text-white font-bold px-3 py-1.5 rounded hover:bg-slate-800 transition">Apply <ExternalLink className="w-2.5 h-2.5 ml-1" /></div>)}</div>
      </div>
    </div>
  </div>
);

// --- RAILOPS: CREW SCHEDULER ---
const RailOpsView = () => {
  const [viewMode, setViewMode] = useState('live'); 
  const [crews, setCrews] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  // ✅ CACHE BUSTING: Added timestamp to URLs
  const loadData = async () => {
    const timestamp = Date.now();
    const fetchUrl = viewMode === 'history' 
      ? `${API_URL}/schedules?type=history&t=${timestamp}` 
      : `${API_URL}/schedules?t=${timestamp}`;
      
    try {
      const [res1, res2] = await Promise.all([
        fetch(`${API_URL}/crew?t=${timestamp}`), 
        fetch(fetchUrl)
      ]);

      if (res1.ok) setCrews(await res1.json());
      if (res2.ok) setSchedules(await res2.json());
    } catch (err) {
      console.error("RailOps Sync Error:", err);
    }
  };

  useEffect(() => { loadData(); }, [viewMode]);

  const handleAssign = async (crewId) => {
    if(!selectedScheduleId) return;
    
    try {
      // 1. Assign in Backend
      await fetch(`${API_URL}/schedules/${selectedScheduleId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crewId })
      });
      
      // 2. Force Refresh immediately
      await loadData();
      
      setSelectedScheduleId(null);
    } catch (e) {
      alert("Failed to assign crew member.");
    }
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
       
       {selectedScheduleId && (
         <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 animate-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900">Assign Crew Member</h3>
                  <button onClick={() => setSelectedScheduleId(null)}><X className="w-5 h-5 text-slate-400" /></button>
               </div>
               <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableCrew.length > 0 ? availableCrew.map(c => (
                     <button key={c._id} onClick={() => handleAssign(c._id)} className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition text-left">
                        <div className="flex items-center"><div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mr-3">{c.name.charAt(0)}</div><div><div className="font-bold text-slate-800 text-sm">{c.name}</div><div className="text-xs text-slate-500">{c.role} • {c.certification}</div></div></div><PlusCircle className="w-5 h-5 text-indigo-400" />
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
           <button key={m} onClick={() => setViewMode(m)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition ${viewMode === m ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{m === 'history' ? <History className="w-3 h-3 inline mr-1"/> : m === 'planning' ? <Calendar className="w-3 h-3 inline mr-1"/> : <Clock className="w-3 h-3 inline mr-1"/>} {m}</button>
         ))}
       </div>

       {viewMode === 'live' && (
         <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg mb-4">
            <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-lg flex items-center"><Train className="w-5 h-5 mr-2 text-amber-500" /> Dispatch Board</h3><span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">LIVE</span></div>
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
                      <div><div className="text-sm font-bold text-slate-900 flex items-center">{sched.trainId} <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">{sched.status}</span></div><div className="text-xs text-slate-500 mt-0.5">{sched.origin} &rarr; {sched.destination}</div></div>
                      <div className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">{formatDate(sched.departureTime)}</div>
                   </div>
                   <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Assigned Crew</div>
                      <div className="flex gap-2">
                         {sched.assignedCrew && sched.assignedCrew.length > 0 ? sched.assignedCrew.map(c => (
                            <div key={c._id} className="flex items-center bg-slate-50 border border-slate-200 px-2 py-1 rounded-full"><div className="w-4 h-4 bg-slate-300 rounded-full mr-1.5"></div><span className="text-[10px] font-medium text-slate-700">{c.name}</span></div>
                         )) : <div className="text-[10px] text-red-400 italic flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> No crew assigned</div>}
                         {viewMode !== 'history' && <button onClick={() => setSelectedScheduleId(sched._id)} className="text-[10px] text-indigo-600 font-bold border border-dashed border-indigo-200 px-2 py-1 rounded-full hover:bg-indigo-50 transition">+ Assign</button>}
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
                      <div><div className="text-xs font-bold text-slate-700">{crew.name}</div><div className="text-[10px] text-slate-400">{crew.role} • {crew.certification}</div></div>
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

  useEffect(() => {
    if (mongoUser?.companyName) {
       fetch(`${API_URL}/jobs`).then(res => res.json()).then(data => {
          setJobs(data.filter(j => j.company === mongoUser.companyName));
       });
    }
  }, [mongoUser]);

  const handlePostJob = async () => {
    if (!mongoUser?.companyName) return alert("Please set your Company Name in Profile first.");
    try {
      await fetch(`${API_URL}/jobs`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, company: mongoUser.companyName, tags: ['New'] })
      });
      const newJob = { ...form, company: mongoUser.companyName, tags: ['New'], postedAt: new Date() };
      setJobs([newJob, ...jobs]);
    } catch (e) { alert('Failed to post job'); }
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-full">
       <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 relative"><div className="absolute -bottom-8 left-4 flex items-end"><div className="w-16 h-16 bg-white p-1 rounded-xl shadow-lg"><div className="w-full h-full bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600"><Building2 className="w-8 h-8" /></div></div><div className="ml-3 mb-2"><h2 className="text-white font-bold text-lg leading-none">{mongoUser?.companyName}</h2><p className="text-slate-300 text-[10px] mt-0.5">Transportation • Enterprise</p></div></div></div>
       <div className="mt-10 px-4 border-b border-slate-200 flex space-x-6 text-sm font-medium text-slate-500 overflow-x-auto">{['Overview', 'RailOps', 'Jobs', 'People'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`pb-2 whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-slate-700'}`}>{tab}</button>))}</div>
       <div className="p-4">
         {activeTab === 'overview' && <div className="text-center py-10 text-slate-400 text-xs">Overview Stats</div>}
         {activeTab === 'railops' && <RailOpsView />}
         {activeTab === 'jobs' && <div className="bg-white p-5 rounded-xl shadow-sm border mb-6"><h3 className="font-bold text-sm mb-3">Post Job</h3><input placeholder="Job Title" className="w-full border p-2 rounded mb-2 text-sm" onChange={e => setForm({...form, title: e.target.value})} /><button onClick={handlePostJob} className="w-full bg-slate-900 text-white py-2 rounded font-bold text-xs">Post</button><div className="mt-4 space-y-2">{jobs.map(j => <JobCard key={j._id} job={j} onClick={() => {}} />)}</div></div>}
         {activeTab === 'people' && <div className="text-center py-10 text-slate-400 text-xs">Employee Directory</div>}
       </div>
    </div>
  );
};

// --- PROFILE VIEW ---
const ProfileView = ({ user, mongoUser, refreshProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ role: 'individual', companyName: '', jobTitle: '', headline: '', location: '' });
  const [myAssignments, setMyAssignments] = useState([]);

  useEffect(() => {
    if (mongoUser) {
      setFormData({ role: mongoUser.role || 'individual', companyName: mongoUser.companyName || '', jobTitle: mongoUser.jobTitle || '', headline: mongoUser.headline || '', location: mongoUser.location || '' });
      fetch(`${API_URL}/my-assignments?email=${mongoUser.email}`).then(r=>r.json()).then(setMyAssignments).catch(console.error);
    }
  }, [mongoUser]);

  const handleSave = async () => {
    await fetch(`${API_URL}/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    setIsEditing(false); refreshProfile();
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-full">
       <div className="bg-white border-b border-slate-200 pb-6 mb-4"><div className="h-24 bg-gradient-to-r from-sky-500 to-indigo-500 relative"></div><div className="px-4 -mt-10 relative"><div className="flex justify-between items-end"><img src={user.imageUrl} className="w-24 h-24 rounded-full border-4 border-white shadow-md" />{!isEditing && <button onClick={() => setIsEditing(true)} className="mb-2 flex items-center text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full"><Edit3 className="w-3 h-3 mr-1.5" /> Edit</button>}</div><div className="mt-3"><h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2><p className="text-sm text-slate-600">{formData.headline || "Rail Professional"}</p></div></div></div>
       <div className="px-4 space-y-4">
          {isEditing && <div className="bg-white p-4 rounded shadow mb-4"><select className="w-full border p-2 mb-2 rounded" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}><option value="individual">Individual</option><option value="company">Company</option></select><input className="w-full border rounded p-2" placeholder="Job Title / Company" value={formData.role === 'company' ? formData.companyName : formData.jobTitle} onChange={e => setFormData({...formData, [formData.role === 'company' ? 'companyName' : 'jobTitle']: e.target.value})} /><button onClick={handleSave} className="w-full bg-indigo-600 text-white py-2 rounded mt-2">Save</button></div>}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200"><h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center"><Calendar className="w-4 h-4 mr-2 text-indigo-600" /> My Schedule</h3>{myAssignments.length > 0 ? <div className="space-y-2">{myAssignments.map(s => <div key={s._id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2 last:border-0"><div><span className="font-bold text-slate-700">{s.trainId}</span> <span className="text-slate-500">{s.origin} &rarr; {s.destination}</span></div><span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">{new Date(s.departureTime).toLocaleDateString()}</span></div>)}</div> : <p className="text-xs text-slate-400 italic">No assignments.</p>}</div>
       </div>
    </div>
  );
};

const AdminView = () => <div className="p-4 bg-white m-4 rounded shadow">Admin Panel</div>;
const LoadingScreen = () => <div className="p-10 text-center text-slate-400">Loading...</div>;
const ErrorScreen = ({ msg }) => <div className="p-10 text-center text-red-400">{msg}</div>;

const HomeView = ({ changeTab, jobs, onJobClick }) => (
  <div className="pb-20"><div className="bg-slate-900 text-white pt-6 pb-12 px-6 rounded-b-[2rem] shadow-xl"><h2 className="text-2xl font-bold mb-2">Railnology 2.0</h2></div><div className="mt-8 px-4"><SectionTitle title="Recent Listings" /><div className="space-y-3">{jobs.slice(0, 3).map((job, idx) => <JobCard key={idx} job={job} onClick={onJobClick} />)}</div></div></div>
);
const JobsView = ({ jobs, onJobClick }) => (<div className="pb-20 px-4 pt-6 bg-slate-50 min-h-full"><SectionTitle title="Career Opportunities" /><div className="space-y-3">{jobs.map(job => <JobCard key={job._id || Math.random()} job={job} onClick={onJobClick} />)}</div></div>);
const JobDetailView = ({ job, onBack }) => (<div className="pb-20 p-6"><button onClick={onBack}>Back</button><h2 className="text-xl font-bold mt-4">{job.title}</h2><p>{job.description}</p></div>);
const LibraryView = ({ data }) => <div className="pb-20 px-4 pt-6"><SectionTitle title="Library" /></div>; // Simplified
const ToolsView = ({ isPro, onUnlock }) => (<div className="pb-20 bg-slate-50 min-h-full px-4 pt-6"><SectionTitle title="Tools" /><div className="relative bg-white p-5 rounded-xl border"><div className="flex justify-between mb-4"><h3 className="font-bold">Curve Resistance</h3>{!isPro && <Lock className="w-4 h-4 text-amber-600"/>}</div><CurveResistanceCalculator isPro={isPro}/>{!isPro && <div className="absolute inset-0 bg-white/80 backdrop-blur flex items-center justify-center"><button onClick={onUnlock} className="bg-amber-500 px-4 py-2 rounded font-bold text-xs shadow">Unlock</button></div>}</div></div>);
const CurveResistanceCalculator = ({ isPro }) => { const [w,sw]=useState(5000); const [d,sd]=useState(2); return <div className="space-y-4"><div>Weight: <input type="range" min="1000" max="20000" value={w} onChange={e=>sw(Number(e.target.value))} disabled={!isPro}/> {w}</div><div>Degree: <input type="range" min="0" max="15" value={d} onChange={e=>sd(Number(e.target.value))} disabled={!isPro}/> {d}</div><div>Resistance: {(0.8*w*d).toFixed(0)} lbs</div></div>; };

const MainContent = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ jobs: [], glossary: [] });
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [mongoUser, setMongoUser] = useState(null);
  const { user, isSignedIn } = useUser();

  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await Promise.all([fetch(`${API_URL}/jobs`), fetch(`${API_URL}/glossary`)]);
      const [jobs, glossary] = await Promise.all(results.map(r => r.json()));
      setData({ jobs, glossary });
    } catch (err) { console.error(err); setError("Could not load data."); setData({jobs: FALLBACK_JOBS, glossary: FALLBACK_GLOSSARY}); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (isSignedIn && user) {
      fetch(`${API_URL}/users/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clerkId: user.id, email: user.primaryEmailAddress.emailAddress }) })
      .then(res => res.json()).then(userData => setMongoUser(userData)).catch(console.error);
    }
  }, [isSignedIn, user]);

  const ADMIN = "wayne@railnology.com"; 
  if (selectedJob) return <JobDetailView job={selectedJob} onBack={() => setSelectedJob(null)} />;

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center font-sans">
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      <div className="w-full max-w-md h-full min-h-screen bg-slate-50 shadow-2xl relative flex flex-col">
        <Header onProfileClick={() => setActiveTab('profile')} isOffline={false} isPro={isPro} />
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {activeTab === 'home' && isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN && <AdminView refreshData={fetchData} />}
          {activeTab === 'home' && <HomeView changeTab={setActiveTab} jobs={data.jobs} onJobClick={setSelectedJob} />}
          {activeTab === 'company' && mongoUser?.role === 'company' ? <CompanyView user={user} mongoUser={mongoUser} refreshData={fetchData} /> : null}
          {activeTab === 'profile' && isSignedIn ? <ProfileView user={user} mongoUser={mongoUser} refreshProfile={() => {}} /> : null}
          {activeTab === 'jobs' && <JobsView jobs={data.jobs} onJobClick={setSelectedJob} />}
          {activeTab === 'tools' && <ToolsView isPro={isPro} onUnlock={() => setShowPaywall(true)} />}
          {activeTab === 'learn' && <LibraryView data={data} />}
        </div>
        <div className="bg-white border-t border-slate-200 px-4 pb-safe sticky bottom-0 z-50">
          <div className="flex justify-between items-center h-16">
            <TabButton active={activeTab} id="home" icon={Train} label="Home" onClick={setActiveTab} />
            <TabButton active={activeTab} id="learn" icon={BookOpen} label="Library" onClick={setActiveTab} />
            <TabButton active={activeTab} id="tools" icon={Wrench} label="Tools" onClick={setActiveTab} />
            <TabButton active={activeTab} id="jobs" icon={Briefcase} label="Jobs" onClick={setActiveTab} />
            {mongoUser?.role === 'company' && <TabButton active={activeTab} id="company" icon={LayoutDashboard} label="Dash" onClick={setActiveTab} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => (<ClerkProvider publishableKey={CLERK_KEY}><MainContent /></ClerkProvider>);
export default App;