import React, { useState, useEffect, useRef } from 'react';
import { 
  Train, Globe, BookOpen, Briefcase, Wrench, Lock, Search, 
  ChevronRight, Calculator, AlertTriangle, ArrowRight, Star, 
  Zap, Menu, X, Eye, RotateCcw, Filter, Loader2, WifiOff, ServerCrash,
  PlusCircle, Save, CheckCircle, Database, LogIn, User, Image as ImageIcon, 
  Video, CreditCard, Unlock, FileText, Scale, ScrollText, Shield, UserCircle, 
  Building2, LayoutDashboard, Edit3, MapPin, Plus, Trash2, ExternalLink, 
  ArrowLeft, BarChart3, Calendar, Users, AlertCircle, History, Clock, Bot, Send,
  Play, Radio
} from 'lucide-react';

// ==========================================
// 1. AUTHENTICATION (PRODUCTION SWITCH)
// ==========================================

/* [PRODUCTION INSTRUCTION]: 
   When deploying to Render/Vercel:
   1. UNCOMMENT the import below.
   2. DELETE the "PREVIEW SHIM" block entirely.
*/

// import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

/* --- START: PREVIEW SHIM (Keep this for Preview, Delete for Production) --- */
const ClerkProvider = ({ children }) => <>{children}</>;
const SignedIn = ({ children }) => <>{children}</>;
const SignedOut = ({ children }) => null;
const SignInButton = () => <button>Sign In</button>;
const UserButton = () => <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">US</div>;
const useUser = () => ({ 
  isSignedIn: true, 
  user: { 
    id: "user_123", 
    fullName: "Rail Pro", 
    primaryEmailAddress: { emailAddress: "demo@railnology.com" } 
  } 
});

// Safe Environment Variable Access for Preview
const getEnv = (key, fallback) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || fallback;
    }
  } catch (e) {}
  return fallback;
};
/* --- END: PREVIEW SHIM --- */


// ==========================================
// 2. CONFIGURATION & ENVIRONMENT
// ==========================================

const ENV = {
  API_URL: getEnv('VITE_API_URL', 'https://api.railnology.com'),
  CLERK_KEY: getEnv('VITE_CLERK_KEY', 'pk_test_placeholder'), 
  STRIPE_LINK: getEnv('VITE_STRIPE_PAYMENT_LINK', '#'),
  ADMIN_EMAIL: getEnv('VITE_ADMIN_EMAIL', 'wayne@railnology.com')
};

const BRAND = {
  name: "Railnology",
  domain: "railnology.com",
  color: "bg-slate-900", 
  accent: "text-amber-500" 
};

// ==========================================
// 3. HELPER FUNCTIONS
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
// 4. SUB-COMPONENTS
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

