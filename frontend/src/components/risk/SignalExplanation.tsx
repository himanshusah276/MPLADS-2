import React from 'react';
import { Info, CheckCircle2, AlertOctagon } from 'lucide-react';
import { RiskEvent } from '../../types';

interface SignalExplanationProps {
  reasons: string[];
  riskEvents?: RiskEvent[];
  confidence?: string;
}

export const SignalExplanation: React.FC<SignalExplanationProps> = ({
  reasons = [],
  riskEvents = [],
  confidence = 'High',
}) => {
  if (!reasons.length) {
    return (
      <div className="flex items-center gap-2 p-3 text-xs bg-[#EAF5EC] text-[#2E7D46] rounded border border-[#BDE3C4]">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>All parameters aligned with peer baseline benchmarks. No anomalies flagged.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between pb-1 border-b border-[#E3E6EA]">
        <span className="text-xs font-semibold text-[#1A1D22] uppercase tracking-wider">
          Contributing Risk Signals & Evidence
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5B6270] bg-[#F0F2F5] px-2 py-0.5 rounded">
          <Info className="w-3 h-3 text-[#1B4F8C]" />
          Confidence: {confidence}
        </span>
      </div>

      <div className="space-y-2">
        {reasons.map((reason, idx) => {
          const isCritical = reason.includes('CRITICAL') || reason.includes('Payment:') || reason.includes('Duplicate:');
          const detectorMatch = reason.match(/\(D\d\)/);
          const detectorTag = detectorMatch ? detectorMatch[0] : null;

          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 p-3 rounded text-xs border ${
                isCritical
                  ? 'bg-[#FFF9F9] border-[#F5C2BE] text-[#1A1D22]'
                  : 'bg-[#FFFFFF] border-[#E3E6EA] text-[#1A1D22]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isCritical ? (
                  <AlertOctagon className="w-4 h-4 text-[#B3261E]" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#1B4F8C] inline-block"></span>
                )}
              </div>
              <div className="flex-1 leading-relaxed">
                <span>{reason}</span>
              </div>
              {detectorTag && (
                <span className="text-[10px] font-mono font-bold bg-[#E8F0FA] text-[#1B4F8C] px-1.5 py-0.5 rounded border border-[#C5D9F1] shrink-0">
                  {detectorTag.replace('(', '').replace(')', '')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SignalExplanation;
