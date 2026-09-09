import React from 'react';

interface RiskBarProps {
  subscores: Record<string, number>;
  totalScore?: number;
  height?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const RiskBar: React.FC<RiskBarProps> = ({
  subscores = {},
  totalScore,
  height = 'md',
  showLabels = false,
}) => {
  const d1 = subscores.D1 || 0; // Financial
  const d2 = subscores.D2 || 0; // Payment
  const d3 = subscores.D3 || 0; // Duplicate
  const d4 = subscores.D4 || 0; // Timeline
  const ml = Math.max(subscores.D5 || 0, subscores.D6 || 0, subscores.D7 || 0, subscores.D8 || 0);

  const total = Math.max(d1 + d2 + d3 + d4 + ml, 1);
  const p1 = (d1 / total) * 100;
  const p2 = (d2 / total) * 100;
  const p3 = (d3 / total) * 100;
  const p4 = (d4 / total) * 100;
  const pml = (ml / total) * 100;

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[height];

  return (
    <div className="w-full">
      <div className={`w-full flex rounded-sm overflow-hidden bg-[#E3E6EA] ${heightClass}`}>
        {d1 > 0 && (
          <div
            style={{ width: `${p1}%` }}
            className="bg-[#3B82F6] transition-all duration-300"
            title={`Financial (D1): ${d1}`}
          />
        )}
        {d2 > 0 && (
          <div
            style={{ width: `${p2}%` }}
            className="bg-[#EF4444] transition-all duration-300"
            title={`Payment Mismatch (D2): ${d2}`}
          />
        )}
        {d3 > 0 && (
          <div
            style={{ width: `${p3}%` }}
            className="bg-[#F59E0B] transition-all duration-300"
            title={`Duplicate Work (D3): ${d3}`}
          />
        )}
        {d4 > 0 && (
          <div
            style={{ width: `${p4}%` }}
            className="bg-[#8B5CF6] transition-all duration-300"
            title={`Timeline Staleness (D4): ${d4}`}
          />
        )}
        {ml > 0 && (
          <div
            style={{ width: `${pml}%` }}
            className="bg-[#10B981] transition-all duration-300"
            title={`ML & Graph Outliers (D5-D8): ${ml}`}
          />
        )}
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-[11px] text-[#5B6270] mt-1.5 font-medium">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
              Financial ({d1})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
              Payment ({d2})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
              Duplicate ({d3})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span>
              Timeline ({d4})
            </span>
          </div>
          {totalScore !== undefined && (
            <span className="font-mono font-semibold text-[#1A1D22]">
              Composite Score: {totalScore}/100
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskBar;
