import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { 
  Train, Globe, BookOpen, Briefcase, Wrench, Lock, Search, 
  ChevronRight, Calculator, AlertTriangle, ArrowRight, Star, 
  Zap, Menu, X, Eye, RotateCcw, Filter, Loader2, WifiOff, ServerCrash,
  PlusCircle, Save, CheckCircle, Database, LogIn, User, Image as ImageIcon, Video, CreditCard, Unlock, FileText, Scale, ScrollText, Shield, UserCircle, Building2, LayoutDashboard, Edit3, MapPin, Plus, Trash2, ExternalLink, ArrowLeft, BarChart3, Calendar, Users, AlertCircle, History, Clock, Bot, Send
} from 'lucide-react';

// ==========================================
// 1. AUTHENTICATION SETUP
// ==========================================

// 🅰️ REAL CLERK (UNCOMMENT THIS FOR PRODUCTION / LOCAL):
// import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

// 🅱️ MOCK CLERK (ACTIVE FOR PREVIEW - DELETE THIS LOCALLY):
const MockAuthContext = createContext(null);
const ClerkProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  return <MockAuthContext.Provider value={{ user, setUser }}>{children}</MockAuthContext.Provider>;
};
const useUser = () => {
  const { user } = useContext(MockAuthContext);
  return { user, isLoaded: true, isSignedIn: !!user };
};
const SignedIn = ({ children }) => { const { user } = useUser(); return user ? children : null; };
const SignedOut = ({ children }) => { const { user } = useUser(); return !user ? children : null; };
const SignInButton = ({ children }) => {
  const { setUser } = useContext(MockAuthContext);
  // Simulates logging in as the Admin for the preview
  return React.cloneElement(children, { onClick: () => setUser({ primaryEmailAddress: { emailAddress: "wayne@railnology.com" }, fullName: "Wayne Admin", imageUrl: "https://i.pravatar.cc/150?img=11" }) });
};
const UserButton = () => {
  const { setUser } = useContext(MockAuthContext);
  return <button onClick={() => setUser(null)} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-white hover:bg-slate-700 transition"><User className="w-3 h-3"/> Sign Out</button>;
};
// ==========================================


// ==========================================
// 2. CONFIGURATION & SECRETS
// ==========================================

// 🅰️ PRODUCTION (UNCOMMENT THIS BLOCK FOR PRODUCTION):
/*
const API_URL = import.meta.env.VITE_API_URL;
const CLERK_KEY = import.meta.env.VITE_CLERK_KEY;
const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
*/

// 🅱️ PREVIEW / LOCAL FALLBACK (ACTIVE FOR NOW):
const API_URL = "http://localhost:5000/api";
const CLERK_KEY = "pk_test_PASTE_YOUR_KEY_HERE"; 
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_YOUR_LINK"; 
const ADMIN_EMAIL = "wayne@railnology.com";


// --- Branding Constants ---
const BRAND = {
  name: "Railnology",
  domain: "railnology.com",
  color: "bg-slate-900", 
  accent: "text-amber-500" 
};

// --- MARKET RATE DATA ---
const MARKET_RATES = {
  "conductor": "$60k - $85k", "engineer": "$75k - $110k", "dispatcher": "$80k - $105k", "mechanic": "$28 - $42/hr", "manager": "$95k - $130k"
};

// --- HELPER: Salary Formatter ---
const formatSalary = (val) => {
  if (!val || val === "Competitive" || val === "DOE") return val || "DOE";
  const num = parseFloat(val.replace(/[^0-9.]/g, ''));
  return !isNaN(num) ? (num > 1000 ? `$${(num / 1000).toFixed(0)}k` : `$${num}/hr`) : val;
};

