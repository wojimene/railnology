import React, { useState, useEffect, useRef } from 'react';
import { 
  Train, Globe, BookOpen, Briefcase, Wrench, Lock, Search, 
  ChevronRight, Calculator, AlertTriangle, ArrowRight, Star, 
  Zap, Menu, X, Eye, RotateCcw, Filter, Loader2, WifiOff, ServerCrash,
  PlusCircle, Save, CheckCircle, Database, LogIn, User, Image as ImageIcon, 
  Video, CreditCard, Unlock, FileText, Scale, ScrollText, Shield, UserCircle, 
  Building2, LayoutDashboard, Edit3, MapPin, Plus, Trash2, ExternalLink, 
  ArrowLeft, BarChart3, Calendar, Users, AlertCircle, History, Clock, Bot, Send,
  Play, Radio, Info, Smartphone, Monitor
} from 'lucide-react';

// ✅ PRODUCTION: Real Authentication Import
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

// ==========================================
// 1. CONFIGURATION & ENVIRONMENT
// ==========================================

const ENV = {
  // Standard Vite Production Environment Access
  API_URL: import.meta.env.VITE_API_URL || 'https://api.railnology.com',
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

const Header = ({ isOffline, isPro, onProfileClick, onHomeClick }) => (
  <div className={`${BRAND.color} text-white p-4 sticky top-0 z-50 shadow-md flex-shrink-0`}>
    <div className="flex justify-between items-center">
      <button 
        onClick={onHomeClick} 
        className="flex items-center space-x-2 focus:outline-none active:opacity-80 transition-opacity"
      >
        <div className="bg-amber-500 p-1.5 rounded-md text-slate-900 shadow-sm">
          <Train className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h1 className="text-lg font-extrabold tracking-tight leading-none">{BRAND.name}</h1>
          <p className="text-[9px] text-slate-400 tracking-widest font-medium uppercase mt-0.5">
            Platform {isPro && <span className="ml-2 bg-emerald-500 text-white px-1.5 rounded-full text-[8px] font-bold shadow-glow">PRO</span>}
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
      <div className={`${dims} flex-shrink-0 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm`}>
        <Train className="w-6 h-6 text-amber-500" />
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

// --- TOOLS COMPONENTS ---
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
        You've used your 10 free daily searches. Upgrade to Pro for unlimited Railly AI access.
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

// --- AI CHAT COMPONENT (FULL WIDTH, NO FRAME) ---
const AIChat = ({ contextFilter, className, onPaywall, onConflict }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', text: contextFilter ? `Railly active. Focused on: ${contextFilter.name}` : "Hello! I am Railly. Ask me about 49 CFR regulations." }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const { user } = useUser();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (contextFilter) {
      setMessages(prev => [...prev, { role: 'system', text: `Context switched to: ${contextFilter.name} (Part ${contextFilter.part}).` }]);
    }
  }, [contextFilter]);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setLoading(true);

    try {
      const deviceId = getDeviceId();
      const payload = { 
          query: userMsg, 
          userId: user?.id, 
          deviceId: deviceId 
      };
      if (contextFilter) payload.filterPart = contextFilter.part;

      const res = await fetch(`${ENV.API_URL}/chat`, {
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
                <h3 className="text-sm font-bold text-slate-800">Railly AI</h3>
                <p className="text-[10px] text-slate-500">{contextFilter ? 'Focused Search' : 'Full Compliance Mode'}</p>
            </div>