import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { MP, Work } from '../types';
import { 
  Search, 
  CheckCircle2, 
  Clock
} from 'lucide-react';

export const MPDossierView: React.FC = () => {
  const { selectedState, selectedMPId, setSelectedMPId, setSelectedWorkId } = useApp();
  const [mps, setMps] = useState<MP[]>([]);
  const [dossierData, setDossierData] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [dossierLoading, setDossierLoading] = useState<boolean>(false);
  const searchTimeoutRef = useRef<any>(null);

  const fetchMPs = useCallback((overrideSearch?: string) => {
    setLoading(true);
    const searchVal = overrideSearch !== undefined ? overrideSearch : search;
    api.getMPs({ state: selectedState, search: searchVal }).then((data) => {
      setMps(data || []);
      if (!selectedMPId && data && data.length > 0) {
        setSelectedMPId(data[0].mp_id);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [selectedState, search, selectedMPId, setSelectedMPId]);

  useEffect(() => {
    fetchMPs();
  }, [fetchMPs]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchMPs(val);
    }, 300);
  };

  useEffect(() => {
    if (!selectedMPId) return;
    setDossierLoading(true);
    api.getMPDossier(selectedMPId).then((res) => {
      setDossierData(res);
      setDossierLoading(false);
    }).catch(err => {
      console.error(err);
      setDossierLoading(false);
    });
  }, [selectedMPId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Left MP List */}
      <div className="lg:col-span-4 space-y-3">
        <div className="bg-gov-card border border-gov-border rounded-2xl p-3 shadow-gov">
          <div className="relative">
            <Search className="w-4 h-4 text-gov-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search MP by name or constituency..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-gov-card text-xs text-gov-primary pl-9 pr-3 py-2.5 rounded-xl border border-gov-border focus:outline-none focus:border-orange-500 placeholder:text-gov-muted font-medium shadow-xs"
            />
          </div>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gov-card p-4 border border-gov-border rounded-2xl skeleton-shimmer h-24"></div>
            ))
          ) : mps.map((mp) => {
            const isSelected = selectedMPId === mp.mp_id;
            return (
              <div
                key={mp.mp_id}
                onClick={() => setSelectedMPId(mp.mp_id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer card-hover-lift ${
                  isSelected
                    ? 'bg-orange-500/10 border-orange-500/50 shadow-xs'
                    : 'bg-gov-card border-gov-border hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-gov-primary flex items-center gap-1.5">
                    <span>{mp.name}</span>
                    <span className="text-[10px] text-gov-muted font-normal">({mp.house})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    mp.composite_risk_score >= 75 ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/40' :
                    mp.composite_risk_score >= 50 ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/40' :
                    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {Math.round(mp.composite_risk_score)}
                  </span>
                </div>

                <div className="text-[11px] text-gov-muted mt-1 flex justify-between font-medium">
                  <span>{mp.constituency} ({mp.state})</span>
                  <span>{mp.party}</span>
                </div>

                <div className="mt-2 text-[10px] text-gov-muted flex justify-between pt-1 border-t border-gov-border font-medium">
                  <span>Utilized: ₹{(mp.total_utilized / 10000000).toFixed(2)} Cr</span>
                  <span>{mp.works_count || 0} works</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right MP Dossier View */}
      <div className="lg:col-span-8 space-y-4">
        {dossierLoading ? (
          <div className="bg-gov-card border border-gov-border rounded-2xl p-12 text-center text-gov-muted space-y-3 font-medium skeleton-shimmer h-80"></div>
        ) : dossierData ? (
          <>
            {/* MP Header Card */}
            <div className="bg-gov-card border border-gov-border rounded-2xl p-5 shadow-gov space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#0a2540] border-2 border-orange-500/60 flex items-center justify-center text-sm font-bold font-mono text-amber-300 shadow-sm">
                    {dossierData.mp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold text-gov-primary">
                        {dossierData.mp.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gov-card-muted text-gov-primary border border-gov-border">
                        {dossierData.mp.house} • {dossierData.mp.party}
                      </span>
                    </div>
                    <div className="text-xs text-gov-muted mt-0.5 font-medium">
                      Constituency: <strong className="text-gov-primary">{dossierData.mp.constituency}</strong>, {dossierData.mp.state} • Term: 2024–2029
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-gov-muted font-medium">Composite Risk Score</div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {dossierData.mp.composite_risk_score} <span className="text-xs text-gov-muted font-normal">/100</span>
                  </div>
                </div>
              </div>

              {/* Entitlement & 80% UC Milestone */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gov-border">
                <div className="bg-gov-card-muted p-3.5 rounded-xl border border-gov-border">
                  <div className="text-[11px] text-gov-muted font-semibold">Annual Entitlement</div>
                  <div className="text-lg font-bold text-gov-primary mt-0.5 font-mono">
                    ₹ 5.00 <span className="text-xs font-normal text-gov-muted">Crore</span>
                  </div>
                  <div className="text-[10px] text-gov-muted mt-0.5 font-medium">₹2.5 Cr × 2 Installments</div>
                </div>

                <div className="bg-gov-card-muted p-3.5 rounded-xl border border-gov-border">
                  <div className="text-[11px] text-gov-muted font-semibold">Total Sanctioned & Utilized</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                    ₹ {(dossierData.mp.total_utilized / 10000000).toFixed(2)} <span className="text-xs font-normal text-gov-muted">Cr</span>
                  </div>
                  <div className="text-[10px] text-gov-muted mt-0.5 font-medium">
                    {dossierData.entitlement_summary?.utilization_rate_pct}% of total sanctioned
                  </div>
                </div>

                <div className="bg-gov-card-muted p-3.5 rounded-xl border border-gov-border">
                  <div className="text-[11px] text-gov-muted font-semibold">80% UC Release Eligibility</div>
                  <div className="text-sm font-bold text-gov-primary mt-1 flex items-center gap-1.5">
                    {dossierData.entitlement_summary?.is_eligible_for_inst2_release ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">Eligible for Inst 2</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-amber-700 dark:text-amber-400 font-bold">Pending UC &ge; 80%</span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-gov-muted mt-0.5 font-medium">Statutory requirement Para 4.3</div>
                </div>
              </div>
            </div>

            {/* MP Recommended Works List */}
            <div className="bg-gov-card border border-gov-border rounded-2xl p-4 space-y-3 shadow-gov">
              <h3 className="text-xs font-bold text-gov-primary uppercase tracking-wider flex items-center justify-between">
                <span>Sanctioned Works ({dossierData.works?.length || 0})</span>
                <span className="text-gov-muted font-medium">eSAKSHI Verified Database</span>
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {dossierData.works?.map((w: Work) => (
                  <div
                    key={w.work_id}
                    onClick={() => setSelectedWorkId(w.work_id)}
                    className="p-3 bg-gov-card-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-gov-border flex items-center justify-between gap-3 transition cursor-pointer card-hover-lift"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-gov-primary text-xs">{w.work_id}</span>
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">{w.category}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          w.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40'
                        }`}>
                          {w.status}
                        </span>
                      </div>
                      <p className="text-xs text-gov-secondary truncate max-w-md font-medium">
                        {w.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs text-gov-primary">
                        ₹{(w.sanctioned_amount / 100000).toFixed(2)} L
                      </div>
                      <div className="text-[10px] text-gov-muted font-medium">
                        Risk: {w.risk_score}/100
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gov-card p-12 text-center text-gov-muted border border-gov-border rounded-2xl font-medium">
            Select an MP from the left panel to inspect full entitlement dossier.
          </div>
        )}
      </div>
    </div>
  );
};