const getCompensation = (job) => {
  if (job.salary && job.salary !== "Competitive" && job.salary !== "DOE") return formatSalary(job.salary);
  const t = job.title.toLowerCase();
  for (const [k, r] of Object.entries(MARKET_RATES)) if (t.includes(k)) return r;
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
    className={`flex flex-col items-center justify-center w-full py-3 transition-all border-t-2 ${
      active === id ? 'border-amber-500 text-slate-900 bg-slate-50' : 'border-transparent text-gray-400'
    }`}
  >
    <Icon className={`w-5 h-5 mb-1 ${active === id ? 'stroke-[2.5px]' : ''}`} />
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);

const Header = ({ isOffline, isPro, onProfileClick }) => (
  <div className={`${BRAND.color} text-white p-4 sticky top-0 z-50 shadow-md`}>
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <div className="bg-amber-500 p-1.5 rounded-md text-slate-900">
          <Train className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold">{BRAND.name}</h1>
          <p className="text-[9px] text-slate-400 tracking-widest font-medium">
            EST. 2025 {isPro && <span className="ml-2 bg-emerald-500 text-white px-1 rounded text-[8px]">PRO</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <LogIn className="w-3 h-3 mr-1.5 inline" /> Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
           <button 
             onClick={onProfileClick} 
             className="flex items-center text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg transition mr-2 border border-white/10"
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
    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    {subtitle && <p className="text-slate-500 text-xs font-medium mt-1">{subtitle}</p>}
  </div>
);

const JobLogo = ({ logo, company, size="sm" }) => {
  const [err, setErr] = useState(false);
  const dims = size === "lg" ? "w-16 h-16 p-2" : "w-12 h-12 p-1";
  
  if (!logo || err) {
    return (
      <div className={`${dims} flex-shrink-0 bg-slate-900 rounded-lg flex items-center justify-center`}>
        <Train className="w-6 h-6 text-amber-500" />
      </div>
    );
  }

  return (
    <div className={`${dims} flex-shrink-0 bg-white rounded-lg border border-slate-100 flex items-center justify-center`}>
      <img 
        src={logo} 
        alt={company} 
        className="w-full h-full object-contain rounded" 
        onError={() => setErr(true)} 
      />
    </div>
  );
};

const JobCard = ({ job, onClick }) => (
  <div onClick={() => onClick(job)} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer mb-3">
    <div className="flex justify-between items-start gap-3">
      <JobLogo logo={job.logo} company={job.company} />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 text-sm truncate">{job.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {job.company} 
          {job.tags && job.tags.includes('External') && <span className="ml-2 bg-slate-100 px-1.5 rounded">Ext</span>}
        </p>
        <div className="flex items-center text-xs text-slate-400 mt-2 mb-2">
          <Globe className="w-3 h-3 mr-1" /> {job.location}
          <span className="mx-2">|</span>
          <span className="text-emerald-600 font-bold">{getCompensation(job)}</span>
        </div>
        <div className="flex gap-2 mt-2">
            <button className="text-[10px] bg-slate-50 text-slate-600 font-bold px-3 py-1.5 rounded border border-slate-200">View</button>
            {job.externalLink && (
              <div className="text-[10px] bg-slate-900 text-white font-bold px-3 py-1.5 rounded">
                Apply
              </div>
            )}
        </div>
      </div>
    </div>
  </div>
);

// --- AI CHAT COMPONENT ---
const AIChat = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([{ role: 'system', text: "Hello! I am your Compliance Copilot. Ask me about regulations, manuals, or standards." }]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to the knowledge base right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
       <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center"><Bot className="w-4 h-4 mr-2 text-indigo-600" /><span className="text-xs font-bold text-slate-700">Compliance AI</span></div>
       <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'}`}>
                  {m.text}
               </div>
            </div>
          ))}
          {loading && <div className="text-xs text-slate-400 animate-pulse ml-2">Thinking...</div>}
       </div>
       <div className="p-3 border-t border-slate-200 flex gap-2">
          <input 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Ask about 49 CFR..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={loading} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"><Send className="w-4 h-4" /></button>
       </div>
    </div>
  );
};

// --- PAYWALL & CALCULATOR ---
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

