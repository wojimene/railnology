import React, { useState, useEffect, useRef } from 'react';
import { 
  Train, Globe, BookOpen, Briefcase, Wrench, Lock, Search, 
  ChevronRight, Calculator, AlertTriangle, ArrowRight, Star, 
  Zap, Menu, X, Eye, RotateCcw, Filter, Loader2, WifiOff, ServerCrash,
  PlusCircle, Save, CheckCircle, Database, LogIn, User, Image as ImageIcon, 
  Video, CreditCard, Unlock, FileText, Scale, ScrollText, Shield, UserCircle, 
  Building2, LayoutDashboard, Edit3, MapPin, Plus, Trash2, ExternalLink, 
  ArrowLeft, BarChart3, Calendar, Users, AlertCircle, History, Clock, Bot, Send,
  Play, Radio, Info, Smartphone, Monitor, ClipboardCheck, FileBarChart, CheckSquare
} from 'lucide-react';

// ✅ PRODUCTION: Real Authentication Import
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

// --- LOGO ---
const RailnologyLogo = "https://placehold.co/150x40/01796F/ffffff?text=RAILNOLOGY+%E2%96%B3"; 

// ==========================================
// 1. CONFIGURATION & ENVIRONMENT
// ==========================================

const ENV = {
  // Production URL (Render)
  API_URL: import.meta.env.VITE_API_URL || 'https://railnology-api.onrender.com/api',
  // QA API URL default to use the live Render QA address
  QA_API_URL: import.meta.env.VITE_QA_ENV_URL || 'https://railnology-qa.onrender.com/api', 
  CLERK_KEY: import.meta.env.VITE_CLERK_KEY,
  STRIPE_LINK: import.meta.env.VITE_STRIPE_PAYMENT_LINK,
  ADMIN_EMAIL: import.meta.env.VITE_ADMIN_EMAIL || 'wayne@railnology.com'
};

const BRAND = {
  name: "Railnology",
  domain: "railnology.com",
  color: "bg-slate-900", 
  accent: "text-amber-500" 
};

// Global list of authorized QA team emails (MUST match server.js list)
const QA_TEAM_EMAILS = [
    ENV.ADMIN_EMAIL,
    'tester@railnology.com' 
];

// --- DEVICE ID UTILITY ---
const getDeviceId = () => {
    let id = localStorage.getItem('railnology_device_id');
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('railnology_device_id', id);
    }
    return id;
};

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

const formatSalary = (val) => {
  if (!val || val === "Competitive" || val === "DOE") return val || "DOE";
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return !isNaN(num) ? (num > 1000 ? `$${(num / 1000).toFixed(0)}k` : `$${num}/hr`) : val;
};

const getCompensation = (job) => {
  const MARKET_RATES = {
    "conductor": "$60k - $85k", "engineer": "$75k - $110k", "dispatcher": "$80k - $105k", "mechanic": "$28 - $42/hr", "manager": "$95k - $130k"
  };
  if (job.salary && job.salary !== "Competitive" && job.salary !== "DOE") return formatSalary(job.salary);
  const t = job.title?.toLowerCase() || "";
  for (const [k, r] of Object.entries(MARKET_RATES)) if (t.includes(k)) return r;
  return "DOE";
};

// ==========================================
// 3. SUB-COMPONENTS
// ==========================================

const TabButton = ({ active, id, icon: Icon, label, onClick }) => (
  <button 
    onClick={() => onClick(id)}
    className={`flex flex-col items-center justify-center w-full py-3 transition-all border-t-2 ${
      active === id ? 'border-amber-500 text-slate-900 bg-slate-50' : 'border-transparent text-gray-400 hover:text-gray-600'
    }`}
  >
    <Icon className={`w-6 h-6 mb-1 ${active === id ? 'text-indigo-600' : ''}`} />
    <span className={`text-[10px] font-bold uppercase ${active === id ? 'text-indigo-900' : ''}`}>{label}</span>
  </button>
);

