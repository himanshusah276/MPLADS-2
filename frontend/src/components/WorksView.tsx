import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Work } from '../types';
import { 
  Search, 
  Eye, 
  TrendingUp
} from 'lucide-react';

export const WorksView: React.FC = () => {
  const { selectedState, selectedSeverity, setSelectedWorkId } = useApp();
  const [works, setWorks] = useState<Work[]>([]);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const searchTimeoutRef = useRef<any>(null);

  const fetchWorks = useCallback((overrideSearch?: string) => {
    setLoading(true);
    const searchVal = overrideSearch !== undefined ? overrideSearch : search;
    api.getWorks({
      state: selectedState,
      risk_band: selectedSeverity,
      category: categoryFilter,
      status: statusFilter,
      search: searchVal
    }).then((data) => {
      setWorks(data || []);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [selectedState, selectedSeverity, categoryFilter, statusFilter, search]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchWorks(val);
    }, 300);
  };

  const categories = [
    "All", "Drinking Water", "Sanitation", "Roads & Pathways", 
    "Education", "Public Health", "Community Infrastructure", 
    "Irrigation & Water Conservation", "Sports & Youth", "Commercial"
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search & Filter Header */}
      <div className="bg-gov-card border border-gov-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-gov">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gov-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search works by ID, description, sanction order, or district..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-gov-card text-xs text-gov-primary pl-9 pr-4 py-2.5 rounded-xl border border-gov-border focus:outline-none focus:border-orange-500 placeholder:text-gov-muted font-medium shadow-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gov-card text-xs text-gov-primary px-3.5 py-2.5 rounded-xl border border-gov-border focus:outline-none focus:border-orange-500 font-medium cursor-pointer shadow-xs"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'All Sectors' : c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gov-card text-xs text-gov-primary px-3.5 py-2.5 rounded-xl border border-gov-border focus:outline-none focus:border-orange-500 font-medium cursor-pointer shadow-xs"
          >
            <option value="All">All Statuses</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Completed">Completed</option>
            <option value="Sanctioned">Sanctioned</option>
          </select>
        </div>
      </div>

      {/* Works Table */}
      <div className="bg-gov-card border border-gov-border rounded-2xl shadow-gov overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gov-secondary">
            <thead className="bg-slate-100 dark:bg-slate-900/90 text-gov-primary uppercase tracking-wider font-bold border-b border-gov-border">
              <tr>
                <th className="p-3">Work ID</th>
                <th className="p-3">Sector & Description</th>
                <th className="p-3">Location & MP</th>
                <th className="p-3">Sanction / Cost</th>
                <th className="p-3">Status</th>
                <th className="p-3">Risk Band</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-border">
              {loading ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-3">
                      <div className="h-7 skeleton-shimmer w-full"></div>
                    </td>
                  </tr>
                ))
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gov-muted font-medium">
                    No matching works found for the selected filters.
                  </td>
                </tr>
              ) : (
                works.map((w) => {
                  const isOverrun = w.actual_cost > w.estimated_cost * 1.15;
                  return (
                    <tr key={w.work_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                      <td className="p-3 font-mono font-bold text-gov-primary">
                        <button
                          onClick={() => setSelectedWorkId(w.work_id)}
                          className="hover:text-orange-600 dark:hover:text-orange-400 hover:underline cursor-pointer"
                        >
                          {w.work_id}
                        </button>
                        {w.is_outside_constituency && (
                          <span className="block text-[9px] text-amber-600 dark:text-amber-400 font-sans font-bold">
                            Outside Const.
                          </span>
                        )}
                      </td>
                      <td className="p-3 max-w-sm">
                        <div className="font-bold text-gov-primary flex items-center gap-1.5">
                          <span>{w.category}</span>
                          {w.alerts_count && w.alerts_count > 0 ? (
                            <span className="text-[10px] bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                              {w.alerts_count} Flag{w.alerts_count > 1 ? 's' : ''}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-gov-muted text-[11px] truncate mt-0.5" title={w.description}>
                          {w.description}
                        </p>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-gov-primary">{w.district}, {w.state}</div>
                        <div className="text-[11px] text-gov-muted">{w.mp_name || w.mp_id}</div>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="font-bold text-gov-primary">
                          ₹{(w.sanctioned_amount / 100000).toFixed(2)} L
                        </div>
                        {isOverrun ? (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Actual: ₹{(w.actual_cost/100000).toFixed(2)}L</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gov-muted font-medium">
                            Est: ₹{(w.estimated_cost/100000).toFixed(2)}L
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          w.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40' :
                          w.status === 'In-Progress' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          w.risk_band === 'Critical' ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/40' :
                          w.risk_band === 'High' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/40' :
                          w.risk_band === 'Medium' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40' :
                          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {w.risk_score}/100 ({w.risk_band})
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedWorkId(w.work_id)}
                          className="p-1.5 rounded-full bg-gov-card hover:bg-gov-card-muted text-gov-primary border border-gov-border transition shadow-xs cursor-pointer"
                          title="Open Work Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
