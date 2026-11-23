import React from 'react';
import { cn } from '../../utils/cn';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color = 'brand',
  className
}) => {
  const colorMap = {
    brand: 'text-brand-600 bg-brand-50 border-brand-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    slate: 'text-slate-600 bg-slate-100 border-slate-200'
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={cn('p-2 rounded-lg border', colorMap[color] || colorMap.brand)}>
            <Icon className="w-5 h-5 stroke-[1.75]" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span
              className={cn(
                'font-semibold',
                trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-slate-500'
              )}
            >
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
            {trendLabel && <span className="text-slate-400">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
