import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DigiGovSummary, DigiGovMPRecord } from '../types';
import { 
  Search, 
  Download, 
  RotateCcw, 
  Eye, 
  Layers,
  ExternalLink
} from 'lucide-react';

export const DigiGovDashboardView: React.FC = () => {
  const { setSelectedMPId, setActiveTab } = useApp();
  const [tenure, setTenure] = useState<string>('All');
  const [state, setState] = useState<string>('All');
  const [constituency, setConstituency] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  
  const [summary, setSummary] = useState<DigiGovSummary | null>(null);
  const [mpsData, setMpsData] = useState<DigiGovMPRecord[]>([]);
  const [constituencyMap, setConstituencyMap] = useState<Record<string, string[]>>({});
  const [statesList, setStatesList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const searchTimeoutRef = useRef<any>(null);

  // Load constituencies once
  useEffect(() => {
    api.getDigiGovConstituencies()
      .then(data => {
        if (data) {
          setStatesList(data.states || []);
          setConstituencyMap(data.constituency_map || {});
        }
      })
      .catch(console.error);
  }, []);

  const fetchData = useCallback((overrideSearch?: string) => {
    setLoading(true);
    const searchVal = overrideSearch !== undefined ? overrideSearch : search;

    Promise.all([
      api.getDigiGovSummary(tenure, state),
      api.getDigiGovMPs({ tenure, state, constituency, search: searchVal })
    ]).then(([sData, mData]) => {
      setSummary(sData);
      setMpsData(mData || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [tenure, state, constituency, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchData(val);
    }, 300);
  };

  const handleReset = () => {
    setTenure('All');
    setState('All');
    setConstituency('All');
    setSearch('');
    setLoading(true);
    Promise.all([
      api.getDigiGovSummary('All', 'All'),
      api.getDigiGovMPs()
    ]).then(([sData, mData]) => {
      setSummary(sData);
      setMpsData(mData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const availableConstituencies = state !== 'All' && constituencyMap[state] 
    ? constituencyMap[state] 
    : Object.values(constituencyMap).flat();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Official MoSPI DigiGov Banner */}
      <div className="bg-gov-card border border-gov-border rounded-2xl p-6 shadow-gov border-t-4 border-t-orange-600">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] bg-orange-600 text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Official Public Portal
              </span>
              <span className="text-xs text-gov-muted font-medium flex items-center gap-1">
                Source: <a href="https://mplads.mospi.gov.in/digigov/dashboard.html" target="_blank" rel="noreferrer" className="text-orange-600 dark:text-orange-400 underline font-semibold flex items-center gap-0.5">mplads.mospi.gov.in <ExternalLink className="w-3 h-3" /></a>
              </span>
            </div>
            <h1 className="text-xl font-black text-gov-primary tracking-tight">
              MPLADS — eSAKSHI Public Citizen Dashboard
            </h1>
            <p className="text-xs text-gov-secondary max-w-3xl leading-relaxed font-medium">
              Real-time fund authorization and developmental works tracking across all Lok Sabha and Rajya Sabha constituencies under the revised eSAKSHI fund-flow framework.
            </p>
          </div>

          <a
            href={api.getDigiGovExportUrl()}
            className="flex items-center space-x-2 bg-gov-card hover:bg-gov-card-muted text-gov-primary text-xs font-bold px-4 py-2.5 rounded-xl border border-gov-border transition shadow-xs cursor-pointer card-hover-lift"
            download
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Official DigiGov Dataset (.CSV)</span>
          </a>
        </div>
      </div>

      {/* Official DigiGov 4-Field Search Form */}
      <div className="bg-gov-card border border-gov-border rounded-2xl p-5 shadow-gov space-y-4">
        <div className="text-xs font-bold text-gov-primary uppercase tracking-wider flex items-center gap-2">
          <Search className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <span>Constituency & MP Inquiry Search</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Tenure Selector */}
          <div>
            <label className="text-[11px] font-bold text-gov-muted block mb-1">Tenure</label>
            <select
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              className="w-full bg-gov-card text-xs text-gov-primary p-2.5 rounded-xl border border-gov-border focus:outline-none focus:border-orange-500 font-medium cursor-pointer shadow-xs"
            >
              <option value="All">All Tenures (18th LS / 17th LS / RS)</option>
              <option value="18th Lok Sabha (2024-2029)">18th Lok Sabha (2024–2029)</option>
              <option value="17th Lok Sabha (2019-2024)">17th Lok Sabha (2019–2024)</option>
              <option value="Rajya Sabha">Rajya Sabha</option>
            </select>
          </div>

          {/* 2. State Selector */}
          <div>
            <label className="text-[11px] font-bold text-gov-muted block mb-1">State / UT</label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setConstituency('All');
              }}
              className="w-full bg-gov-card text-xs text-gov-primary p-2.5 rounded-xl border border-gov-border focus:outline-none focus:border-orange-500 font-medium cursor-pointer shadow-xs"
            >
              <option value="All">All States / UTs</option>
              {statesList.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* 3. Constituency Selector */}
          <div>
            <label className="text-[11px] font-bold text-gov-muted block mb-1">Constituency</label>
            <select
              value={constituency}
              onChange={(e) => setConstituency(e.target.value)}
              className="w-full bg-gov-card text-xs text-gov-primary p-2.5 rounded-xl border border-gov-border focus:outline-none focus:border-orange-500 font-medium cursor-pointer shadow-xs"
            >
              <option value="All">All Constituencies</option>
              {Array.from(new Set(availableConstituencies)).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 4. MP Name Input */}
          <div>
            <label className="text-[11px] font-bold text-gov-muted block mb-1">MP Name</label>
            <input
              type="text"
              placeholder="Search MP name or party..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-gov-card text-xs text-gov-primary p-2.5 rounded-xl border border-gov-border focus:outline-none focus:border-orange-500 placeholder:text-gov-muted font-medium shadow-xs"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gov-border">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gov-card hover:bg-gov-card-muted text-gov-primary text-xs font-semibold rounded-xl border border-gov-border transition shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gov-muted" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={() => fetchData()}
            className="flex items-center space-x-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition cursor-pointer active:scale-98"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Official DigiGov Summary KPI Tiles */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Allocated Limit */}
          <div className="bg-gov-card border border-gov-border rounded-2xl p-4 shadow-gov card-hover-lift border-t-2 border-t-blue-600">
            <div className="text-[11px] font-bold text-gov-muted uppercase tracking-wider">
              Allocated Limit
            </div>
            <div className="text-2xl font-black text-gov-primary mt-1 font-mono">
              ₹ {summary.total_allocated_limit_cr?.toLocaleString()} <span className="text-sm font-semibold text-gov-muted">Cr</span>
            </div>
            <div className="text-[10px] text-gov-muted mt-1 font-medium">
              ₹5.00 Cr / MP / Year online authorisations
            </div>
          </div>

          {/* Amount Recommended */}
          <div className="bg-gov-card border border-gov-border rounded-2xl p-4 shadow-gov card-hover-lift border-t-2 border-t-orange-600">
            <div className="text-[11px] font-bold text-gov-muted uppercase tracking-wider">
              Amount Recommended
            </div>
            <div className="text-2xl font-black text-gov-primary mt-1 font-mono">
              ₹ {summary.total_recommended_cr?.toLocaleString()} <span className="text-sm font-semibold text-gov-muted">Cr</span>
            </div>
            <div className="text-[10px] text-gov-muted mt-1 font-medium">
              across {summary.works_metrics?.total_works_recommended?.toLocaleString()} works submitted by MPs
            </div>
          </div>

          {/* Amount Sanctioned */}
          <div className="bg-gov-card border border-gov-border rounded-2xl p-4 shadow-gov card-hover-lift border-t-2 border-t-indigo-600">
            <div className="text-[11px] font-bold text-gov-muted uppercase tracking-wider">
              Amount Sanctioned
            </div>
            <div className="text-2xl font-black text-gov-primary mt-1 font-mono">
              ₹ {summary.total_sanctioned_cr?.toLocaleString()} <span className="text-sm font-semibold text-gov-muted">Cr</span>
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
              {summary.works_metrics?.sanction_rate_pct}% sanction rate by District Authorities
            </div>
          </div>

          {/* Vendor Payments Released */}
          <div className="bg-gov-card border border-gov-border rounded-2xl p-4 shadow-gov card-hover-lift border-t-2 border-t-emerald-600">
            <div className="text-[11px] font-bold text-gov-muted uppercase tracking-wider">
              Vendor Payments Released
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              ₹ {summary.total_vendor_released_cr?.toLocaleString()} <span className="text-sm font-semibold text-gov-muted">Cr</span>
            </div>
            <div className="text-[10px] text-gov-secondary mt-1 flex items-center justify-between font-medium">
              <span>Completed Works: <strong className="text-gov-primary">{summary.works_metrics?.total_works_completed}</strong></span>
              <span>In-Progress: <strong className="text-gov-primary">{summary.works_metrics?.total_works_in_progress}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Official DigiGov Results Table */}
      <div className="bg-gov-card border border-gov-border rounded-2xl shadow-gov overflow-hidden">
        <div className="p-4 bg-slate-100 dark:bg-slate-900/90 border-b border-gov-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-xs font-bold text-gov-primary uppercase tracking-wider">
              Constituency-Wise Scheme Records ({mpsData.length} MPs Covered)
            </h3>
          </div>
          <span className="text-[11px] text-gov-muted font-medium">
            Click any row to inspect work breakdown or AI anomaly flags
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gov-secondary">
            <thead className="bg-slate-200 dark:bg-slate-950 text-gov-primary uppercase tracking-wider font-bold border-b border-gov-border">
              <tr>
                <th className="p-3">MP & Constituency</th>
                <th className="p-3">Tenure</th>
                <th className="p-3">Party</th>
                <th className="p-3 text-right">Allocated (₹ Cr)</th>
                <th className="p-3 text-right">Recommended (₹ Cr)</th>
                <th className="p-3 text-right">Sanctioned (₹ Cr)</th>
                <th className="p-3 text-right">Vendor Released (₹ Cr)</th>
                <th className="p-3 text-center">Works (Rec/Sanc/Comp)</th>
                <th className="p-3 text-center">AI Risk Flag</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-border">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan={10} className="p-3">
                      <div className="h-6 skeleton-shimmer w-full"></div>
                    </td>
                  </tr>
                ))
              ) : mpsData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gov-muted font-medium">
                    No matching constituency records found. Try resetting the filters.
                  </td>
                </tr>
              ) : (
                mpsData.map((m) => (
                  <tr
                    key={m.mp_id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                    onClick={() => {
                      setSelectedMPId(m.mp_id);
                      setActiveTab('mps');
                    }}
                  >
                    <td className="p-3">
                      <div className="font-bold text-gov-primary flex items-center gap-1.5">
                        <span>{m.mp_name}</span>
                        <span className="text-[10px] text-gov-muted font-normal">({m.house})</span>
                      </div>
                      <div className="text-[11px] text-gov-muted font-medium">
                        {m.constituency}, {m.state}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] bg-gov-card-muted text-gov-secondary px-2.5 py-0.5 rounded-full border border-gov-border font-semibold">
                        {m.tenure ? m.tenure.split('(')[0].trim() : '18th Lok Sabha'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-gov-primary">
                      {m.party}
                    </td>
                    <td className="p-3 font-mono text-right text-gov-secondary">
                      ₹{m.allocated_limit_cr.toFixed(2)}
                    </td>
                    <td className="p-3 font-mono text-right text-gov-primary font-bold">
                      ₹{m.amount_recommended_cr.toFixed(2)}
                    </td>
                    <td className="p-3 font-mono text-right text-gov-primary font-bold">
                      ₹{m.amount_sanctioned_cr.toFixed(2)}
                    </td>
                    <td className="p-3 font-mono text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{m.vendor_payments_released_cr.toFixed(2)}
                    </td>
                    <td className="p-3 text-center font-mono font-medium">
                      <span className="text-gov-secondary">{m.works_recommended}</span> / <span className="text-gov-secondary">{m.works_sanctioned}</span> / <span className="text-emerald-600 dark:text-emerald-400 font-bold">{m.works_completed}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        m.risk_score >= 75 ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/40' :
                        m.risk_score >= 50 ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/40' :
                        m.risk_score >= 25 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40' :
                        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {m.risk_score}/100
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMPId(m.mp_id);
                          setActiveTab('mps');
                        }}
                        className="p-1.5 rounded-full bg-gov-card hover:bg-gov-card-muted text-gov-primary border border-gov-border transition cursor-pointer shadow-xs"
                        title="View MP Entitlement & Works Dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
