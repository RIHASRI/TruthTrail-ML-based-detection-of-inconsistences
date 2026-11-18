import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Eye, ShieldAlert } from 'lucide-react';
import SeverityTag from '../components/SeverityTag';
import InconsistencyBadge from '../components/InconsistencyBadge';
import LoadingState from '../components/LoadingState';
import { getEntities } from '../api/client';

const AnalysisResults = ({ onSelectEntity }) => {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEntityList = async () => {
    setLoading(true);
    try {
      const data = await getEntities({
        severity: severity !== 'ALL' ? severity : undefined,
        status: status !== 'ALL' ? status : undefined,
        search: search.trim() || undefined,
        page,
        limit: 15
      });
      setEntities(data.entities || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
    } catch (e) {
      console.error("Failed to load entity analysis results", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntityList();
  }, [severity, status, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEntityList();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Cross-Record Inconsistency Audit</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Filter, search, and inspect flagged entities across disparate dataset sources.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search Name, Entity ID, SSN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </form>

          {/* Severity filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <span className="text-slate-400 hidden sm:inline">Severity:</span>
            {['ALL', 'Critical', 'High', 'Medium', 'Low', 'Clean'].map((sev) => (
              <button
                key={sev}
                onClick={() => { setSeverity(sev); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  severity === sev 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Entity Table */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
          <span>Showing <strong>{entities.length}</strong> of <strong>{totalCount}</strong> unified entity clusters</span>
          <button 
            onClick={fetchEntityList}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Table</span>
          </button>
        </div>

        {loading ? (
          <LoadingState message="Fetching analyzed records..." />
        ) : entities.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto" />
            <p>No entities found matching selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3.5 rounded-l-lg">Entity Cluster ID</th>
                  <th className="p-3.5">Primary Name</th>
                  <th className="p-3.5">National ID</th>
                  <th className="p-3.5">Sources Count</th>
                  <th className="p-3.5">Inconsistency Score</th>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Investigation Status</th>
                  <th className="p-3.5 rounded-r-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {entities.map((ent) => (
                  <tr key={ent.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-indigo-300 font-bold">{ent.unified_entity_id}</td>
                    <td className="p-3.5 font-semibold text-slate-100">{ent.primary_name}</td>
                    <td className="p-3.5 text-slate-400 font-mono">{ent.national_id || 'N/A'}</td>
                    <td className="p-3.5 text-slate-300">{ent.record_count} Records</td>
                    <td className="p-3.5">
                      <InconsistencyBadge score={ent.inconsistency_score} />
                    </td>
                    <td className="p-3.5">
                      <SeverityTag severity={ent.severity} />
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        ent.investigation_status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        ent.investigation_status === 'UNDER_REVIEW' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {ent.investigation_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onSelectEntity(ent.unified_entity_id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30 transition-all font-semibold flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Compare</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <span>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;
