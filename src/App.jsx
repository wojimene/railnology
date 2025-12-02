import React, { useState, useEffect, useMemo } from 'react';
import { 
  Train, Globe, BookOpen, Briefcase, Wrench, Lock, Search, 
  ChevronRight, Calculator, AlertTriangle, ArrowRight, Star, 
  Zap, Menu, X, Eye, RotateCcw, Filter, Loader2, WifiOff, ServerCrash,
  PlusCircle, Save, CheckCircle, Database
} from 'lucide-react';

// --- CONFIGURATION ---
// ⚠️ DEPLOYMENT INSTRUCTION:
// When pushing to Vercel, UNCOMMENT the line below starting with 'import.meta.env'
// and COMMENT OUT the line 'const API_URL = "http://localhost:5000/api";'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
//const API_URL = "http://localhost:5000/api";

// --- Branding Constants ---
const BRAND = {
  name: "Railnology",
  domain: "railnology.com",
  color: "bg-slate-900", 
  accent: "text-amber-500" 
};

// --- FALLBACK DATA (For Offline/Demo Mode) ---
const FALLBACK_JOBS = [
  { id: 1, title: "Senior Locomotive Engineer", company: "BNSF Railway", location: "Fort Worth, TX", salary: "$95k - $125k", category: "Field", tags: ["Sign-on Bonus", "Union"] },
  { id: 2, title: "Track Inspector (Geometry)", company: "Canadian National", location: "Chicago, IL", salary: "$36/hr + Benefits", category: "Engineering", tags: ["Urgent", "Travel Required"] },
  { id: 3, title: "Rail Systems Manager", company: "Brightline West", location: "Las Vegas, NV", salary: "$130k - $160k", category: "Management", tags: ["High Speed Rail", "New Project"] },
];

const FALLBACK_GLOSSARY = [
  { term: "Pantograph", def: "An apparatus mounted on the roof of an electric train to collect power through contact with an overhead catenary wire.", hasVisual: true, visualTag: "pantograph mechanism diagram" },
  { term: "Bogie (Truck)", def: "A chassis or framework carrying wheels, attached to a vehicle, serving as a modular subassembly of wheels and axles.", hasVisual: true, visualTag: "train bogie suspension diagram" },
];

