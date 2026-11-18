import React, { useState } from 'react';
import { FileText, Download, FileSpreadsheet, ShieldAlert, CheckCircle, Filter } from 'lucide-react';
import { getExportCsvUrl } from '../api/client';

const Reports = () => {
  const [severityFilter, setSeverityFilter] = useState('ALL');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <span>Audit Reports & Data Export Center</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Export comprehensive cross-record entity inconsistency findings as CSV datasets or individual evidence PDF audit packages.
        </p>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Bulk Export Card */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 border-indigo-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Full Inconsistency CSV Export</h3>
                <p className="text-xs text-slate-400">Bulk export all analyzed unified entities & evidence logs</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Filter by Severity:</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">ALL Severities (Include Clean & Flagged)</option>
                  <option value="Critical">Critical Severity (Score >= 75)</option>
                  <option value="High">High Severity (Score >= 50)</option>
                  <option value="Medium">Medium Severity (Score >= 25)</option>
                  <option value="Low">Low Severity (Score > 0)</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                Includes Unified Entity IDs, Primary Names, National IDs, Inconsistency Scores (0-100), Severity Labels, Investigation Statuses, and detailed Evidence Logs.
              </p>
            </div>
          </div>

          <a
            href={getExportCsvUrl(severityFilter !== 'ALL' ? severityFilter : '')}
            download
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg glow-indigo flex items-center justify-center gap-2 text-center"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Inconsistency Report</span>
          </a>
        </div>

        {/* PDF Individual Audit Export Card */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 border-teal-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Individual PDF Audit Package</h3>
                <p className="text-xs text-slate-400">Download formatted PDF report for a single entity</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                PDF audit reports can be generated directly from the <strong>Record Comparison</strong> page for any specific entity. Includes executive summary table, flagged evidence log, side-by-side source attribute comparison matrix, and auditor signatures.
              </p>
              <div className="flex items-center gap-2 text-teal-400 font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>ReportLab PDF Generator Active</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
            Tip: Go to <strong>Record Comparison</strong> or <strong>Analysis Results</strong> to pick an entity and click <em>Export PDF Audit</em>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
