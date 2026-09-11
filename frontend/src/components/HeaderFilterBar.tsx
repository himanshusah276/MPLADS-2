import React from 'react';
import { useApp } from '../context/AppContext';
import { RotateCw, ChevronDown, Sparkles } from 'lucide-react';

const STATE_OPTIONS = [
  "All states",
  "Maharashtra",
  "Uttar Pradesh",
  "Tamil Nadu",
  "Karnataka",
  "Odisha",
  "Rajasthan",
  "Telangana",
  "Gujarat",
  "West Bengal",
  "Bihar"
];

const SEVERITY_OPTIONS = [
  "All severities",
  "Critical",
  "High",
  "Medium",
  "Low"
];

const FY_OPTIONS = [
  "Apr 2025 – Mar 2026",
  "Apr 2024 – Mar 2025",
  "Apr 2023 – Mar 2024"
];

export const HeaderFilterBar: React.FC = () => {
  const { 
    financialYear, 
    setFinancialYear, 
    selectedState, 
    setSelectedState, 
    selectedSeverity, 
    setSelectedSeverity, 
    isAnalyzing, 
    runAnalysis, 
    lastSynced, 
    t 
  } = useApp();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gov-border mb-6">
      {/* Filters Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Financial Year Selector */}
        <div className="relative">
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="appearance-none bg-gov-card text-gov-primary text-xs font-semibold px-4 py-2 pr-9 rounded-xl border border-gov-border hover:border-slate-400 dark:hover:border-slate-500 focus:outline-none focus:border-orange-500 transition cursor-pointer shadow-xs"
          >
            {FY_OPTIONS.map((fy) => (
              <option key={fy} value={fy} className="bg-gov-card text-gov-primary">
                {fy}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gov-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* State Selector */}
        <div className="relative">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="appearance-none bg-gov-card text-gov-primary text-xs font-semibold px-4 py-2 pr-9 rounded-xl border border-gov-border hover:border-slate-400 dark:hover:border-slate-500 focus:outline-none focus:border-orange-500 transition cursor-pointer shadow-xs"
          >
            {STATE_OPTIONS.map((st) => (
              <option key={st} value={st} className="bg-gov-card text-gov-primary">
                {st}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gov-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Severity Selector */}
        <div className="relative">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="appearance-none bg-gov-card text-gov-primary text-xs font-semibold px-4 py-2 pr-9 rounded-xl border border-gov-border hover:border-slate-400 dark:hover:border-slate-500 focus:outline-none focus:border-orange-500 transition cursor-pointer shadow-xs"
          >
            {SEVERITY_OPTIONS.map((sev) => (
              <option key={sev} value={sev} className="bg-gov-card text-gov-primary">
                {sev}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gov-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Sync Status & Run Analysis Action */}
      <div className="flex items-center space-x-3">
        <span className="text-xs text-gov-muted font-medium flex items-center gap-1.5 bg-gov-card px-3 py-1.5 rounded-full border border-gov-border shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {lastSynced}
        </span>

        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:shadow transition disabled:opacity-50 cursor-pointer active:scale-98"
        >
          {isAnalyzing ? (
            <RotateCw className="w-3.5 h-3.5 text-white animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          )}
          <span>{isAnalyzing ? 'Executing AI Anomaly Models...' : t('run_analysis')}</span>
        </button>
      </div>
    </div>
  );
};
