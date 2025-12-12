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
//Winston Churchill once said, "To improve is to change; to be perfect is to change often."
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
const Header = ({ isOffline, isPro, isQA, currentApiUrl, onProfileClick, onHomeClick }) => (
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
            {/* FIX: QA Badge Logic simplified. Only show if the API URL is explicitly QA. 
               This ignores the QA email check if the URL is Prod (railnology.com) */}
            {currentApiUrl === ENV.QA_API_URL && <span className={`ml-2 px-1.5 rounded-full text-[8px] font-bold shadow-glow bg-red-600`}>QA</span>}
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

        /* Visualization */
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
      if (!res.ok) throw new Error('API Error');
      
      const data = await res.json();
      
      setMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          text: data.answer,
          sources: data.sources 
        }
      ]);

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to the knowledge base." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col bg-white overflow-hidden relative ${className || 'h-[60vh]'}`}>
       {/* Context Badge */}
       {contextFilter && (
         <div className="absolute top-14 left-0 right-0 flex justify-center pointer-events-none z-10">
            <span className="bg-slate-900/5 backdrop-blur-md text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-200 shadow-sm flex items-center">
              <Filter className="w-3 h-3 mr-1" /> Filtering: {contextFilter.name}
            </span>
         </div>
       )}

       <div className="bg-slate-50/80 backdrop-blur p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3 text-indigo-600 shadow-sm">
                <Bot className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-800">Raillie AI</h3>
                <p className="text-[10px] text-slate-500">{contextFilter ? 'Focused Search' : 'Full Compliance Mode'}</p>
            </div>
          </div>
       </div>

       {/* Chat Area - Full Width */}
       <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth scrollbar-thin">
         {messages.map((m, i) => (
           <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start w-full'}`}>
              <div className={`text-sm leading-relaxed ${
                  m.role === 'user' 
                  ? 'max-w-[85%] p-3.5 rounded-2xl bg-slate-900 text-white rounded-br-none shadow-sm' 
                  : 'w-full text-slate-800 pl-1' 
              }`}>
                 <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
              
              {/* SOURCE PILLS - UPDATED LOGIC */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 w-full justify-start pl-1">
                  {m.sources.map((source, idx) => {
                    const type = source.sourceType;
                    const isRegulation = type === "Regulation";
                    const isOperatingRule = type === "Operating Rule";
                    const isGuidance = type === "Safety Guidance";
                    
                    const sourceLabel = source.sourceId; 
                        
                    // Define color classes based on the new document types
                    const colorClass = isRegulation ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                       isOperatingRule ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                                       isGuidance ? "bg-amber-50 text-amber-700 border-amber-200" :
                                       "bg-blue-50 text-blue-700 border-blue-200";

                    return (
                      <a 
                        key={idx}
                        href="#" 
                        className={`flex items-center text-[10px] px-2 py-1 rounded-full border transition hover:opacity-80 ${colorClass}`}
                      >
                        {isRegulation && <Shield className="w-3 h-3 mr-1" />}
                        {isOperatingRule && <ScrollText className="w-3 h-3 mr-1" />}
                        {isGuidance && <AlertCircle className="w-3 h-3 mr-1" />}
                        {sourceLabel}
                      </a>
                    );
                  })}
                </div>
              )}
           </div>
         ))}
         {loading && (
           <div className="flex items-center text-xs text-slate-400 mt-2 pl-1 animate-pulse">
             <div className="w-2 h-2 bg-indigo-400 rounded-full mr-1 animate-bounce"></div>
             <div className="w-2 h-2 bg-indigo-400 rounded-full mr-1 animate-bounce delay-75"></div>
             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
           </div>
         )}
       </div>

       <div className="p-3 border-t border-slate-200 bg-white flex-shrink-0">
         <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            <input 
              ref={inputRef} 
              className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-slate-700 placeholder-slate-400"
              placeholder={contextFilter ? `Ask about ${contextFilter.name}...` : "Ask Raillie..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
                onClick={handleSend} 
                disabled={loading} 
                className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-transform active:scale-90"
            >
                <ArrowRight className="w-4 h-4" />
            </button>
         </div>
       </div>
    </div>
  );
};

