import React from 'react';

const InconsistencyBadge = ({ score }) => {
  const getScoreColor = (s) => {
    if (s >= 75) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (s >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    if (s >= 25) return 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30';
    if (s > 0) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${getScoreColor(score)}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
        <span>{score} / 100</span>
      </div>
    </div>
  );
};

export default InconsistencyBadge;