// --- HEADER UPDATED FOR QA BADGE ---
const Header = ({ isOffline, isPro, isQA, currentApiUrl, onProfileClick, onHomeClick }) => {
  const isQaEnvironmentActive = currentApiUrl === ENV.QA_API_URL;
  
  return (
    <div className={`${BRAND.color} text-white p-4 h-16 sticky top-0 z-50 shadow-md flex-shrink-0`}>
      <div className="flex justify-between items-center h-full">
        <button 
          onClick={onHomeClick} 
          className="flex items-center space-x-2 focus:outline-none active:opacity-80 transition-opacity"
        >
          <div className="bg-amber-500 p-1.5 rounded-md text-slate-900 shadow-sm">
            <img src={RailnologyLogo} alt="Railnology Logo" className="w-5 h-5 object-contain" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-extrabold tracking-tight leading-none">{BRAND.name}</h1>
            <p className="text-[9px] text-slate-400 tracking-widest font-medium uppercase mt-0.5">
              Platform 
              {isPro && <span className="ml-2 bg-emerald-500 text-white px-1.5 rounded-full text-[8px] font-bold shadow-glow">PRO</span>}
              {/* Only show QA badge if the URL specifically targets the QA API. */}
              {isQaEnvironmentActive && <span className={`ml-2 px-1.5 rounded-full text-[8px] font-bold shadow-glow bg-red-600`}>QA</span>}
            </p>
          </div>
        </button>
        <div className="flex items-center space-x-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 hover:bg-slate-700 transition font-bold">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
             <button onClick={onProfileClick} className="opacity-90 hover:opacity-100 transition">
               <UserButton afterSignOutUrl="/"/>
             </button>
          </SignedIn>
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ title, subtitle, action }) => (
  <div className="mb-4 mt-2 flex justify-between items-end">
    <div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      {subtitle && <p className="text-slate-500 text-xs font-medium mt-0.5">{subtitle}</p>}
    </div>
    {action && action}
  </div>
);

