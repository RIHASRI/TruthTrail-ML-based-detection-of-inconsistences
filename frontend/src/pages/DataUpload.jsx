import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, Database, AlertCircle, ArrowRight } from 'lucide-react';
import { uploadFiles, loadSampleDataset } from '../api/client';
import LoadingState from '../components/LoadingState';

const DataUpload = ({ onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError("Please select at least one CSV or Excel file.");
      return;
    }

    setUploading(true);
    setError(null);
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));

    try {
      const res = await uploadFiles(formData);
      setUploadResult(res);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Please check file format.");
    } finally {
      setUploading(false);
    }
  };

  const handleQuickSampleLoad = async () => {
    setUploading(true);
    setError(null);
    try {
      const res = await loadSampleDataset(50, 0.35);
      setUploadResult(res);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load sample data.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-1">Upload Multi-Source Datasets</h2>
        <p className="text-xs text-slate-400">
          Upload 2 or more CSV/Excel records belonging to the same domain (e.g. Master KYC, Operational Logs, Billing) to identify cross-record entity inconsistencies.
        </p>

        {/* Dropzone area */}
        <form onSubmit={handleUpload} className="mt-6 space-y-4">
          <div className="border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-2xl p-8 text-center bg-slate-900/40 hover:bg-slate-900/80 transition-all cursor-pointer relative group">
            <input 
              type="file" 
              multiple 
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Click to select or drag & drop CSV or Excel files
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports .csv, .xlsx, .xls (Up to 50MB)</p>
              </div>
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Files Ready for Auditing:</p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {selectedFiles.map((file, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-slate-500">({Math.round(file.size / 1024)} KB)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleQuickSampleLoad}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/30 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Database className="w-4 h-4" />
              <span>Load Synthetic Benchmark Datasets</span>
            </button>

            <button
              type="submit"
              disabled={uploading || selectedFiles.length === 0}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg glow-indigo disabled:opacity-50 flex items-center gap-2"
            >
              <span>{uploading ? "Processing Pipeline..." : "Run ML Entity Audit"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {uploading && <LoadingState message="Parsing datasets, clustering entity IDs, running RapidFuzz matcher & Isolation Forest..." />}

      {/* Upload Success Feedback */}
      {uploadResult && (
        <div className="glass-panel p-6 rounded-2xl border-emerald-500/30 bg-emerald-500/5 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Pipeline Execution Complete!</h3>
              <p className="text-xs text-slate-300">{uploadResult.message}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Processed Unified Entities: <strong className="text-emerald-300">{uploadResult.processed_entities || uploadResult.entity_count}</strong></span>
            <span className="text-indigo-400 hover:underline cursor-pointer font-semibold" onClick={() => onUploadSuccess && onUploadSuccess()}>
              Proceed to Analysis Results &rarr;
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataUpload;
