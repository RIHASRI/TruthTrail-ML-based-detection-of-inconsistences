import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingState = ({ message = 'Analyzing records...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
      <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      <p className="text-sm font-medium text-slate-300">{message}</p>
    </div>
  );
};

export default LoadingState;
