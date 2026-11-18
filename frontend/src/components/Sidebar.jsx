import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  SearchCode, 
  GitCompare, 
  Cpu, 
  FileText 
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Data Upload', icon: UploadCloud },
  { id: 'analysis', label: 'Analysis Results', icon: SearchCode },
  { id: 'comparison', label: 'Record Comparison', icon: GitCompare },
  { id: 'evaluation', label: 'Model Evaluation', icon: Cpu },
  { id: 'reports', label: 'Audit Reports', icon: FileText },
];

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-900/50 p-4 flex flex-col justify-between shrink-0">
      <nav className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Auditing Engine
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg glow-indigo'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800/80 text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <span>Engine Status</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Isolation Forest & RapidFuzz models active.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
