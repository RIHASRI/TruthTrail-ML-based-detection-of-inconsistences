import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Sliders, Activity, CheckCircle, AlertOctagon, Target } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import MetricCard from '../components/MetricCard';
import LoadingState from '../components/LoadingState';
import { runEvaluation } from '../api/client';

const ModelEvaluation = () => {
  const [numEntities, setNumEntities] = useState(60);
  const [inconsistencyRate, setInconsistencyRate] = useState(0.35);
  const [threshold, setThreshold] = useState(25);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleRunBenchmark = async () => {
    setLoading(true);
    try {
      const data = await runEvaluation(numEntities, inconsistencyRate, threshold);
      setResults(data);
    } catch (e) {
      console.error("Failed to run evaluation benchmark", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunBenchmark();
  }, []);

  const metrics = results?.metrics || {};
  const cm = results?.confusion_matrix || {};
  const roc = results?.roc_curve || [];
  const pr = results?.pr_curve || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <span>ML Model Evaluation & Synthetic Benchmark</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate precision, recall, F1-score, and ROC curve performance of rule-based validation + Isolation Forest ML pipeline against ground truth.
          </p>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg glow-indigo disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? "Simulating Benchmark..." : "Run ML Benchmark"}</span>
        </button>
      </div>

      {/* Control Parameters */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Synthetic Benchmark Parameters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Entity Count */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-semibold">Test Entities Count:</span>
              <span className="font-mono text-indigo-300 font-bold">{numEntities} Entities</span>
            </div>
            <input 
              type="range" min="20" max="200" step="10"
              value={numEntities}
              onChange={(e) => setNumEntities(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Anomaly Rate */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-semibold">Synthetic Anomaly Injection Rate:</span>
              <span className="font-mono text-teal-300 font-bold">{Math.round(inconsistencyRate * 100)}%</span>
            </div>
            <input 
              type="range" min="0.10" max="0.75" step="0.05"
              value={inconsistencyRate}
              onChange={(e) => setInconsistencyRate(Number(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer"
            />
          </div>

          {/* Decision Cutoff Threshold */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-semibold">Flag Cutoff Score Threshold:</span>
              <span className="font-mono text-amber-300 font-bold">{threshold} / 100</span>
            </div>
            <input 
              type="range" min="10" max="80" step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Executing Isolation Forest synthetic benchmark..." />
      ) : (
        <>
          {/* Performance Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard 
              title="Precision Score" 
              value={`${Math.round((metrics.precision || 0) * 100)}%`} 
              subtitle="True Positive Accuracy ratio"
              icon={Target} 
              color="teal"
              trend="TP / (TP + FP)"
            />
            <MetricCard 
              title="Recall Score" 
              value={`${Math.round((metrics.recall || 0) * 100)}%`} 
              subtitle="Detected Inconsistency Coverage"
              icon={Activity} 
              color="indigo"
              trend="TP / (TP + FN)"
            />
            <MetricCard 
              title="F1-Score (Harmonic Mean)" 
              value={`${Math.round((metrics.f1_score || 0) * 100)}%`} 
              subtitle="Overall Model Balance"
              icon={CheckCircle} 
              color="amber"
              trend="2 * (P * R) / (P + R)"
            />
            <MetricCard 
              title="Overall Accuracy" 
              value={`${Math.round((metrics.accuracy || 0) * 100)}%`} 
              subtitle="Clean & Anomaly Correct Predictions"
              icon={Cpu} 
              color="red"
              trend="Correct / Total"
            />
          </div>

          {/* Confusion Matrix & ROC Curves */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-base font-bold text-slate-100 mb-1">Confusion Matrix</h3>
              <p className="text-xs text-slate-400 mb-4">True/False prediction counts against ground truth</p>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-xs font-semibold text-emerald-400 uppercase">True Positive (TP)</p>
                  <p className="text-3xl font-black text-emerald-300 mt-1">{cm.tp || 0}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Correctly Flagged Inconsistencies</p>
                </div>

                <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-xs font-semibold text-red-400 uppercase">False Positive (FP)</p>
                  <p className="text-3xl font-black text-red-300 mt-1">{cm.fp || 0}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Clean Records Incorrectly Flagged</p>
                </div>

                <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-xs font-semibold text-amber-400 uppercase">False Negative (FN)</p>
                  <p className="text-3xl font-black text-amber-300 mt-1">{cm.fn || 0}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Missed Real Inconsistencies</p>
                </div>

                <div className="p-5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                  <p className="text-xs font-semibold text-indigo-400 uppercase">True Negative (TN)</p>
                  <p className="text-3xl font-black text-indigo-300 mt-1">{cm.tn || 0}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Correctly Identified Clean Records</p>
                </div>
              </div>
            </div>

            {/* ROC Curve Chart */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-base font-bold text-slate-100 mb-1">Receiver Operating Characteristic (ROC)</h3>
              <p className="text-xs text-slate-400 mb-4">True Positive Rate (TPR) vs False Positive Rate (FPR)</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={roc} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="fpr" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
                    />
                    <Area type="monotone" dataKey="tpr" stroke="#2DD4BF" fill="#14B8A6" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ModelEvaluation;
