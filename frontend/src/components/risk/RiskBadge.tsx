import React from 'react';
import { AlertCircle, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import { RiskBand } from '../../types';

interface RiskBadgeProps {
  band: RiskBand | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  band,
  score,
  size = 'md',
  showIcon = true,
}) => {
  const normalizedBand = (band || 'Low') as RiskBand;

  const styles = {
    Critical: {
      bg: 'bg-[#FCE8E6]',
      text: 'text-[#B3261E]',
      border: 'border-l-[3px] border-l-[#B3261E] border-[#F5C2BE]',
      icon: Flame,
      label: 'CRITICAL',
    },
    High: {
      bg: 'bg-[#FDF2E9]',
      text: 'text-[#C4551C]',
      border: 'border-l-[3px] border-l-[#C4551C] border-[#F8D2BA]',
      icon: AlertTriangle,
      label: 'HIGH',
    },
    Medium: {
      bg: 'bg-[#FEF9E7]',
      text: 'text-[#B98900]',
      border: 'border-l-[3px] border-l-[#B98900] border-[#FCEAB3]',
      icon: AlertCircle,
      label: 'MEDIUM',
    },
    Low: {
      bg: 'bg-[#EAF5EC]',
      text: 'text-[#2E7D46]',
      border: 'border-l-[3px] border-l-[#2E7D46] border-[#BDE3C4]',
      icon: ShieldCheck,
      label: 'LOW',
    },
  }[normalizedBand] || {
    bg: 'bg-[#F0F2F5]',
    text: 'text-[#5B6270]',
    border: 'border-l-[3px] border-l-[#8A92A0] border-[#E3E6EA]',
    icon: ShieldCheck,
    label: band.toUpperCase(),
  };

  const Icon = styles.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-1.5 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-bold gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses} shadow-sm`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{styles.label}</span>
      {score !== undefined && (
        <span className="ml-0.5 tabular-nums opacity-90 font-mono font-bold">
          {score}
        </span>
      )}
    </span>
  );
};

export default RiskBadge;
