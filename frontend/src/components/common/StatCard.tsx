import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
  trend?: {
    value: string;
    positive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  trend,
}) => {
  const variantStyles = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      iconBg: 'bg-blue-600 text-white',
      accent: 'text-blue-600',
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
      accent: 'text-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      iconBg: 'bg-amber-600 text-white',
      accent: 'text-amber-600',
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      iconBg: 'bg-rose-600 text-white',
      accent: 'text-rose-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      iconBg: 'bg-purple-600 text-white',
      accent: 'text-purple-600',
    },
  }[variant];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${variantStyles.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                trend.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {trend.positive ? '+' : ''}{trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