const CurveResistanceCalculator = ({ isPro }) => {
  const [weight, setWeight] = useState(5000);
  const [degree, setDegree] = useState(2);
  const [resistance, setResistance] = useState(0);

  useEffect(() => {
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

// --- RAILOPS: CREW SCHEDULER ---
const RailOpsView = () => {
  const [viewMode, setViewMode] = useState('live');
  const [crews, setCrews] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  const loadData = async () => {
    const t = Date.now();
    const fetchUrl = viewMode === 'history' ? `${API_URL}/schedules?type=history&t=${t}` : `${API_URL}/schedules?t=${t}`;
    try {
      const [res1, res2] = await Promise.all([fetch(`${API_URL}/crew?t=${t}`), fetch(fetchUrl)]);
      if (res1.ok) setCrews(await res1.json());
      if (res2.ok) setSchedules(await res2.json());
    } catch (e) { console.error(e); }
  };
  useEffect(() => { loadData(); }, [viewMode]);

  const handleAssign = async (crewId) => {
    if(!selectedScheduleId) return;
    await fetch(`${API_URL}/schedules/${selectedScheduleId}/assign`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({crewId}) });
    await loadData();
    setSelectedScheduleId(null);
  };
  const handleUnassign = async (scheduleId, crewId) => {
    await fetch(`${API_URL}/schedules/${scheduleId}/unassign`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({crewId}) });
    await loadData();
  };

  const availableCrew = crews.filter(c => c.status === 'Available');

  return (
    <div className="space-y-6">
       {selectedScheduleId && (
         <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-5"><div className="flex justify-between mb-4"><h3 className="font-bold">Assign Crew</h3><button onClick={() => setSelectedScheduleId(null)}><X className="w-5 h-5"/></button></div><div className="space-y-2 max-h-60 overflow-y-auto">{availableCrew.length > 0 ? availableCrew.map(c => (<button key={c._id} onClick={() => handleAssign(c._id)} className="w-full flex justify-between p-3 border rounded hover:bg-slate-50"><span className="text-sm font-bold">{c.name}</span><Plus className="w-4 h-4"/></button>)) : <div className="text-center text-sm italic">No crew available.</div>}</div></div>
         </div>
       )}
       <div className="flex space-x-2 bg-white p-1 rounded-xl border mb-4">{['live','planning','history'].map(m=><button key={m} onClick={()=>setViewMode(m)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize ${viewMode===m?'bg-slate-900 text-white':'text-slate-500'}`}>{m}</button>)}</div>
       {viewMode === 'live' && <div className="bg-slate-900 text-white p-5 rounded-xl mb-4 text-center"><h3 className="font-bold text-lg">Dispatch Board</h3><div className="text-xs mt-1 text-slate-400">Active Trains: {schedules.length}</div></div>}
       <div>
         <h4 className="font-bold text-sm mb-3">Schedule</h4>
         <div className="space-y-3">{schedules.map(s => (
            <div key={s._id} className="bg-white p-4 rounded-xl border shadow-sm">
               <div className="flex justify-between mb-2"><div><span className="font-bold text-sm">{s.trainId}</span> <span className="text-xs bg-slate-100 px-1 rounded">{s.status}</span></div><span className="text-xs font-mono">{formatDate(s.departureTime)}</span></div>
               <div className="text-xs text-slate-500">{s.origin} &rarr; {s.destination}</div>
               <div className="mt-3 pt-3 border-t flex gap-2 flex-wrap">{s.assignedCrew?.map(c => <div key={c._id} className="flex items-center bg-slate-50 border px-2 py-1 rounded-full text-[10px] font-bold">{c.name} {viewMode!=='history' && <button onClick={()=>handleUnassign(s._id, c._id)} className="ml-2 text-slate-400 hover:text-red-500"><X className="w-3 h-3"/></button>}</div>)} {viewMode!=='history' && <button onClick={()=>setSelectedScheduleId(s._id)} className="text-[10px] text-indigo-600 font-bold border border-dashed px-2 py-1 rounded-full">+ Assign</button>}</div>
            </div>
         ))}</div>
       </div>
    </div>
  );
};

// --- COMPANY & PROFILE VIEWS ---
const CompanyView = ({ user, mongoUser, refreshData }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: '', location: '', salary: '', category: 'Field' });

  useEffect(() => { if (mongoUser?.companyName) { fetch(`${API_URL}/jobs`).then(res => res.json()).then(data => { setJobs(data.filter(j => j.company === mongoUser.companyName)); }); } }, [mongoUser]);

  const handlePostJob = async () => {
    if (!mongoUser?.companyName) return alert("Please set your Company Name in Profile first.");
    await fetch(`${API_URL}/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, company: mongoUser.companyName, tags: ['New'] }) });
    refreshData(); 
    const newJob = { ...form, company: mongoUser.companyName, tags: ['New'], postedAt: new Date() };
    setJobs([newJob, ...jobs]);
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-full">
       <div className="h-24 bg-slate-900 relative"><div className="absolute -bottom-8 left-4 flex items-end"><div className="w-16 h-16 bg-white p-1 rounded-xl shadow-lg"><div className="w-full h-full bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600"><Building2 className="w-8 h-8" /></div></div><div className="ml-3 mb-2"><h2 className="text-white font-bold text-lg">{mongoUser?.companyName}</h2></div></div></div>
       <div className="mt-10 px-4 border-b flex space-x-6 text-sm font-medium text-slate-500 overflow-x-auto">{['Overview', 'RailOps', 'Jobs'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`pb-2 whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-slate-700'}`}>{tab}</button>))}</div>
       <div className="p-4">
         {activeTab === 'overview' && <div className="text-center py-10 text-slate-400 text-xs">Overview Stats</div>}
         {activeTab === 'railops' && <RailOpsView />}
         {activeTab === 'jobs' && <div className="bg-white p-5 rounded-xl border mb-6"><input placeholder="Title" className="w-full border p-2 rounded mb-2 text-sm" onChange={e => setForm({...form, title: e.target.value})} /><button onClick={handlePostJob} className="w-full bg-slate-900 text-white py-2 rounded font-bold text-xs">Post</button><div className="mt-4 space-y-2">{jobs.map(j => <JobCard key={j._id} job={j} onClick={() => {}} />)}</div></div>}
       </div>
    </div>
  );
};

