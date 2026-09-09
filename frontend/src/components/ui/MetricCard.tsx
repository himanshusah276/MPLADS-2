import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  change?: string;
  isNegative?: boolean;
  icon?: LucideIcon;
  variant?: 'default' | 'critical' | 'warning' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  change,
  isNegative,
  icon: Icon,
  variant = 'default',
}) => {
  const borderClass = {
    critical: 'border-l-[3px] border-l-[#B3261E]',
    warning: 'border-l-[3px] border-l-[#C4551C]',
    success: 'border-l-[3px] border-l-[#2E7D46]',
    default: 'border-l-[3px] border-l-[#1B4F8C]',
  }[variant];

  return (
    <div className={`bg-white p-4 rounded border border-[#E3E6EA] ${borderClass} shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#5B6270] uppercase tracking-wider">
          {title}
        </span>
        {Icon && <Icon className="w-4 h-4 text-[#8A92A0]" />}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-[#1A1D22] tabular-nums font-sans">
          {value}
        </div>
        {change && (
          <span
            className={`text-xs font-semibold ${
              isNegative ? 'text-[#B3261E]' : 'text-[#2E7D46]'
            }`}
          >
            {change}
          </span>
        )}
      </div>
      {subtext && (
        <div className="mt-1 text-[11px] text-[#8A92A0] font-medium">
          {subtext}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