const JobLogo = ({ logo, company, size="sm" }) => {
  const [err, setErr] = useState(false);
  const dims = size === "lg" ? "w-16 h-16 p-2" : "w-12 h-12 p-1";
  
  if (!logo || err) {
    return (
      <div className={`${dims} flex-shrink-0 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm p-1`}>
        <img src={RailnologyLogo} alt="Railnology Logo" className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div className={`${dims} flex-shrink-0 bg-white rounded-xl border border-slate-100 flex items-center justify-center shadow-sm`}>
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
  <div onClick={() => onClick(job)} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer mb-3 active:scale-[0.98]">
    <div className="flex justify-between items-start gap-3">
      <JobLogo logo={job.logo} company={job.company} />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 text-sm truncate">{job.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          {job.company} 
          {job.tags && job.tags.includes('External') && <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">Ext</span>}
        </p>
        <div className="flex items-center text-xs text-slate-400 mt-2 mb-3">
          <MapPin className="w-3 h-3 mr-1" /> {job.location}
          <span className="mx-2 text-slate-300">|</span>
          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">{getCompensation(job)}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 mt-1" />
    </div>
  </div>
);

// --- INSPECTION FORM COMPONENT ---
const TrackInspectionForm = ({ onClose }) => {
    const [defects, setDefects] = useState([]);
    const [currentDefect, setCurrentDefect] = useState({ type: '', mp: '', track: 'Main 1' });
    const [metadata, setMetadata] = useState({ subdivision: '', inspector: '' });

    const addDefect = () => {
        if (!currentDefect.type || !currentDefect.mp) return;
        setDefects([...defects, { ...currentDefect, id: Date.now() }]);
        setCurrentDefect({ type: '', mp: '', track: 'Main 1' });
    };

    const handleSave = () => {
        console.log("Report Saved! (Simulated)");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-50 z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 pt-12 shadow-md flex justify-between items-center flex-shrink-0">
                <button onClick={onClose} className="text-slate-300 hover:text-white">Cancel</button>
                <h2 className="font-bold">New Inspection (213)</h2>
                <button onClick={handleSave} className="text-emerald-400 font-bold">Save</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Meta Data */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Trip Details</h3>
                    <div className="space-y-3">
                        <input 
                            placeholder="Subdivision (e.g. Miami Sub)" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:border-indigo-500 focus:outline-none"
                            value={metadata.subdivision}
                            onChange={e => setMetadata({...metadata, subdivision: e.target.value})}
                        />
                        <input 
                            placeholder="Inspector Name" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:border-indigo-500 focus:outline-none"
                            value={metadata.inspector}
                            onChange={e => setMetadata({...metadata, inspector: e.target.value})}
                        />
                    </div>
                </div>

                {/* New Defect Entry */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase">Log Defect</h3>
                        <button className="text-[10px] flex items-center text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-full">
                            <Bot className="w-3 h-3 mr-1" /> Check Rule
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input 
                            placeholder="MP (e.g. 104.5)" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm"
                            value={currentDefect.mp}
                            onChange={e => setCurrentDefect({...currentDefect, mp: e.target.value})}
                        />
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm"
                            value={currentDefect.track}
                            onChange={e => setCurrentDefect({...currentDefect, track: e.target.value})}
                        >
                            <option>Main 1</option>
                            <option>Main 2</option>
                            <option>Siding</option>
                            <option>Yard</option>
                        </select>
                    </div>
                    <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm mb-4"
                        value={currentDefect.type}
                        onChange={e => setCurrentDefect({...currentDefect, type: e.target.value})}
                    >
                        <option value="">Select Defect Type...</option>
                        <option value="Broken Bolt">Broken Bolt (Joint)</option>
                        <option value="Loose Bolt">Loose Bolt</option>
                        <option value="Pull Apart">Pull Apart</option>
                        <option value="Broken Rail">Broken Rail (Detail Fracture)</option>
                        <option value="Wide Gauge">Wide Gauge</option>
                        <option value="Profile">Profile / Surface</option>
                        <option value="Tie Defect">Defective Tie</option>
                    </select>
                    <button 
                        onClick={addDefect}
                        disabled={!currentDefect.type || !currentDefect.mp}
                        className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50"
                    >
                        Add to Report
                    </button>
                </div>

                {/* Defect List */}
                {defects.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 pl-1">Logged Items ({defects.length})</h3>
                        <div className="space-y-2">
                            {defects.map((d, i) => (
                                <div key={d.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center">
                                        <div className="bg-rose-100 text-rose-600 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mr-3">{i+1}</div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{d.type}</div>
                                            <div className="text-[10px] text-slate-500">MP {d.mp} • {d.track}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setDefects(defects.filter(x => x.id !== d.id))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- RAILOPS (OPERATIONS DASHBOARD) ---
const RailOpsView = () => {
    const [subTab, setSubTab] = useState('dispatch');
    const [schedules, setSchedules] = useState([]);
    const [crews, setCrews] = useState([]);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [showInspection, setShowInspection] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        const loadData = async () => {
            try {
                const [schedRes, crewRes] = await Promise.all([
                    fetch(`${ENV.API_URL}/schedules`).then(r => r.json()),
                    fetch(`${ENV.API_URL}/crew`).then(r => r.json())
                ]);
                setSchedules(schedRes);
                setCrews(crewRes);
            } catch (e) {
                console.error("RailOps Load Error", e);
            }
        };
        loadData();
    }, []);

    const assignCrew = async (crewId) => {
        if (!selectedSchedule) return;
        try {
            await fetch(`${ENV.API_URL}/schedules/${selectedSchedule._id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crewId })
            });
            // Optimistic update
            const crewMember = crews.find(c => c._id === crewId);
            setSchedules(prev => prev.map(s => 
                s._id === selectedSchedule._id 
                ? { ...s, assignedCrew: [...(s.assignedCrew || []), crewMember] } 
                : s
            ));
            setSelectedSchedule(null);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="pb-24 pt-4 h-full flex flex-col relative">
            {/* INSPECTION FORM OVERLAY */}
            {showInspection && <TrackInspectionForm onClose={() => setShowInspection(false)} />}

            {/* SUB-NAVIGATION */}
            <div className="px-4 mb-4 flex-shrink-0">
                <div className="bg-slate-100 p-1 rounded-xl flex">
                    {['Dispatch', 'Inspections', 'Reports'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setSubTab(tab.toLowerCase())}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                subTab === tab.toLowerCase() 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto px-4 scrollbar-thin">
                {/* 1. DISPATCH TAB */}
                {subTab === 'dispatch' && (
                    <div className="space-y-4">
                        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold">Active Board</h3>
                                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-1 rounded-full border border-emerald-500/30">Live</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-white/10 p-3 rounded-lg">
                                    <div className="text-2xl font-bold">{schedules.length}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Active Trains</div>
                                </div>
                                <div className="bg-white/10 p-3 rounded-lg">
                                    <div className="text-2xl font-bold">{crews.filter(c => c.status === 'Available').length}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Crew Ready</div>
                                </div>
                            </div>
                        </div>

                        <SectionTitle title="Train Schedules" />
                        
                        {schedules.map(schedule => (
                            <div key={schedule._id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center">
                                        <div className="bg-indigo-50 p-2 rounded-lg mr-3">
                                            <Train className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{schedule.trainId}</h4>
                                            <p className="text-xs text-slate-500">{schedule.origin} <span className="mx-1">→</span> {schedule.destination}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                                        {new Date(schedule.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>

                                <div className="border-t border-slate-50 pt-3 flex flex-wrap gap-2 items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Crew:</span>
                                    {schedule.assignedCrew && schedule.assignedCrew.length > 0 ? (
                                        schedule.assignedCrew.map((c, i) => (
                                            <div key={i} className="flex items-center bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-[10px] font-bold border border-indigo-100">
                                                <UserCircle className="w-3 h-3 mr-1" />
                                                {c.name}
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-[10px] text-red-400 italic">Unassigned</span>
                                    )}
                                    <button 
                                        onClick={() => setSelectedSchedule(schedule)}
                                        className="ml-auto text-[10px] bg-slate-900 text-white px-3 py-1.5 rounded-full font-bold hover:bg-slate-700 transition"
                                    >
                                        + Assign
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. INSPECTIONS TAB (COMPLIANCE) */}
                {subTab === 'inspections' && (
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center shadow-sm">
                            <ClipboardCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-800">Electronic Inspection</h3>
                            <p className="text-xs text-slate-500 mb-4 max-w-[200px] mx-auto">Start a new 213 Track Inspection or 236 Signal Test.</p>
                            <button 
                                onClick={() => setShowInspection(true)}
                                className="bg-emerald-600 text-white w-full py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition active:scale-95"
                            >
                                Start New Form (213)
                            </button>
                        </div>

                        <SectionTitle title="Recent Logs" />
                        {[1,2].map(i => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center mb-1">
                                        <AlertTriangle className="w-3 h-3 text-amber-500 mr-1.5" />
                                        <span className="text-xs font-bold text-slate-700">Broken Bolt (Joint)</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">Milepost 104.5 • Main 1</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-slate-500">Ref: 49 CFR</div>
                                    <div className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">§ 213.121</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. REPORTS TAB */}
                {subTab === 'reports' && (
                    <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition cursor-pointer">
                                <FileText className="w-8 h-8 text-slate-400 mb-3" />
                                <h4 className="font-bold text-sm text-slate-800">Daily Ops</h4>
                                <p className="text-[10px] text-slate-500">Crew hours & delays</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition cursor-pointer">
                                <FileBarChart className="w-8 h-8 text-slate-400 mb-3" />
                                <h4 className="font-bold text-sm text-slate-800">FRA Monthly</h4>
                                <p className="text-[10px] text-slate-500">Defect summary</p>
                            </div>
                         </div>
                    </div>
                )}
            </div>

            {/* CREW SELECTION MODAL */}
            {selectedSchedule && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Assign Crew</h3>
                            <button onClick={() => setSelectedSchedule(null)}><X className="w-5 h-5 text-slate-400"/></button>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">Select crew for Train <strong>{selectedSchedule.trainId}</strong></p>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {crews.filter(c => c.status === 'Available').map(crew => (
                                <button 
                                    key={crew._id}
                                    onClick={() => assignCrew(crew._id)}
                                    className="w-full flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition"
                                >
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs mr-3">
                                            {crew.name.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-slate-800">{crew.name}</div>
                                            <div className="text-[10px] text-emerald-600 flex items-center">
                                                <Clock className="w-3 h-3 mr-1" /> 12h Remaining
                                            </div>
                                        </div>
                                    </div>
                                    <Plus className="w-4 h-4 text-slate-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- TOOLS COMPONENTS ---
const CurveResistanceCalculator = ({ isPro }) => {
  const [weight, setWeight] = useState(5000);
  const [degree, setDegree] = useState(2);
  const [resistance, setResistance] = useState(0);

  useEffect(() => {
    // Formula: Resistance (lbs) = 0.8 * Weight (tons) * Curve Degree (degrees)
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
                style={{ width: `${Math.min((resistance / 240000) * 100, 100)}%` }} 
              ></div>
           </div>
        </div>
    </div>
  );
};

const ToolsView = ({ signalAspects, isPro, onUnlock }) => (
    <div className="pb-24 px-4 pt-6">
        <SectionTitle title="Tools" subtitle="Calculators & Decoders" />
        <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
            <h3 className="font-bold text-sm mb-4 flex items-center text-slate-800">
                <Calculator className="w-4 h-4 mr-2 text-indigo-600"/> Curve Resistance
            </h3>
            <CurveResistanceCalculator isPro={isPro} />
        </div>
        {!isPro && (
            <button onClick={onUnlock} className="w-full bg-amber-50 text-amber-900 border border-amber-200 py-3 rounded-xl font-bold text-sm mb-4 flex items-center justify-center hover:bg-amber-100 transition">
                <Lock className="w-4 h-4 mr-2"/> Unlock More Tools
            </button>
        )}
    </div>
);

// --- DAILY CONCEPT CARD ---
const SafetyMinuteCard = () => (
  <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-lg mb-6 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
      <Radio className="w-24 h-24" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center mb-3">
        <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm flex items-center">
          <Play className="w-3 h-3 mr-1 fill-current" /> Daily Insight
        </span>
        <span className="ml-auto text-[10px] opacity-70">Dec 07</span>
      </div>
      <h3 className="text-lg font-bold mb-1">Broken Rail Identification</h3>
      <p className="text-indigo-100 text-xs mb-4 max-w-[85%]">Visual cues for detecting transverse fissures before they become service failures.</p>
      
      <button className="bg-white text-indigo-700 px-4 py-2 rounded-full text-xs font-bold flex items-center hover:bg-indigo-50 transition active:scale-95 shadow-md">
        Watch Video (3m)
      </button>
    </div>
  </div>
);

// --- MODALS ---
const PaywallModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
      <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto border-4 border-white shadow-sm">
        <Lock className="w-6 h-6 text-amber-600" />
      </div>
      <h3 className="text-xl font-extrabold text-center text-slate-900 mb-2">Usage Limit Reached</h3>
      <p className="text-center text-slate-500 text-sm mb-6 leading-relaxed">
        You've used your 10 free daily searches. Upgrade to Pro for unlimited Raillie AI access.
      </p>
      <div className="space-y-3">
        <a href={ENV.STRIPE_LINK} target="_blank" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition flex items-center justify-center">
          <CreditCard className="w-4 h-4 mr-2" /> Upgrade to Pro
        </a>
        <button onClick={onClose} className="w-full py-2 text-sm text-slate-400 font-medium hover:text-slate-600">Maybe Later</button>
      </div>
    </div>
  </div>
);

const DeviceConflictModal = ({ onClaim }) => (
  <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm shadow-2xl relative border-t-4 border-rose-500">
      <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mb-4 mx-auto border-4 border-white shadow-sm">
        <Monitor className="w-6 h-6 text-rose-600" />
      </div>
      <h3 className="text-xl font-extrabold text-center text-slate-900 mb-2">Active Elsewhere</h3>
      <p className="text-center text-slate-500 text-sm mb-6 leading-relaxed">
        You are currently active on another device. Railnology allows one active session at a time.
      </p>
      <button onClick={onClaim} className="w-full bg-rose-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-rose-700 transition flex items-center justify-center mb-3">
        <Smartphone className="w-4 h-4 mr-2" /> Continue on This Device
      </button>
      <p className="text-[10px] text-center text-slate-400">This will log you out of the other session.</p>
    </div>
  </div>
);

// --- AI CHAT COMPONENT ---
const AIChat = ({ contextFilter, className, onPaywall, onConflict, apiUrl }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', text: contextFilter ? `Raillie active. Focused on: ${contextFilter.name}` : "Hello! I am Raillie. Ask me about 49 CFR regulations." }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef(null); 
  const inputRef = useRef(null); 
  const { user } = useUser();

  useEffect(() => {
    if (!loading && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages.length]); 

  useEffect(() => {
    if (contextFilter) {
      setMessages(prev => [...prev, { role: 'system', text: `Context switched to: ${contextFilter.name} (Domain ${contextFilter.domainId}).` }]);
    }
  }, [contextFilter]);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setLoading(true);

    if (inputRef.current) {
        inputRef.current.blur();
    }

    try {
      const deviceId = getDeviceId();
      const payload = { 
          query: userMsg, 
          userId: user?.id, 
          deviceId: deviceId 
      };
      if (contextFilter) payload.filterDomain = contextFilter.domainId; 

      // --- USE DYNAMIC API URL ---
      const res = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.status === 402) {
          if (onPaywall) onPaywall();
          setMessages(prev => [...prev, { role: 'ai', text: "🔒 Daily limit reached. Please upgrade to continue." }]);
          return;
      }
      if (res.status === 409) {
          if (onConflict) onConflict();
          setMessages(prev => [...prev, { role: 'ai', text: "⚠️ Session paused due to activity on another device." }]);
          return;
      }
      if (!res.ok) throw new Error('API Error