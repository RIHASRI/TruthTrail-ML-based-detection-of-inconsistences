import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DataUpload from './pages/DataUpload';
import AnalysisResults from './pages/AnalysisResults';
import RecordComparison from './pages/RecordComparison';
import ModelEvaluation from './pages/ModelEvaluation';
import Reports from './pages/Reports';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectEntity = (entityId) => {
    setSelectedEntityId(entityId);
    setActiveTab('comparison');
  };

  const handleRefreshAllData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar onRefreshData={handleRefreshAllData} />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {activeTab === 'dashboard' && (
            <Dashboard 
              key={refreshTrigger}
              onSelectEntity={handleSelectEntity} 
              onNavigateTab={setActiveTab} 
            />
          )}

          {activeTab === 'upload' && (
            <DataUpload 
              onUploadSuccess={() => {
                handleRefreshAllData();
                setActiveTab('analysis');
              }} 
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisResults 
              key={refreshTrigger}
              onSelectEntity={handleSelectEntity} 
            />
          )}

          {activeTab === 'comparison' && (
            <RecordComparison 
              key={`${selectedEntityId}-${refreshTrigger}`}
              entityId={selectedEntityId} 
              onBack={() => setActiveTab('analysis')}
            />
          )}

          {activeTab === 'evaluation' && (
            <ModelEvaluation />
          )}

          {activeTab === 'reports' && (
            <Reports />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