const Header = ({ isOffline, isPro, onProfileClick }) => (
  <div className={`${BRAND.color} text-white p-4 sticky top-0 z-50 shadow-md flex-shrink-0`}>
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <div className="bg-amber-500 p-1.5 rounded-md text-slate-900 shadow-sm">
          <Train className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">{BRAND.name}</h1>
          <p className="text-[9px] text-slate-400 tracking-widest font-medium uppercase">
            Platform {isPro && <span className="ml-2 bg-emerald-500 text-white px-1.5 rounded-full text-[8px] font-bold shadow-glow">PRO</span>}
          </p>
        </div>
      </div>
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

// --- AI CHAT COMPONENT (FULL WIDTH, NO FRAME) ---
const AIChat = ({ contextFilter, className }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', text: contextFilter ? `Railly active. Focused on: ${contextFilter.name}` : "Hello! I am Railly. Ask me about 49 CFR regulations." }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

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
      const payload = { query: userMsg };
      if (contextFilter) {
        payload.filterPart = contextFilter.part;
      }

      const res = await fetch(`${ENV.API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
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
          </div>
       </div>

       {/* Chat Area - FULL WIDTH, NO FRAME FOR AI */}
       <div className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth scrollbar-thin">
         {messages.map((m, i) => (
           <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start w-full'}`}>
              <div className={`text-sm leading-relaxed ${
                  m.role === 'user' 
                  ? 'max-w-[85%] p-3.5 rounded-2xl bg-slate-900 text-white rounded-br-none shadow-sm' 
                  : 'w-full text-slate-800 pl-1' // UPDATED: Full width, simple text for Railly
              }`}>
                 <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
              
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 w-full justify-start pl-1">
                  {m.sources.map((source, idx) => (
                    <a 
                      key={idx}
                      href={`https://www.ecfr.gov/current/title-49/part-${source.part}/section-${source.part}.${source.section}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full hover:bg-emerald-100 transition"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      § {source.part}.{source.section}
                    </a>
                  ))}
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
         <div ref={scrollRef} className="h-1" />
       </div>

       <div className="p-3 border-t border-slate-200 bg-white flex-shrink-0">
         <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            <input 
              className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-slate-700 placeholder-slate-400"
              placeholder={contextFilter ? `Ask about ${contextFilter.name}...` : "Ask Railly..."}
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
const LibraryView = () => {
    const [selectedContext, setSelectedContext] = useState(null);

    const manuals = [
        { id: '213', name: 'Track Safety', icon: Train, color: 'bg-emerald-500', part: 213 },
        { id: '236', name: 'Signals', icon: Zap, color: 'bg-amber-500', part: 236 },
        { id: '229', name: 'Locomotives', icon: Wrench, color: 'bg-blue-500', part: 229 },
        { id: '217', name: 'Ops Rules', icon: BookOpen, color: 'bg-indigo-500', part: 217 },
        { id: '214', name: 'Workplace', icon: Shield, color: 'bg-rose-500', part: 214 },
        { id: '219', name: 'Drug/Alcohol', icon: AlertTriangle, color: 'bg-purple-500', part: 219 },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* 1. TOP SECTION: MANUALS GRID (AUTO HEIGHT) */}
            {/* flex-shrink-0 ensures this section sizes to its content and doesn't shrink */}
            <div className="flex-shrink-0 px-4 pt-4 pb-4 bg-white border-b border-slate-100 z-10">
                <SectionTitle title="Library" subtitle="AI Research & Manuals" />
                <div className="grid grid-cols-3 gap-4 mb-2">
                    {/* "All" Button */}
                    <button 
                        onClick={() => setSelectedContext(null)}
                        className={`flex flex-col items-center transition-all ${selectedContext === null ? 'opacity-100' : 'opacity-50'}`}
                    >
                        <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center shadow-md mb-1 border border-slate-700 active:scale-95 transition-transform">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">All</span>
                    </button>

                    {/* Display ALL manuals (No slicing) to populate the rows */}
                    {manuals.map(m => (
                        <button 
                            key={m.id}
                            onClick={() => setSelectedContext(selectedContext?.id === m.id ? null : m)}
                            className={`flex flex-col items-center transition-all ${
                                selectedContext?.id === m.id ? 'opacity-100' : selectedContext ? 'opacity-40' : 'opacity-100'
                            }`}
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
            {/* flex-1 ensures it expands to fill the rest of the screen height */}
            <div className="flex-1 min-h-0 relative border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                <AIChat contextFilter={selectedContext} className="h-full" />
            </div>
        </div>
    );
};

// --- STANDARD VIEWS ---
const AdminView = () => <div className="p-4 bg-white m-4 rounded shadow">Admin Panel</div>;
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

const HomeView = ({ changeTab, jobs, onJobClick }) => (
    <div className="pb-24">
        <div className="px-4 mt-6">
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

// --- MAIN CONTENT ---
const MainContent = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ jobs: [], glossary: [], signals: [] });
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [mongoUser, setMongoUser] = useState(null);
  const { user, isSignedIn } = useUser();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [j, g, si] = await Promise.all([
        fetch(`${ENV.API_URL}/jobs`).then(r => r.ok ? r.json() : []),
        fetch(`${ENV.API_URL}/glossary`).then(r => r.ok ? r.json() : []),
        fetch(`${ENV.API_URL}/signals`).then(r => r.ok ? r.json() : [])
      ]);
      setData({ jobs: j, glossary: g, signals: si });
    } catch (e) { 
      console.error("API Fetch Error:", e);
      setData({ jobs: [], glossary: [], signals: [] });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  
  useEffect(() => {
    if (isSignedIn && user) {
        fetch(`${ENV.API_URL}/users/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            clerkId: user.id, 
            email: user.primaryEmailAddress.emailAddress, 
            fullName: user.fullName 
          })
        })
        .then(res => res.json())
        .then(setMongoUser)
        .catch(err => console.error("User sync failed:", err));
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    if (window.location.search.includes('payment=success') || localStorage.getItem('railnology_pro')) setIsPro(true);
  }, []);

  const ADMIN = ENV.ADMIN_EMAIL;
  if (selectedJob) return <JobDetailView job={selectedJob} onBack={() => setSelectedJob(null)} />;

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center font-sans overflow-hidden">
      {/* GLOBAL STYLES FOR THIN SCROLLBAR */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 3px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      
      {/* Mobile Constraint Container */}
      <div className="w-full max-w-[480px] h-screen bg-slate-50 shadow-2xl relative flex flex-col border-x border-slate-200">
        <Header onProfileClick={() => setActiveTab('profile')} isOffline={false} isPro={isPro} />
        
        {/* Main View Area - Handles Scrolling Logic */}
        <div className={`flex-1 overflow-hidden relative flex flex-col`}>
          {activeTab === 'home' && (
             <div className="flex-1 overflow-y-auto scrollbar-hide">
                {isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN && <AdminView refreshData={fetchData} />}
                <HomeView changeTab={setActiveTab} jobs={data.jobs} onJobClick={setSelectedJob} />
             </div>
          )}
          {activeTab === 'jobs' && (
             <div className="flex-1 overflow-y-auto scrollbar-hide">
                <JobsView jobs={data.jobs} onJobClick={setSelectedJob} />
             </div>
          )}
          
          {/* Library View handles its own scrolling (split screen) */}
          {activeTab === 'learn' && <LibraryView />}
          
          {activeTab === 'company' && mongoUser?.role === 'company' && <div className="flex-1 overflow-y-auto"><CompanyView user={user} mongoUser={mongoUser} refreshData={fetchData} /></div>}
          {activeTab === 'profile' && isSignedIn && <div className="flex-1 overflow-y-auto"><ProfileView user={user} mongoUser={mongoUser} refreshProfile={() => {}} /></div>}
          {activeTab === 'tools' && <div className="flex-1 overflow-y-auto"><ToolsView signalAspects={data.signals} isPro={isPro} onUnlock={() => setShowPaywall(true)} /></div>}
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white/90 backdrop-blur-lg border-t border-slate-200 px-6 pb-safe sticky bottom-0 z-50 flex-shrink-0">
            <div className="flex justify-between items-center h-20">
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