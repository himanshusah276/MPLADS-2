import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ImplementingAgency } from '../types';
import { Search, AlertTriangle } from 'lucide-react';

export const AgenciesView: React.FC = () => {
  const { selectedState } = useApp();
  const [agencies, setAgencies] = useState<ImplementingAgency[]>([]);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const searchTimeoutRef = useRef<any>(null);

  const fetchAgencies = useCallback((overrideSearch?: string) => {
    setLoading(true);
    const searchVal = overrideSearch !== undefined ? overrideSearch : search;
    api.getAgencies({
      state: selectedState,
      agency_type: typeFilter,
      search: searchVal
    }).then((data) => {
      setAgencies(data || []);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [selectedState, typeFilter, search]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchAgencies(val);
    }, 300);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Controls */}
      <div className="bg-gov-card border border-gov-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-gov">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gov-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search implementing agency by name or ID..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-gov-card text-xs text-gov-primary pl-9 pr-4 py-2.5 rounded-xl border border-gov-border focus:outline-none focus:border-orange-500 placeholder:text-gov-muted font-medium shadow-xs"
            />
          </div>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-gov-card text-xs text-gov-primary px-3.5 py-2.5 rounded-xl border border-gov-border focus:outline-none focus:border-orange-500 font-medium cursor-pointer shadow-xs"
        >
          <option value="All">All Agency Types</option>
          <option value="Govt Dept">Govt Department (PWD/RD)</option>
          <option value="PSU">PSU / Jal Nigam</option>
          <option value="Local Body">Municipal Corporation / ZP</option>
          <option value="Trust">Trust (Subject to ₹50L Cap)</option>
          <option value="Society">Society (Subject to ₹50L Cap)</option>
        </select>
      </div>

      {/* Agencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gov-card p-6 border border-gov-border rounded-2xl skeleton-shimmer h-44"></div>
          ))
        ) : agencies.length === 0 ? (
          <div className="col-span-full bg-gov-card p-12 text-center text-gov-muted border border-gov-border rounded-2xl font-medium">
            No matching agencies found.
          </div>
        ) : (
          agencies.map((ag) => {
            const isTrustCapRisk = (ag.type === 'Trust' || ag.type === 'Society') && ag.total_sanctioned_amount > 4500000;
            return (
              <div
                key={ag.agency_id}
                className="bg-gov-card border border-gov-border hover:border-slate-400 dark:hover:border-slate-500 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition shadow-gov card-hover-lift"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-gov-muted font-bold block">
                        {ag.agency_id}
                      </span>
                      <h4 className="text-sm font-bold text-gov-primary leading-snug">
                        {ag.name}
                      </h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      ag.risk_band === 'Critical' ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/40' :
                      ag.risk_band === 'High' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/40' :
                      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {ag.type}
                    </span>
                  </div>

                  <div className="text-xs text-gov-muted mt-1 font-medium">
                    {ag.district}, {ag.state}
                  </div>
                </div>

                <div className="bg-gov-card-muted p-3 rounded-xl border border-gov-border space-y-1.5 text-xs font-medium">
                  <div className="flex justify-between text-gov-secondary">
                    <span>Works Handled:</span>
                    <span className="font-mono font-bold text-gov-primary">{ag.total_works_handled}</span>
                  </div>
                  <div className="flex justify-between text-gov-secondary">
                    <span>Total Sanctions:</span>
                    <span className="font-mono font-bold text-gov-primary">
                      ₹{(ag.total_sanctioned_amount / 100000).toFixed(2)} Lakh
                    </span>
                  </div>
                  <div className="flex justify-between text-gov-secondary">
                    <span>Flagged Works:</span>
                    <span className={`font-mono font-bold ${ag.flagged_works_count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gov-muted'}`}>
                      {ag.flagged_works_count}
                    </span>
                  </div>
                </div>

                {isTrustCapRisk && (
                  <div className="bg-red-500/15 border border-red-500/40 p-2.5 rounded-xl text-[11px] text-red-700 dark:text-red-300 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                    <span>Nearing/Exceeding ₹50 Lakh Trust Statutory Ceiling</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
