import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { AnomalyAlert, Severity, AlertStatus } from '../types';
import { 
  Eye, 
  Download, 
  AlertTriangle, 
  CheckSquare, 
  Square
} from 'lucide-react';

export const RecentAlertsTable: React.FC = () => {
  const { selectedState, selectedSeverity, setSelectedWorkId, setOpenTriageAlertId, t } = useApp();
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [selectedAlertIds, setSelectedAlertIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    api.getAlerts(selectedSeverity, 'All', selectedState).then((data) => {
      setAlerts(data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [selectedState, selectedSeverity]);

  const toggleSelectAll = () => {
    if (selectedAlertIds.size === alerts.length) {
      setSelectedAlertIds(new Set());
    } else {
      setSelectedAlertIds(new Set(alerts.map((a) => a.alert_id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedAlertIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAlertIds(next);
  };

  const exportCSV = () => {
    const rows = [
      ["Alert ID", "Entity Type", "Entity ID", "Entity / Location", "Alert Type", "Severity", "Risk Score", "Status", "Detected On", "Description"],
      ...alerts.map(a => [
        a.alert_id,
        a.entity_type,
        a.entity_id,
        `"${a.entity_name || ''}"`,
        `"${a.alert_type}"`,
        a.severity,
        a.risk_score,
        a.status,
        a.detected_on,
        `"${a.description.replace(/"/g, '""')}"`
      ])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MPLADS_Anomaly_Alerts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/40';
      case 'High':
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/40';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40';
      default:
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40';
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'Open':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
      case 'Under Review':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40';
      case 'Resolved':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40';
      case 'False Positive':
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/40';
    }
  };

  const displayedAlerts = alerts.slice(0, 10);

  return (
    <div className="bg-gov-card border border-gov-border rounded-2xl p-4 shadow-gov animate-fade-in">
      {/* Table Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-sm font-bold text-gov-primary flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            {t('recent_alerts')}
          </h3>
          <span className="text-xs bg-gov-card-muted text-gov-muted px-2.5 py-0.5 rounded-full border border-gov-border font-mono font-bold">
            {alerts.length} total anomalies
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 bg-gov-card hover:bg-gov-card-muted text-gov-primary text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-gov-border hover:border-slate-400 dark:hover:border-slate-500 transition shadow-xs cursor-pointer"
            title="Export full alerts log to CSV for audit"
          >
            <Download className="w-3.5 h-3.5 text-gov-muted" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gov-border">
        <table className="w-full text-left text-xs text-gov-secondary">
          <thead className="bg-slate-100 dark:bg-slate-900/90 text-gov-primary uppercase tracking-wider font-bold border-b border-gov-border">
            <tr>
              <th className="p-3 w-8">
                <button onClick={toggleSelectAll} className="text-gov-muted hover:text-gov-primary cursor-pointer">
                  {selectedAlertIds.size === alerts.length && alerts.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-orange-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-3">{t('work_id')}</th>
              <th className="p-3">{t('mp')}</th>
              <th className="p-3">{t('district')}</th>
              <th className="p-3">{t('type')}</th>
              <th className="p-3">{t('severity')}</th>
              <th className="p-3">{t('status')}</th>
              <th className="p-3 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gov-border">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td colSpan={8} className="p-3">
                    <div className="h-6 skeleton-shimmer w-full"></div>
                  </td>
                </tr>
              ))
            ) : displayedAlerts.map((a) => {
              const isSelected = selectedAlertIds.has(a.alert_id);
              return (
                <tr
                  key={a.alert_id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${isSelected ? 'bg-orange-50/40 dark:bg-slate-800/40' : ''}`}
                >
                  <td className="p-3">
                    <button onClick={() => toggleSelect(a.alert_id)} className="text-gov-muted hover:text-gov-primary cursor-pointer">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="p-3 font-mono font-bold text-gov-primary">
                    <button
                      onClick={() => a.entity_type === 'work' ? setSelectedWorkId(a.entity_id) : setOpenTriageAlertId(a.alert_id)}
                      className="hover:text-orange-600 dark:hover:text-orange-400 hover:underline cursor-pointer"
                    >
                      {a.entity_id}
                    </button>
                  </td>
                  <td className="p-3 font-semibold text-gov-primary">
                    {a.entity_name ? a.entity_name.split('(')[0].trim() : 'Hon\'ble MP'}
                  </td>
                  <td className="p-3 text-gov-muted font-medium">
                    {a.district || a.state || 'Nodal'}
                  </td>
                  <td className="p-3 font-medium text-gov-primary">
                    <span className="truncate max-w-[200px] block font-medium" title={a.alert_type}>
                      {a.alert_type}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(a.severity)}`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(a.status)}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    <button
                      onClick={() => setOpenTriageAlertId(a.alert_id)}
                      className="p-1.5 rounded-full text-gov-muted hover:text-orange-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-gov-border transition cursor-pointer"
                      title="Inspect & Triage Anomaly Alert"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer count indicator */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-gov-border text-xs text-gov-muted font-medium">
        <span>Showing 1–{displayedAlerts.length} of {alerts.length}</span>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 rounded-xl bg-gov-card border border-gov-border hover:bg-gov-card-muted transition disabled:opacity-40 cursor-pointer" disabled>
            &lt;
          </button>
          <button className="px-3 py-1 rounded-xl bg-gov-card border border-gov-border hover:bg-gov-card-muted transition cursor-pointer">
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};