const FALLBACK_SIGNALS = [
  { id: 'clear', colors: ['G', 'R', 'R'], name: 'Clear', rule: 'Proceed at track speed.' },
  { id: 'approach', colors: ['Y', 'R', 'R'], name: 'Approach', rule: 'Proceed preparing to stop at next signal.' },
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

const Header = ({ title, isAdmin, toggleAdmin, isOffline }) => (
  <div className={`${BRAND.color} text-white p-4 sticky top-0 z-50 shadow-md`}>
    {isOffline && (
      <div className="absolute top-0 left-0 right-0 bg-amber-500 text-slate-900 text-[10px] font-bold text-center py-0.5">
        OFFLINE / DEMO MODE
      </div>
    )}
    <div className={`flex justify-between items-center ${isOffline ? 'mt-2' : ''}`}>
      <div className="flex items-center space-x-2">
        <div className={`p-1.5 rounded-md text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.5)] ${isAdmin ? 'bg-red-500' : 'bg-amber-500'}`}>
          <Train className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight leading-none">{isAdmin ? "ADMIN PANEL" : BRAND.name}</h1>
          <p className="text-[9px] text-slate-400 tracking-widest font-medium">EST. 2025</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button onClick={toggleAdmin} className={`${isAdmin ? 'text-red-400' : 'text-slate-600 hover:text-white'} transition`}>
           <Lock className="w-4 h-4" />
        </button>
        <div className="bg-slate-800 border border-slate-700 w-8 h-8 rounded-full flex items-center justify-center">
           <Menu className="w-4 h-4 text-slate-300" />
        </div>
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
  const [termForm, setTermForm] = useState({ term: '', def: '', hasVisual: false, visualTag: '' });
  
  const handleSubmit = async () => {
    if (isOffline) {
      alert("Cannot save data in Demo Mode. Please connect to the local server.");
      return;
    }

    setStatus(null);
    let endpoint = '';
    let body = {};

    if (mode === 'job') {
      endpoint = '/jobs';
      body = { ...jobForm, tags: ["New"] };
    } else if (mode === 'term') {
      endpoint = '/glossary';
      body = termForm;
    }

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
      setTermForm({ term: '', def: '', hasVisual: false, visualTag: '' });

    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="pb-20 px-4 pt-6 bg-slate-50 min-h-full">
      <SectionTitle title="Content Management" subtitle={isOffline ? "Server Disconnected." : "Add new data to MongoDB."} />
      
      {isOffline && (
        <div className="mb-6 bg-amber-100 text-amber-800 p-4 rounded-xl border border-amber-200 flex items-start text-xs">
          <WifiOff className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Offline Mode Active.</strong>
            <br/>You cannot add new data until the backend server is running on localhost:5000.
          </div>
        </div>
      )}

      {/* Mode Switcher */}
      <div className={`flex bg-white p-1 rounded-xl border border-slate-200 mb-6 ${isOffline ? 'opacity-50 pointer-events-none' : ''}`}>
        {['job', 'term'].map(m => (
          <button 
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition ${mode === m ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Add {m}
          </button>
        ))}
      </div>

      <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 ${isOffline ? 'opacity-50 pointer-events-none' : ''}`}>
        {mode === 'job' && (
          <>
            <AdminInput label="Job Title" placeholder="e.g. Conductor" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} />
            <AdminInput label="Company" placeholder="e.g. CSX" value={jobForm.company} onChange={e => setJobForm({...jobForm, company: e.target.value})} />
            <AdminInput label="Location" placeholder="e.g. Jacksonville, FL" value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} />
            <AdminInput label="Salary" placeholder="e.g. $80k" value={jobForm.salary} onChange={e => setJobForm({...jobForm, salary: e.target.value})} />
            <div className="mb-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm"
                value={jobForm.category}
                onChange={e => setJobForm({...jobForm, category: e.target.value})}
              >
                <option>Field</option>
                <option>Engineering</option>
                <option>Management</option>
                <option>Office</option>
              </select>
            </div>
          </>
        )}

        {mode === 'term' && (
          <>
            <AdminInput label="Term" placeholder="e.g. Ballast" value={termForm.term} onChange={e => setTermForm({...termForm, term: e.target.value})} />
            <div className="mb-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Definition</label>
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 h-24"
                placeholder="Explain the term..."
                value={termForm.def}
                onChange={e => setTermForm({...termForm, def: e.target.value})}
              ></textarea>
            </div>
          </>
        )}

        <button 
          onClick={handleSubmit}
          disabled={isOffline}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-emerald-700 transition flex items-center justify-center mt-4 disabled:bg-gray-300"
        >
          <Save className="w-4 h-4 mr-2" /> Save to Database
        </button>

        {status === 'success' && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center text-emerald-700 text-xs font-bold">
            <CheckCircle className="w-4 h-4 mr-2" /> Successfully added!
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center text-red-700 text-xs font-bold">
            <X className="w-4 h-4 mr-2" /> Error saving data. Check server console.
          </div>
        )}
      </div>
    </div>
  );
};

// --- Standard Views & Utilities ---

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-slate-400">
    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
    <p className="text-xs font-bold uppercase tracking-widest">Connecting...</p>
  </div>
);

const ErrorScreen = ({ msg }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-slate-400 px-6 text-center">
    <ServerCrash className="w-12 h-12 text-slate-300 mb-4" />
    <p className="text-sm font-bold text-slate-600 mb-2">Server Connection Failed</p>
    <p className="text-xs leading-relaxed max-w-[280px] mx-auto">{msg}</p>
    <div className="mt-6 bg-slate-100 p-4 rounded-xl text-left border border-slate-200 w-full max-w-sm">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Troubleshooting:</p>
      <ul className="text-[11px] text-slate-600 space-y-2 list-disc list-inside">
        <li>Ensure <strong>server.js</strong> is running (<code className="bg-slate-200 px-1 rounded">node server/server.js</code>).</li>
        <li>Check if MongoDB is connected in the server terminal.</li>
        <li>Verify port 5000 is open.</li>
      </ul>
    </div>
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
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => changeTab('learn')} className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md text-white p-3 rounded-xl flex flex-col items-start transition">
            <BookOpen className="w-5 h-5 mb-2 text-amber-400" /><span className="text-xs font-bold">Visual Library</span>
          </button>
          <button onClick={() => changeTab('tools')} className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md text-white p-3 rounded-xl flex flex-col items-start transition">
            <Wrench className="w-5 h-5 mb-2 text-sky-400" /><span className="text-xs font-bold">Tools</span>
          </button>
        </div>
      </div>
    </div>

    <div className="mt-8 px-4">
      <div className="flex justify-between items-end mb-4">
        <SectionTitle title="Recent Listings" subtitle="Top-tier opportunities." />
        <button onClick={() => changeTab('jobs')} className="text-xs font-bold text-amber-600 flex items-center mb-5">
          View All <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </div>
      
      <div className="space-y-3">
        {jobs && jobs.length > 0 ? jobs.slice(0, 3).map((job) => (
          <div key={job._id || job.id || Math.random()} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{job.title}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{job.company}</p>
              <div className="flex gap-2 mt-2">
                {job.tags && job.tags.slice(0, 2).map(t => (
                  <span key={t} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium border border-slate-200">{t}</span>
                ))}
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{job.salary ? job.salary.split(' ')[0] : 'DOE'}</span>
          </div>
        )) : (
          <div className="text-center p-4 text-slate-400 text-xs italic">
            No jobs available.
          </div>
        )}
      </div>
    </div>
  </div>
);

const LearnView = ({ glossary }) => {
  const [term, setTerm] = useState('');
  
  const filtered = useMemo(() => 
    glossary.filter(g => {
      const t = g.term || '';
      const d = g.def || '';
      return t.toLowerCase().includes(term.toLowerCase()) || d.toLowerCase().includes(term.toLowerCase());
    }),
  [term, glossary]);

  const VisualCard = ({ item }) => (
    <div className="mt-3 bg-slate-50 rounded-lg border border-slate-200 p-3">
      <div className="flex items-center text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
        <Eye className="w-3 h-3 mr-1.5" /> Visual Reference
      </div>
      <div className="bg-white p-4 rounded border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
         <div className="text-slate-400 text-xs italic mb-2">Generating schematic for:</div>
         <div className="font-bold text-slate-700">{item.visualTag}</div>
         <div className="hidden"></div>
      </div>
    </div>
  );

  return (
    <div className="pb-20 px-4 pt-6 bg-slate-50 min-h-full">
      <SectionTitle title="Visual Dictionary" subtitle="Technical definitions & schematics." />
      <div className="relative mb-6">
        <input type="text" placeholder="Search (e.g., Pantograph)..." className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={term} onChange={(e) => setTerm(e.target.value)} />
        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
      </div>
      <div className="space-y-4">
        {filtered.length > 0 ? filtered.map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{item.term}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.def}</p>
              </div>
            </div>
            {item.hasVisual && <VisualCard item={item} />}
          </div>
        )) : <div className="text-center p-4 text-slate-400 text-xs italic">No terms found.</div>}
      </div>
    </div>
  );
};

const JobsView = ({ jobs }) => {
  const [filter, setFilter] = useState('All');
  
  const filteredJobs = useMemo(() => {
    if (filter === 'All') return jobs;
    return jobs.filter(job => job.category === filter);
  }, [filter, jobs]);

  const FilterPill = ({ name }) => (
    <button onClick={() => setFilter(name)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === name ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
      {name}
    </button>
  );

  return (
    <div className="pb-20 px-4 pt-6 bg-slate-50 min-h-full">
      <SectionTitle title="Career Opportunities" subtitle="Find your next role in rail." />
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        <FilterPill name="All" /><FilterPill name="Field" /><FilterPill name="Engineering" /><FilterPill name="Management" /><FilterPill name="Office" />
      </div>
      <div className="space-y-3">
        {filteredJobs.length > 0 ? filteredJobs.map((job) => (
          <div key={job._id || job.id || Math.random()} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800">{job.title}</h3>
                <p className="text-xs font-medium text-slate-500">{job.company}</p>
              </div>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">{job.category}</span>
            </div>
            <div className="flex items-center text-xs text-slate-400 mt-2 mb-3">
              <Globe className="w-3 h-3 mr-1" /> {job.location}
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
              <span className="text-emerald-600 font-bold text-sm">{job.salary}</span>
              <button className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">Apply</button>
            </div>
          </div>
        )) : <div className="text-center py-10 text-slate-400"><p>No jobs found in this category.</p></div>}
      </div>
      <p className="text-center text-xs text-slate-300 mt-8 mb-4">Jobs refreshed daily via RailRecruit™ API</p>
    </div>
  );
};

// --- Signal Tool Components ---
const LightButton = ({ color, isActive, onClick }) => {
  const bg = isActive 
    ? (color === 'G' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] border-emerald-400' 
      : color === 'Y' ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] border-amber-300' 
      : 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)] border-red-500')
    : 'bg-slate-800 border-slate-700 opacity-40';
  return <button onClick={onClick} className={`w-10 h-10 rounded-full border-4 transition-all duration-300 ${bg}`} />;
};

const SignalHead = ({ position, selected, onChange }) => (
  <div className="flex flex-col items-center space-y-2 bg-slate-900 p-3 rounded-lg border border-slate-800 shadow-inner">
    <span className="text-[9px] text-slate-500 font-bold uppercase">{position}</span>
    <LightButton color="G" isActive={selected === 'G'} onClick={() => onChange('G')} />
    <LightButton color="Y" isActive={selected === 'Y'} onClick={() => onChange('Y')} />
    <LightButton color="R" isActive={selected === 'R'} onClick={() => onChange('R')} />
  </div>
);

const ToolsView = ({ signalAspects }) => {
  const [showPremium, setShowPremium] = useState(false);
  const [speed, setSpeed] = useState(120);
  const [signalState, setSignalState] = useState(['R', 'R', 'R']);

  // Fallback if DB is empty to prevent crash
  const safeSignals = signalAspects && signalAspects.length > 0 ? signalAspects : [
     { id: 'stop', colors: ['R', 'R', 'R'], name: 'Stop', rule: 'Stop.' }
  ];

  const decodedSignal = useMemo(() => {
    return safeSignals.find(s => 
      s.colors && s.colors[0] === signalState[0] && 
      s.colors[1] === signalState[1] && 
      s.colors[2] === signalState[2]
    );
  }, [signalState, safeSignals]);

  const updateSignal = (index, color) => {
    const newState = [...signalState];
    newState[index] = color;
    setSignalState(newState);
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-full">
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
      <div className="px-4 pt-6">
        <SectionTitle title="Engineer's Toolkit" subtitle="Field utilities for rail professionals." />
        <div className="space-y-6">
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800">Signal Decoder</h3>
              </div>
              <button onClick={() => setSignalState(['R','R','R'])} className="text-xs text-slate-400 flex items-center hover:text-amber-600">
                <RotateCcw className="w-3 h-3 mr-1" /> Reset
              </button>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex flex-col gap-2 bg-slate-800 p-2 rounded-xl shadow-lg border border-slate-700">
                <SignalHead position="Top" selected={signalState[0]} onChange={(c) => updateSignal(0, c)} />
                <SignalHead position="Mid" selected={signalState[1]} onChange={(c) => updateSignal(1, c)} />
                <SignalHead position="Bot" selected={signalState[2]} onChange={(c) => updateSignal(2, c)} />
              </div>
              <div className="flex-1 pt-2">
                <div className="mb-4">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Aspect Name</div>
                  <div className={`text-xl font-extrabold leading-tight ${decodedSignal ? 'text-slate-900' : 'text-slate-300 italic'}`}>
                    {decodedSignal ? decodedSignal.name : "Invalid Aspect"}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Rule / Indication</div>
                  <div className="text-sm text-slate-600 leading-relaxed font-medium">
                    {decodedSignal ? decodedSignal.rule : "This combination does not match a standard rule in your selected database."}
                  </div>
                </div>
                {decodedSignal && decodedSignal.id === 'stop' && (
                  <div className="mt-3 flex items-center text-red-600 text-xs font-bold bg-red-50 p-2 rounded border border-red-100">
                     <AlertTriangle className="w-3 h-3 mr-2" /> Absolute Stop Required
                  </div>
                )}
              </div>
            </div>
            {decodedSignal && <div className="hidden"></div>}
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center space-x-2 mb-4">
              <Calculator className="w-5 h-5 text-indigo-500" /><h3 className="font-bold text-slate-800">Velocity Converter</h3>
            </div>
            <div className="flex items-end space-x-2 mb-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Km/h</label>
                <input type="number" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full text-2xl font-bold text-slate-900 border-b-2 border-slate-200 focus:border-amber-500 focus:outline-none py-1" />
              </div>
              <div className="flex-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">MPH</label>
                 <div className="text-2xl font-bold text-slate-500 border-b-2 border-transparent py-1">{(speed * 0.621371).toFixed(1)}</div>
              </div>
            </div>
          </div>
           <div onClick={() => setShowPremium(true)} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group cursor-pointer">
            <div className="flex justify-between items-start mb-2 opacity-50">
              <div className="flex items-center space-x-2"><Wrench className="w-5 h-5 text-slate-800" /><h3 className="font-bold text-slate-800">Axle Load Calculator</h3></div>
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-400 mb-3 opacity-50">Compute weight distribution per bogie for heavy haul freight.</p>
             <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition duration-300">
               <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition">Unlock Tool</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Shell ---

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ jobs: [], glossary: [], signals: [] });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setIsOffline(false);
    
    try {
      // Short timeout to fallback quickly if server is down
     // Change 2000 to 15000
	const timeoutPromise = new Promise((_, reject) => 
	  setTimeout(() => reject(new Error('Timeout')), 15000)
	);

      const [jobsRes, glossaryRes, signalsRes] = await Promise.race([
        Promise.all([
          fetch(`${API_URL}/jobs`),
          fetch(`${API_URL}/glossary`),
          fetch(`${API_URL}/signals`)
        ]),
        timeoutPromise
      ]);

      if (!jobsRes.ok) throw new Error('Failed to connect to API server.');

      setData({
        jobs: await jobsRes.json(),
        glossary: await glossaryRes.json(),
        signals: await signalsRes.json()
      });
    } catch (err) {
      console.warn("API Unavailable, switching to demo mode.");
      setIsOffline(true);
      setData({
        jobs: FALLBACK_JOBS,
        glossary: FALLBACK_GLOSSARY,
        signals: FALLBACK_SIGNALS
      });
    } finally {
      setLoading(false);
    }
  };

  // FETCH ON MOUNT
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center font-sans">
      <div className="w-full max-w-md h-full min-h-screen bg-slate-50 shadow-2xl relative flex flex-col">
        <Header 
          title={BRAND.name} 
          isAdmin={isAdmin} 
          toggleAdmin={() => setIsAdmin(!isAdmin)}
          isOffline={isOffline}
        />
        
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {isAdmin ? (
            <AdminView refreshData={fetchData} isOffline={isOffline} />
          ) : (
            loading ? <LoadingScreen /> : (
              <>
                {activeTab === 'home' && <HomeView changeTab={setActiveTab} jobs={data.jobs} />}
                {activeTab === 'learn' && <LearnView glossary={data.glossary} />}
                {activeTab === 'tools' && <ToolsView signalAspects={data.signals} />}
                {activeTab === 'jobs' && <JobsView jobs={data.jobs} />} 
              </>
            )
          )}
        </div>

        {!isAdmin && (
          <div className="bg-white border-t border-slate-200 px-4 pb-safe sticky bottom-0 z-50">
            <div className="flex justify-between items-center h-16">
              <TabButton active={activeTab} id="home" icon={Train} label="Home" onClick={setActiveTab} />
              <TabButton active={activeTab} id="learn" icon={BookOpen} label="Library" onClick={setActiveTab} />
              <TabButton active={activeTab} id="tools" icon={Wrench} label="Tools" onClick={setActiveTab} />
              <TabButton active={activeTab} id="jobs" icon={Briefcase} label="Jobs" onClick={setActiveTab} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;