// --- LIBRARY VIEW (SPLIT SCREEN LAYOUT) ---
const LibraryView = ({ onPaywall, onConflict, apiUrl }) => {
    const [selectedContext, setSelectedContext] = useState(null);

    const manuals = [
        { id: 'gcor', name: 'GCOR Rules', icon: ScrollText, color: 'bg-indigo-600', domainId: 'GCOR' },
        { id: 'norac', name: 'NORAC Rules', icon: ScrollText, color: 'bg-rose-600', domainId: 'NORAC' },
        { id: 'advisory', name: 'FRA Guidance', icon: AlertCircle, color: 'bg-amber-600', domainId: 'ADVISORY' },
        { id: '213', name: 'Track Safety', icon: Train, color: 'bg-emerald-500', domainId: 213 },
        { id: '236', name: 'Signals', icon: Zap, color: 'bg-yellow-500', domainId: 236 },
        { id: '229', name: 'Locomotives', icon: Wrench, color: 'bg-blue-500', domainId: 229 },
        { id: '217', name: 'Ops Rules', icon: BookOpen, color: 'bg-purple-500', domainId: 217 },
        { id: '214', name: 'Workplace', icon: Shield, color: 'bg-cyan-500', domainId: 214 },
        { id: '219', name: 'Drug/Alcohol', icon: AlertTriangle, color: 'bg-pink-500', domainId: 219 },
    ];


    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* 1. TOP SECTION: MANUALS GRID (AUTO HEIGHT) */}
            <div className="flex-shrink-0 px-4 pt-4 pb-4 bg-white border-b border-slate-100 z-10">
                <SectionTitle title="Library" subtitle="AI Research & Manuals" />
                <div className="grid grid-cols-4 gap-3 mb-2"> 
                    <button 
                        onClick={() => setSelectedContext(null)}
                        className={`flex flex-col items-center transition-all ${selectedContext === null ? 'opacity-100' : 'opacity-50'}`}
                    >
                        <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center shadow-md mb-1 border border-slate-700 active:scale-95 transition-transform">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">All Docs</span>
                    </button>
                    {manuals.map(m => (
                        <button 
                            key={m.id}
                            onClick={() => setSelectedContext(selectedContext?.id === m.id ? null : m)}
                            className={`flex flex-col items-center transition-all ${selectedContext?.id === m.id ? 'opacity-100' : selectedContext ? 'opacity-40' : 'opacity-100'}`}
                        >
                            <div className={`${m.color} w-14 h-14 rounded-xl flex items-center justify-center shadow-md mb-1 text-white active:scale-95 transition-transform`}>
                                <m.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">{m.name.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. BOTTOM SECTION: RAILLY (FILLS REMAINING SPACE) */}
            <div className="flex-1 min-h-0 relative border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                <AIChat contextFilter={selectedContext} className="h-full" onPaywall={onPaywall} onConflict={onConflict} apiUrl={apiUrl} />
            </div>
        </div>
    );
};

// --- RESTORED VIEWS (Standard Views) ---
const AdminView = ({ apiUrl }) => <div className="p-4 bg-white m-4 rounded shadow">Admin Panel ({apiUrl})</div>;
const JobDetailView = ({ job, onBack }) => (
    <div className="pb-20 p-6 bg-white min-h-screen">
        <button onClick={onBack} className="mb-4 text-sm flex items-center text-slate-500 hover:text-slate-900"><ArrowLeft className="w-4 h-4 mr-1"/> Back</button>
        <JobLogo logo={job.logo} company={job.company} size="lg"/>
        <h2 className="text-2xl font-bold mt-4">{job.title}</h2>
        <div className="flex items-center text-slate-500 mt-2 text-sm">
             <Building2 className="w-4 h-4 mr-1"/> {job.company}
             <span className="mx-2">•</span>
             <MapPin className="w-4 h-4 mr-1"/> {job.location}
        </div>
        <div className="mt-6 border-t pt-6">
            <h3 className="font-bold mb-2">Description</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{job.description || "No description provided."}</p>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100">
            <a href={job.externalLink} target="_blank" className="block w-full bg-slate-900 text-white text-center py-4 rounded-xl font-bold hover:bg-slate-800 transition">
                Apply Now
            </a>
        </div>
    </div>
);

const HomeView = ({ changeTab, jobs, onJobClick, apiUrl }) => (
    <div className="pb-24">
        <div className="px-4 mt-6">
            {/* Show current API URL in Admin/QA view */}
            {apiUrl === ENV.QA_API_URL && <div className="text-center text-red-600 text-xs font-bold mb-3 p-2 bg-red-50 rounded-lg border border-red-200">QA ENVIRONMENT ACTIVE</div>}
            <SafetyMinuteCard />
            
            <SectionTitle title="Recent Jobs" action={
                <button onClick={() => changeTab('jobs')} className="text-indigo-600 text-xs font-bold hover:text-indigo-800">View All</button>
            }/>
            
            <div className="space-y-2">
                {jobs.slice(0,3).map(j => <JobCard key={j._id} job={j} onClick={onJobClick}/>)}
            </div>
        </div>
    </div>
);

const JobsView = ({ jobs, onJobClick }) => (
    <div className="pb-24 px-4 pt-6">
        <SectionTitle title="Jobs" subtitle="Marketplace" />
        <div className="space-y-2">
            {jobs.map(j => <JobCard key={j._id} job={j} onClick={onJobClick}/>)}
        </div>
    </div>
);

const CompanyView = ({ user, mongoUser, refreshData, apiUrl }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: '', location: '', salary: '', category: 'Field' });

  useEffect(() => { 
    if (mongoUser?.companyName) { 
       fetch(`${apiUrl}/jobs`)
         .then(res => res.json())
         .then(data => { 
            setJobs(data.filter(j => j.company === mongoUser.companyName)); 
         })
         .catch(err => console.error("Error fetching company jobs", err));
    } 
  }, [mongoUser, apiUrl]);

  const handlePostJob = async () => {
    if (!mongoUser?.companyName) return console.error("Please set your Company Name in Profile first.");
    try {
      await fetch(`${apiUrl}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, company: mongoUser.companyName, tags: ['New'] })
      });
      refreshData();
      const newJob = { ...form, company: mongoUser.companyName, tags: ['New'], postedAt: new Date() };
      setJobs([newJob, ...jobs]);
      setForm({ title: '', location: '', salary: '', category: 'Field' });
    } catch (e) {
      console.error("Failed to post job", e);
    }
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-full">
       <div className="h-24 bg-slate-900 relative"><div className="absolute -bottom-8 left-4 flex items-end"><div className="w-16 h-16 bg-white p-1 rounded-xl shadow-lg"><div className="w-full h-full bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600"><Building2 className="w-8 h-8" /></div></div><div className="ml-3 mb-2"><h2 className="text-white font-bold text-lg">{mongoUser?.companyName || "Your Company"}</h2></div></div></div>
       <div className="mt-10 px-4 border-b flex space-x-6 text-sm font-medium text-slate-500 overflow-x-auto">{['Overview', 'RailOps', 'Jobs'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`pb-2 whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-slate-700'}`}>{tab}</button>))}</div>
       <div className="p-4">
         {activeTab === 'overview' && <div className="text-center py-10 text-slate-400 text-xs">Overview Stats</div>}
         {activeTab === 'railops' && <RailOpsView />}
         {activeTab === 'jobs' && (
           <div className="bg-white p-5 rounded-xl border mb-6">
             <input 
               placeholder="Title" 
               className="w-full border p-2 rounded mb-2 text-sm" 
               value={form.title} 
               onChange={e => setForm({...form, title: e.target.value})} 
             />
             <button onClick={handlePostJob} className="w-full bg-slate-900 text-white py-2 rounded font-bold text-xs">Post</button>
             <div className="mt-4 space-y-2">
               {jobs.map(j => <JobCard key={j._id} job={j} onClick={() => {}} />)}
             </div>
           </div>
         )}
       </div>
    </div>
  );
};

const ProfileView = ({ user, mongoUser, refreshProfile, apiUrl }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ role: 'individual', companyName: '', jobTitle: '' });
  const [myAssignments, setMyAssignments] = useState([]);

  useEffect(() => { 
    if (mongoUser) {
        setFormData({ role: mongoUser.role || 'individual', companyName: mongoUser.companyName || '', jobTitle: mongoUser.jobTitle || '' }); 
        if(mongoUser.email) {
          fetch(`${apiUrl}/my-assignments?email=${mongoUser.email}`)
            .then(r => r.json())
            .then(setMyAssignments)
            .catch(err => console.error(err));
        }
    }
  }, [mongoUser, apiUrl]);

  const handleSave = async () => { 
      try {
        await fetch(`${apiUrl}/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        setIsEditing(false); 
        refreshProfile(); 
      } catch (e) {
        console.error("Save profile failed", e);
      }
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-full">
       <div className="bg-white border-b pb-6 mb-4"><div className="h-24 bg-slate-900"></div><div className="px-4 -mt-10"><div className="flex justify-between"><img src={user.imageUrl} className="w-24 h-24 rounded-full border-4 border-white" />{!isEditing && <button onClick={() => setIsEditing(true)} className="mt-10 text-xs font-bold bg-slate-100 px-3 py-1 rounded">Edit</button>}</div><h2 className="text-xl font-bold mt-2">{user.fullName}</h2></div></div>
       <div className="px-4 space-y-4">
         {isEditing && <div className="bg-white p-4 rounded shadow"><select className="w-full border p-2 mb-2 rounded" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}><option value="individual">Individual</option><option value="company">Company</option></select><input className="w-full border p-2 mb-2" placeholder="Title/Company" value={formData.role === 'company' ? formData.companyName : formData.jobTitle} onChange={e => setFormData({...formData, [formData.role === 'company' ? 'companyName' : 'jobTitle']: e.target.value})} /><button onClick={handleSave} className="w-full bg-indigo-600 text-white py-2 rounded">Save</button></div>}
         <div className="bg-white p-5 rounded-xl border"><h3 className="font-bold text-sm mb-3">My Schedule</h3>{myAssignments.length > 0 ? myAssignments.map(s => <div key={s._id} className="text-xs border-b py-2">{s.trainId}: {s.origin} &rarr; {s.destination}</div>) : <p className="text-xs text-slate-400">No assignments found.</p>}</div>
       </div>
    </div>
  );
};

// --- MAIN CONTENT ---
const MainContent = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ jobs: [], glossary: [], signals: [] });
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showConflict, setShowConflict] = useState(false); 
  const [mongoUser, setMongoUser] = useState(null);
  const { user, isSignedIn } = useUser();

  // --- QA/PROD API URL DETERMINATION ---
  // If the URL contains 'qa' OR the user is a QA team member, use the QA API URL
  const isQAUser = isSignedIn && QA_TEAM_EMAILS.includes(user.primaryEmailAddress?.emailAddress);
  const useQABase = window.location.hostname.includes('qa') || isQAUser;
  const apiUrl = useQABase ? ENV.QA_API_URL : ENV.API_URL;
  // ------------------------------------


  const handleClaimDevice = async () => {
      const deviceId = getDeviceId();
      await fetch(`${apiUrl}/users/claim-device`, { // Uses dynamic apiUrl
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, deviceId })
      });
      setShowConflict(false);
      console.log("Device claimed. Please retry your search.");
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [j, g, si] = await Promise.all([
        fetch(`${apiUrl}/jobs`).then(r => r.ok ? r.json() : []),
        fetch(`${apiUrl}/glossary`).then(r => r.ok ? r.json() : []),
        fetch(`${apiUrl}/signals`).then(r => r.ok ? r.json() : [])
      ]);
      setData({ jobs: j, glossary: g, signals: si });
    } catch (e) { 
      console.error("API Fetch Error:", e);
      setData({ jobs: [], glossary: [], signals: [] });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [apiUrl]); // Refetch when API URL changes

  useEffect(() => {
    if (isSignedIn && user) {
        const deviceId = getDeviceId();
        fetch(`${apiUrl}/users/sync`, { // Uses dynamic apiUrl
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            clerkId: user.id, 
            email: user.primaryEmailAddress.emailAddress, 
            fullName: user.fullName,
            deviceId 
          })
        })
        .then(res => res.json())
        .then(setMongoUser)
        .catch(err => console.error("User sync failed:", err));
    }
  }, [isSignedIn, user, apiUrl]); 

  useEffect(() => {
    if (window.location.search.includes('payment=success') || localStorage.getItem('railnology_pro')) setIsPro(true);
  }, []);

  const ADMIN = ENV.ADMIN_EMAIL;
  if (selectedJob) return <JobDetailView job={selectedJob} onBack={() => setSelectedJob(null)} />;

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center font-sans overflow-hidden">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 3px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      {showConflict && <DeviceConflictModal onClaim={handleClaimDevice} />}
      
      /* Main mobile container now handles the fixed position and width constraints. */
      <div className="w-full max-w-[480px] h-screen bg-slate-50 shadow-2xl relative flex flex-col border-x border-slate-200">
        
        /* Header content */
        <div className="w-full fixed top-0 z-50 max-w-[480px] mx-auto">
          <Header onProfileClick={() => setActiveTab('profile')} onHomeClick={() => setActiveTab('home')} isOffline={false} isPro={isPro} isQA={isQAUser} currentApiUrl={apiUrl} />
        </div>
        
        /* Main View Area - Handles Scrolling Logic */
        <div className={`flex-1 overflow-hidden relative flex flex-col pt-16 pb-20`}> 
          
          /* All views inside this scroll container are now scrollable within the fixed bounds */
          {activeTab === 'home' && (
             <div className="flex-1 overflow-y-auto scrollbar-thin">
                {isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN && <AdminView refreshData={fetchData} apiUrl={apiUrl} />}
                <HomeView changeTab={setActiveTab} jobs={data.jobs} onJobClick={setSelectedJob} apiUrl={apiUrl} />
             </div>
          )}
          {activeTab === 'jobs' && (
             <div className="flex-1 overflow-y-auto scrollbar-thin">
                <JobsView jobs={data.jobs} onJobClick={setSelectedJob} />
             </div>
          )}
          
          {activeTab === 'learn' && <LibraryView onPaywall={() => setShowPaywall(true)} onConflict={() => setShowConflict(true)} apiUrl={apiUrl} />}
          
          {activeTab === 'company' && mongoUser?.role === 'company' && <div className="flex-1 overflow-y-auto scrollbar-thin"><CompanyView user={user} mongoUser={mongoUser} refreshData={fetchData} apiUrl={apiUrl} /></div>}
          {activeTab === 'profile' && isSignedIn && <div className="flex-1 overflow-y-auto scrollbar-thin"><ProfileView user={user} mongoUser={mongoUser} refreshProfile={() => {}} apiUrl={apiUrl} /></div>}
          
          /* RESTORED TOOLS VIEW */
          {activeTab === 'tools' && (
             <div className="flex-1 overflow-y-auto scrollbar-thin">
                <ToolsView signalAspects={data.signals} isPro={isPro} onUnlock={() => setShowPaywall(true)} />
             </div>
          )}
          
          /* RailOps View */
          {activeTab === 'company' && mongoUser?.role === 'company' && (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <RailOpsView />
            </div>
          )}
        </div>

        /* Bottom Navigation content - Now fixed and scoped to the max-width */
        <div className="bg-white/90 backdrop-blur-lg border-t border-slate-200 px-6 pb-safe h-20 fixed bottom-0 z-50 max-w-[480px] mx-auto w-full">
            <div className="flex justify-between items-center h-full">
                <TabButton active={activeTab} id="home" icon={LayoutDashboard} label="Home" onClick={setActiveTab} />
                <TabButton active={activeTab} id="learn" icon={BookOpen} label="Library" onClick={setActiveTab} />
                <TabButton active={activeTab} id="jobs" icon={Briefcase} label="Jobs" onClick={setActiveTab} />
                <TabButton active={activeTab} id="tools" icon={Wrench} label="Tools" onClick={setActiveTab} />
                {mongoUser?.role === 'company' && <TabButton active={activeTab} id="company" icon={Building2} label="Dash" onClick={setActiveTab} />}
            </div>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <ClerkProvider publishableKey={ENV.CLERK_KEY}>
    <MainContent />
  </ClerkProvider>
);
export default App;