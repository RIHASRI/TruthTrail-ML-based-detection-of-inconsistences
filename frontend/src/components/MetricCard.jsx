import React from 'react';

const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) => {
  const getColorClasses = (c) => {
    switch (c) {
      case 'red':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'amber':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'teal':
        return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
      case 'indigo':
      default:
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    }
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-xl p-5 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-50 mt-1 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${getColorClasses(color)} transition-transform group-hover:scale-110 duration-200`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
