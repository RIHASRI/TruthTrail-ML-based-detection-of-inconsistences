import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { getHealth, loadSampleDataset } from '../api/client';

const Navbar = ({ onRefreshData }) => {
  const [health, setHealth] = useState(null);
  const [loadingSample, setLoadingSample] = useState(false);

  const checkServerHealth = async () => {
    try {
      const data = await getHealth();
      setHealth(data.status === 'ok');
    } catch {
      setHealth(false);
    }
  };

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReloadSample = async () => {
    setLoadingSample(true);
    try {
      await loadSampleDataset(50, 0.35);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error('Failed to load sample dataset:', e);
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center glow-indigo">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-lg text-slate-50 tracking-tight">TruthTrail</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
              v1.0 ML Audit
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Cross-Record Inconsistency & Anomaly Detector</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Backend API status */}
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          {health ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">FastAPI API Connected</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-slate-400">Offline / Connecting...</span>
            </>
          )}
        </div>

        {/* Reload synthetic dataset button */}
        <button
          onClick={handleReloadSample}
          disabled={loadingSample}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all disabled:opacity-50"
        >
          <Database className={`w-3.5 h-3.5 ${loadingSample ? 'animate-spin' : ''}`} />
          <span>{loadingSample ? 'Reloading Sample...' : 'Reset Sample Data'}</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
