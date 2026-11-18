import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Send, 
  AlertTriangle,
  ArrowLeft,
  Search,
  Check,
  X
} from 'lucide-react';
import InconsistencyBadge from '../components/InconsistencyBadge';
import SeverityTag from '../components/SeverityTag';
import LoadingState from '../components/LoadingState';
import { getEntityDetail, updateInvestigationStatus, getExportPdfUrl, getEntities } from '../api/client';

const RecordComparison = ({ entityId, onBack }) => {
  const [selectedEntityId, setSelectedEntityId] = useState(entityId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('PENDING');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [entityOptions, setEntityOptions] = useState([]);

  const loadDetail = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getEntityDetail(id);
      setData(res);
      setStatus(res.entity.investigation_status || 'PENDING');
    } catch (e) {
      console.error("Failed to load entity comparison detail", e);
    } finally {
      setLoading(false);
    }
  };

  const loadEntityOptions = async () => {
    try {
      const res = await getEntities({ limit: 30 });
      setEntityOptions(res.entities || []);
      if (!selectedEntityId && res.entities?.length > 0) {
        setSelectedEntityId(res.entities[0].unified_entity_id);
      }
    } catch (e) {
      console.error("Failed to load entity dropdown options", e);
    }
  };

  useEffect(() => {
    loadEntityOptions();
  }, []);

  useEffect(() => {
    if (selectedEntityId) {
      loadDetail(selectedEntityId);
    }
  }, [selectedEntityId]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEntityId) return;
    setUpdating(true);
    try {
      await updateInvestigationStatus(selectedEntityId, status, notes);
      await loadDetail(selectedEntityId);
      setNotes('');
    } catch (e) {
      console.error("Failed to update status", e);
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !data) return <LoadingState message="Loading side-by-side entity records..." />;

  const entity = data?.entity;
  const evidence = data?.evidence || [];
  const records = data?.records || [];
  const logs = data?.logs || [];

  // Helper to compare values across records for highlighting
  const getValueMatchStatus = (fieldKey) => {
    if (records.length <= 1) return 'match';
    const valSet = new Set(records.map(r => String(r[fieldKey] || '').toLowerCase().strip ? String(r[fieldKey] || '').toLowerCase().strip() : String(r[fieldKey] || '').toLowerCase()));
    return valSet.size === 1 ? 'match' : 'conflict';
  };

  return (
    <div className="space-y-6">
      {/* Header Selector & PDF Export */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Side-by-Side Record Comparison</h2>
              {entity && <InconsistencyBadge score={entity.inconsistency_score} />}
              {entity && <SeverityTag severity={entity.severity} />}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspecting cross-source records for entity: <span className="font-mono text-indigo-300 font-bold">{entity?.unified_entity_id}</span> ({entity?.primary_name})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Entity Selector Dropdown */}
          <select
            value={selectedEntityId || ''}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            {entityOptions.map(opt => (
              <option key={opt.id} value={opt.unified_entity_id}>
                {opt.unified_entity_id} — {opt.primary_name} (Score: {opt.inconsistency_score})
              </option>
            ))}
          </select>

          {/* Download PDF Audit Report button */}
          {selectedEntityId && (
            <a
              href={getExportPdfUrl(selectedEntityId)}
              download
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg glow-indigo flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF Audit</span>
            </a>
          )}
        </div>
      </div>

      {/* Flagged Evidence Details */}
      <div className="glass-panel p-6 rounded-2xl space-y-3">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Flagged Evidence & Conflict Explanations</span>
        </h3>

        {evidence.length === 0 ? (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>No conflicting data or anomalies detected. Records across all sources are consistent.</span>
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {evidence.map((ev, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">{ev.type}</span>
                  <SeverityTag severity={ev.severity} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{ev.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-base font-bold text-slate-100 mb-4">Attribute Comparison Matrix</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300">
                <th className="p-3.5 border-b border-slate-700 w-44 font-bold">Attribute Field</th>
                {records.map((r, i) => (
                  <th key={r.id} className="p-3.5 border-b border-slate-700 font-bold text-indigo-300">
                    Source {i + 1}: {r.source_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {[
                { label: 'Full Name', key: 'full_name' },
                { label: 'National ID / SSN', key: 'national_id' },
                { label: 'Date of Birth', key: 'dob' },
                { label: 'Email Address', key: 'email' },
                { label: 'Address', key: 'address' },
                { label: 'Credit Score', key: 'credit_score' },
                { label: 'Account Balance', key: 'account_balance' },
                { label: 'Entity Status', key: 'status' },
                { label: 'Registration Date', key: 'registration_date' },
                { label: 'Verification Date', key: 'verification_date' },
              ].map((field) => {
                const status = getValueMatchStatus(field.key);
                const isConflict = status === 'conflict';

                return (
                  <tr key={field.key} className={isConflict ? 'bg-red-500/5' : 'hover:bg-slate-900/50'}>
                    <td className="p-3.5 font-semibold text-slate-400 flex items-center justify-between">
                      <span>{field.label}</span>
                      {isConflict ? (
                        <span className="text-[10px] text-red-400 font-bold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">Conflict</span>
                      ) : (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </td>
                    {records.map((r) => {
                      const val = r[field.key];
                      const valStr = val !== null && val !== undefined && String(val).strip ? String(val) : 'N/A';

                      return (
                        <td 
                          key={r.id} 
                          className={`p-3.5 font-medium ${
                            isConflict 
                              ? 'text-red-300 font-semibold bg-red-500/10 border border-red-500/20 rounded-lg' 
                              : 'text-slate-200'
                          }`}
                        >
                          {valStr}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auditor Investigation & Decision Panel */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-slate-100">Auditor Investigation & Verification Decision</h3>
        
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Set Investigation Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="PENDING">PENDING — Needs Review</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW — Active Investigation</option>
                <option value="RESOLVED">RESOLVED — Inconsistency Verified & Reconciled</option>
                <option value="FALSE_POSITIVE">FALSE_POSITIVE — Expected Variance / Clean</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Investigation Notes</label>
              <input
                type="text"
                placeholder="Enter auditor findings, reconciliation notes, or justification..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg glow-indigo disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{updating ? "Saving..." : "Update Status & Log Audit Entry"}</span>
            </button>
          </div>
        </form>

        {/* Audit History Timeline */}
        {logs.length > 0 && (
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Investigation History Log:</p>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {logs.map((log) => (
                <li key={log.id} className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono text-slate-500">{log.timestamp}</span>
                  <span className="font-semibold text-indigo-300">{log.action}:</span>
                  <span>{log.notes}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordComparison;
