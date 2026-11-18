import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  FileSearch, 
  TrendingUp, 
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend 
} from 'recharts';
import MetricCard from '../components/MetricCard';
import SeverityTag from '../components/SeverityTag';
import InconsistencyBadge from '../components/InconsistencyBadge';
import LoadingState from '../components/LoadingState';
import { getAnalysisSummary, getEntities } from '../api/client';

const Dashboard = ({ onSelectEntity, onNavigateTab }) => {
  const [summary, setSummary] = useState(null);
  const [recentEntities, setRecentEntities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sumData = await getAnalysisSummary();
      setSummary(sumData);

      const entData = await getEntities({ limit: 5 });
      setRecentEntities(entData.entities || []);
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading TruthTrail Analytics Dashboard..." />;

  const severityData = [
    { name: 'Critical (75-100)', count: summary?.critical_count || 0, color: '#EF4444' },
    { name: 'High (50-74)', count: summary?.high_count || 0, color: '#F59E0B' },
    { name: 'Medium (25-49)', count: summary?.medium_count || 0, color: '#EAB308' },
    { name: 'Low (1-24)', count: summary?.low_count || 0, color: '#3B82F6' },
    { name: 'Clean (0)', count: summary?.clean_entities || 0, color: '#10B981' },
  ];

  const errorTypeData = summary?.error_breakdown ? Object.entries(summary.error_breakdown).map(([name, count]) => ({
    name,
    count
  })) : [];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Audit & Verification Dashboard</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Entity Consistency Overview</h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time automated detection of attribute conflicts, date inversions, missing IDs, and Isolation Forest ML anomalies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigateTab('upload')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg glow-indigo flex items-center gap-2"
          >
            <span>Upload Dataset</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard 
          title="Total Unified Entities" 
          value={summary?.total_entities || 0} 
          subtitle="Cross-matched record groups"
          icon={FileSearch} 
          color="indigo"
          trend="Entity resolution active"
        />
        <MetricCard 
          title="Flagged Entities" 
          value={summary?.flagged_entities || 0} 
          subtitle={`${Math.round(((summary?.flagged_entities || 0) / (summary?.total_entities || 1)) * 100)}% of total datasets`}
          icon={AlertTriangle} 
          color="red"
          trend="Requires auditor review"
        />
        <MetricCard 
          title="Critical Inconsistencies" 
          value={summary?.critical_count || 0} 
          subtitle="Score >= 75 / 100"
          icon={ShieldAlert} 
          color="amber"
          trend="Immediate attention needed"
        />
        <MetricCard 
          title="Avg Inconsistency Score" 
          value={`${summary?.average_score || 0} / 100`} 
          subtitle="Overall dataset risk"
          icon={TrendingUp} 
          color="teal"
          trend="Scored via Rules + ML"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution Pie/Bar */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-base font-bold text-slate-100 mb-1">Inconsistency Severity Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">Distribution of entities across risk score buckets</p>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Types Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-base font-bold text-slate-100 mb-1">Detected Error Categories</h3>
          <p className="text-xs text-slate-400 mb-4">Breakdown of rule violations & ML statistical anomalies</p>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorTypeData} layout="vertical" margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Flagged Entities Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Top Flagged Entities for Investigation</h3>
            <p className="text-xs text-slate-400">High risk records requiring cross-source verification</p>
          </div>
          <button 
            onClick={() => onNavigateTab('analysis')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View All Entities</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/50 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-3.5 rounded-l-lg">Entity ID</th>
                <th className="p-3.5">Primary Name</th>
                <th className="p-3.5">National ID</th>
                <th className="p-3.5">Source Records</th>
                <th className="p-3.5">Inconsistency Score</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5 rounded-r-lg text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentEntities.map((ent) => (
                <tr key={ent.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono text-indigo-300 font-bold">{ent.unified_entity_id}</td>
                  <td className="p-3.5 font-medium text-slate-100">{ent.primary_name}</td>
                  <td className="p-3.5 text-slate-400 font-mono">{ent.national_id || 'N/A'}</td>
                  <td className="p-3.5 text-slate-300">{ent.record_count} Sources</td>
                  <td className="p-3.5">
                    <InconsistencyBadge score={ent.inconsistency_score} />
                  </td>
                  <td className="p-3.5">
                    <SeverityTag severity={ent.severity} />
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onSelectEntity(ent.unified_entity_id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30 transition-all font-semibold"
                    >
                      Compare Records
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