const ProfileView = ({ user, mongoUser, refreshProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ role: 'individual', companyName: '', jobTitle: '' });
  const [myAssignments, setMyAssignments] = useState([]);

  useEffect(() => { 
    if (mongoUser) {
        setFormData({ role: mongoUser.role || 'individual', companyName: mongoUser.companyName || '', jobTitle: mongoUser.jobTitle || '' }); 
        if(mongoUser.email) fetch(`${API_URL}/my-assignments?email=${mongoUser.email}`).then(r=>r.json()).then(setMyAssignments);
    }
  }, [mongoUser]);

  const handleSave = async () => { await fetch(`${API_URL}/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); setIsEditing(false); refreshProfile(); };

  return (
    <div className="pb-20 bg-slate-50 min-h-full">
       <div className="bg-white border-b pb-6 mb-4"><div className="h-24 bg-slate-900"></div><div className="px-4 -mt-10"><div className="flex justify-between"><img src={user.imageUrl} className="w-24 h-24 rounded-full border-4 border-white" />{!isEditing && <button onClick={() => setIsEditing(true)} className="mt-10 text-xs font-bold bg-slate-100 px-3 py-1 rounded">Edit</button>}</div><h2 className="text-xl font-bold mt-2">{user.fullName}</h2></div></div>
       <div className="px-4 space-y-4">
          {isEditing && <div className="bg-white p-4 rounded shadow"><select className="w-full border p-2 mb-2 rounded" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}><option value="individual">Individual</option><option value="company">Company</option></select><input className="w-full border p-2 mb-2" placeholder="Title/Company" value={formData.role === 'company' ? formData.companyName : formData.jobTitle} onChange={e => setFormData({...formData, [formData.role === 'company' ? 'companyName' : 'jobTitle']: e.target.value})} /><button onClick={handleSave} className="w-full bg-indigo-600 text-white py-2 rounded">Save</button></div>}
          <div className="bg-white p-5 rounded-xl border"><h3 className="font-bold text-sm mb-3">My Schedule</h3>{myAssignments.length > 0 ? myAssignments.map(s => <div key={s._id} className="text-xs border-b py-2">{s.trainId}: {s.origin} &rarr; {s.destination}</div>) : <p className="text-xs text-slate-400">No assignments.</p>}</div>
       </div>
    </div>
  );
};

// --- STANDARD VIEWS ---
const LoadingScreen = () => <div className="p-10 text-center text-slate-400">Loading...</div>;
const ErrorScreen = ({ msg }) => <div className="p-10 text-center text-red-400">{msg}</div>;
const AdminView = () => <div className="p-4 bg-white m-4 rounded shadow">Admin Panel</div>;
const JobDetailView = ({ job, onBack }) => (<div className="pb-20 p-6"><button onClick={onBack}>Back</button><h2 className="text-xl font-bold mt-4">{job.title}</h2><p>{job.description}</p></div>);
const HomeView = ({ changeTab, jobs, onJobClick }) => (<div className="pb-20"><div className="bg-slate-900 text-white p-6 rounded-b-xl mb-6"><h2 className="text-2xl font-bold">Railnology AI</h2><p className="text-sm text-slate-400">Compliance Intelligence.</p></div><div className="px-4"><SectionTitle title="Recent Jobs" /><div className="space-y-2">{jobs.slice(0,3).map(j => <JobCard key={j._id} job={j} onClick={onJobClick}/>)}</div></div></div>);
const JobsView = ({ jobs, onJobClick }) => (<div className="pb-20 px-4 pt-6"><SectionTitle title="Jobs" /><div className="space-y-2">{jobs.map(j => <JobCard key={j._id} job={j} onClick={onJobClick}/>)}</div></div>);

// --- MAIN CONTENT ---
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
      const [j, g, si] = await Promise.all([
        fetch(`${API_URL}/jobs`).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/glossary`).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/signals`).then(r => r.ok ? r.json() : [])
      ]);
      setData({ jobs: j, glossary: g, signals: si });
    } catch (e) { 
      console.error(e); 
      setError("Data Load Error"); 
      setData({ jobs: [], glossary: [], signals: [] });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  
  useEffect(() => {
    if (isSignedIn && user) {
      fetch(`${API_URL}/users/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clerkId: user.id, email: user.primaryEmailAddress.emailAddress, fullName: user.fullName }) })
      .then(res => res.json()).then(setMongoUser).catch(console.error);
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    if (window.location.search.includes('payment=success') || localStorage.getItem('railnology_pro')) setIsPro(true);
  }, []);

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
          {activeTab === 'tools' && <ToolsView signalAspects={data.signals} isPro={isPro} onUnlock={() => setShowPaywall(true)} />}
          {activeTab === 'learn' && <LibraryView data={data} />}
        </div>
        <div className="bg-white border-t border-slate-200 px-4 pb-safe sticky bottom-0 z-50"><div className="flex justify-between items-center h-16"><TabButton active={activeTab} id="home" icon={Train} label="Home" onClick={setActiveTab} /><TabButton active={activeTab} id="learn" icon={BookOpen} label="Library" onClick={setActiveTab} /><TabButton active={activeTab} id="jobs" icon={Briefcase} label="Jobs" onClick={setActiveTab} />{mongoUser?.role === 'company' && <TabButton active={activeTab} id="company" icon={LayoutDashboard} label="Dash" onClick={setActiveTab} />}</div></div>
      </div>
    </div>
  );
};

const App = () => (<ClerkProvider publishableKey={CLERK_KEY}><MainContent /></ClerkProvider>);
export default App;