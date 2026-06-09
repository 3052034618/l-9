import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  className?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-500',
    text: 'text-blue-600',
    glow: 'shadow-blue-100',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-500',
    text: 'text-emerald-600',
    glow: 'shadow-emerald-100',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-500',
    text: 'text-amber-600',
    glow: 'shadow-amber-100',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-500',
    text: 'text-red-600',
    glow: 'shadow-red-100',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-500',
    text: 'text-purple-600',
    glow: 'shadow-purple-100',
  },
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className,
}: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 mt-2 text-xs font-medium',
                trend.isPositive ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}%</span>
              <span className="text-slate-400">较上周</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            colors.icon,
            'shadow-lg',
            colors.glow
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
