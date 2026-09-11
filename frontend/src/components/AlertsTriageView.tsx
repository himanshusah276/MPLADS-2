import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { AnomalyAlert } from '../types';
import { 
  Search, 
  Download, 
  FileCheck
} from 'lucide-react';

export const AlertsTriageView: React.FC = () => {
  const { selectedState, selectedSeverity, setOpenTriageAlertId, setSelectedWorkId, isAnalyzing, openTriageAlertId } = useApp();
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAlerts = useCallback(() => {
    setLoading(true);
    api.getAlerts(selectedSeverity, statusFilter, selectedState).then((data) => {
      setAlerts(data || []);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [selectedState, selectedSeverity, statusFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts, isAnalyzing, openTriageAlertId]);

  const filteredAlerts = alerts.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.alert_id.toLowerCase().includes(s) ||
      a.entity_id.toLowerCase().includes(s) ||
      a.alert_type.toLowerCase().includes(s) ||
      a.description.toLowerCase().includes(s) ||
      (a.entity_name && a.entity_name.toLowerCase().includes(s))
    );
  });

  const exportCSV = () => {
    const rows = [
      ["Alert ID", "Entity Type", "Entity ID", "Alert Type", "Severity", "Risk Score", "Status", "Reviewer Role", "Reviewer Comment", "Detected On", "Description"],
      ...filteredAlerts.map(a => [
        a.alert_id,
        a.entity_type,
        a.entity_id,
        `"${a.alert_type}"`,
        a.severity,
        a.risk_score,
        a.status,
        `"${a.reviewer_role || ''}"`,
        `"${(a.reviewer_comment || '').replace(/"/g, '""')}"`,
        a.detected_on,
        `"${a.description.replace(/"/g, '""')}"`
      ])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `MPLADS_Vigilance_Triage_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls Bar */}
      <div className="bg-gov-card border border-gov-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-gov">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gov-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alerts by ID, rule, MP, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gov-card text-xs text-gov-primary pl-9 pr-4 py-2.5 rounded-xl border border-gov-border focus:outline-none focus:border-orange-500 placeholder:text-gov-muted font-medium shadow-xs"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Tabs */}
          <div className="flex bg-gov-card-muted p-0.5 rounded-full border border-gov-border text-xs">
            {['All', 'Open', 'Under Review', 'Resolved', 'False Positive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-gov-muted hover:text-gov-primary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 bg-gov-card hover:bg-gov-card-muted text-gov-primary text-xs font-semibold px-3.5 py-2 rounded-xl border border-gov-border transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gov-muted" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gov-card p-6 border border-gov-border rounded-2xl skeleton-shimmer h-28"></div>
          ))
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-gov-card p-12 text-center text-gov-muted border border-gov-border rounded-2xl font-medium">
            No anomaly alerts match the selected criteria.
          </div>
        ) : (
          filteredAlerts.map((a) => (
            <div
              key={a.alert_id}
              className={`bg-gov-card border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-gov card-hover-lift ${
                a.severity === 'Critical' ? 'border-l-4 border-l-red-600' :
                a.severity === 'High' ? 'border-l-4 border-l-orange-500' :
                a.severity === 'Medium' ? 'border-l-4 border-l-amber-500' :
                'border-l-4 border-l-emerald-600'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-gov-primary text-xs">
                    {a.alert_id}
                  </span>
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                    {a.alert_type}
                  </span>
                  {a.rule_code && (
                    <span className="text-[10px] font-mono bg-gov-card-muted text-gov-secondary px-2 py-0.5 rounded-md border border-gov-border font-bold">
                      Clause {a.rule_code}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    a.severity === 'Critical' ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/40' :
                    a.severity === 'High' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/40' :
                    a.severity === 'Medium' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40' :
                    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {a.severity} Severity ({a.risk_score}/100)
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    a.status === 'Resolved' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40' :
                    a.status === 'Under Review' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/40' :
                    a.status === 'False Positive' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/40' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                  }`}>
                    {a.status}
                  </span>
                </div>

                <p className="text-xs text-gov-secondary leading-relaxed font-medium">
                  {a.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gov-muted pt-1">
                  <span>Entity: <strong className="text-gov-primary font-mono">{a.entity_id}</strong> ({a.entity_name || a.district || a.state})</span>
                  <span>•</span>
                  <span>Detected: {a.detected_on}</span>
                  {a.reviewer_comment && (
                    <>
                      <span>•</span>
                      <span className="text-amber-700 dark:text-amber-400 font-medium italic">
                        Remark ({a.reviewer_role}): "{a.reviewer_comment}"
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                {a.entity_type === 'work' && (
                  <button
                    onClick={() => setSelectedWorkId(a.entity_id)}
                    className="px-3.5 py-1.5 bg-gov-card hover:bg-gov-card-muted text-gov-primary text-xs font-semibold rounded-xl border border-gov-border transition cursor-pointer"
                  >
                    Work Dossier
                  </button>
                )}
                <button
                  onClick={() => setOpenTriageAlertId(a.alert_id)}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Triage Decision</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
