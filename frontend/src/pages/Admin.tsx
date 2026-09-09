import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  Save,
  ShieldCheck,
  History,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RefreshCw,
  Eye,
} from 'lucide-react';
import apiClient from '../lib/api';
import { AuditLogItem } from '../types';

export const Admin: React.FC = () => {
  const [weights, setWeights] = useState<Record<string, number>>({
    D1: 0.18,
    D2: 0.22,
    D3: 0.2,
    D4: 0.12,
    D5: 0.1,
    D6: 0.08,
    D7: 0.06,
    D8: 0.04,
  });
  const [savingWeights, setSavingWeights] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Batch re-scoring state
  const [scoringRunning, setScoringRunning] = useState(false);
  const [scoringResult, setScoringResult] = useState<any | null>(null);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<AuditLogItem | null>(null);

  const fetchConfig = async () => {
    try {
      const res = await apiClient.get('/admin/config');
      setWeights(res.data.weights);
    } catch (err) {
      console.error('Failed to load weights config:', err);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await apiClient.get('/admin/audit-log', { params: { page_size: 20 } });
      setAuditLogs(res.data.items);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchAuditLogs();
  }, []);

  const handleWeightChange = (detectorCode: string, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [detectorCode]: parseFloat(value.toFixed(2)),
    }));
  };

  const handleSaveConfig = async () => {
    setSavingWeights(true);
    try {
      await apiClient.patch('/admin/config', { weights });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSavingWeights(false);
    }
  };

  const handleTriggerRecompute = async () => {
    setScoringRunning(true);
    setScoringResult(null);
    try {
      const res = await apiClient.post('/admin/recompute');
      setScoringResult(res.data);
      fetchAuditLogs();
    } catch (err) {
      console.error('Scoring execution failed:', err);
    } finally {
      setScoringRunning(false);
    }
  };

  const detectorLabels: Record<string, { name: string; desc: string }> = {
    D1: { name: 'D1: Cost Benchmarking', desc: 'Log-cost modified z-score against peer state/category medians' },
    D2: { name: 'D2: Payment-Progress Mismatch', desc: 'Disbursal percentage exceeding physical completion gap' },
    D3: { name: 'D3: Duplicate Works', desc: 'TF-IDF semantic similarity + Haversine geospatial proximity' },
    D4: { name: 'D4: Execution Staleness', desc: 'Days since last progress update vs category duration' },
    D5: { name: 'D5: Multivariate Outlier (Isolation Forest)', desc: 'Unsupervised multi-dimensional anomaly path length' },
    D6: { name: 'D6: Local Density Outlier (LOF)', desc: 'District-category local density deviation' },
    D7: { name: 'D7: Contractor Graph Risk', desc: 'NetworkX graph degree centrality and repeat award clusters' },
    D8: { name: 'D8: Approval Velocity', desc: 'Percentile ranking of approval-to-sanction duration' },
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E3E6EA]">
        <div>
          <h1 className="text-xl font-bold text-[#1A1D22] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#1B4F8C]" />
            Administration & Risk Engine Configuration
          </h1>
          <p className="text-xs text-[#5B6270] mt-0.5">
            Tune detector weighting models, execute batch re-scoring, and inspect immutable audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerRecompute}
            disabled={scoringRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#B3261E] hover:bg-[#961F18] text-white rounded text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{scoringRunning ? 'Recomputing Telemetry...' : 'Trigger Batch Re-scoring'}</span>
          </button>
        </div>
      </div>

      {/* Batch Execution Feedback Card */}
      {scoringResult && (
        <div className="p-4 bg-[#EAF5EC] border border-[#BDE3C4] rounded shadow-sm text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#2E7D46]">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <div className="font-bold text-sm">Batch Re-scoring Completed Successfully</div>
              <div className="text-[11px] text-[#1A1D22] mt-0.5">
                Scored <strong>{scoringResult.total_projects_scored.toLocaleString()} projects</strong> in{' '}
                <span className="font-mono font-bold text-[#1B4F8C]">{scoringResult.execution_time_ms} ms</span> · Generated{' '}
                <strong>{scoringResult.critical_alerts_generated} Critical</strong> and{' '}
                <strong>{scoringResult.high_alerts_generated} High</strong> alerts.
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#5B6270]">Logged in Audit Trail</span>
        </div>
      )}

      {/* Grid: Detector Weights Tuning & Live Sliders */}
      <div className="bg-white p-5 rounded border border-[#E3E6EA] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-3">
          <div>
            <div className="font-bold text-sm text-[#1A1D22]">Composite Risk Engine Weights (D1 to D8)</div>
            <div className="text-[11px] text-[#5B6270]">
              Adjust relative weights dynamically. Total weight: <span className="font-mono font-bold">{totalWeight.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={handleSaveConfig}
            disabled={savingWeights}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1B4F8C] hover:bg-[#143D6D] text-white rounded text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingWeights ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Weights Config'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(weights).map(([code, val]) => {
            const meta = detectorLabels[code] || { name: code, desc: 'Detector signal' };
            return (
              <div key={code} className="p-3 bg-[#F7F8FA] rounded border border-[#E3E6EA] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#1A1D22]">{meta.name}</div>
                  <span className="font-mono font-bold text-sm text-[#1B4F8C] bg-white px-2 py-0.5 rounded border border-[#E3E6EA]">
                    {val.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-[#5B6270] leading-tight">{meta.desc}</p>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] text-[#8A92A0]">0.0</span>
                  <input
                    type="range"
                    min={0}
                    max={0.5}
                    step={0.01}
                    value={val}
                    onChange={(e) => handleWeightChange(code, parseFloat(e.target.value))}
                    className="w-full accent-[#1B4F8C] cursor-pointer"
                  />
                  <span className="text-[10px] text-[#8A92A0]">0.5</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immutable System Audit Log Table */}
      <div className="bg-white rounded border border-[#E3E6EA] shadow-sm overflow-hidden space-y-3 p-4">
        <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-3">
          <div>
            <div className="font-bold text-sm text-[#1A1D22] flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#1B4F8C]" />
              Immutable System Audit Log
            </div>
            <div className="text-[11px] text-[#5B6270]">
              Append-only permanent ledger of all alert state mutations, case decisions, and model adjustments.
            </div>
          </div>
          <button
            onClick={fetchAuditLogs}
            className="p-1.5 bg-[#F7F8FA] border border-[#E3E6EA] rounded hover:bg-[#F0F2F5] text-[#5B6270]"
            title="Refresh Log"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8FA] text-[#5B6270] border-b border-[#E3E6EA] font-semibold">
              <tr>
                <th className="px-3 py-2.5">Timestamp</th>
                <th className="px-3 py-2.5">Actor & Role</th>
                <th className="px-3 py-2.5">Action Event</th>
                <th className="px-3 py-2.5">Entity Type</th>
                <th className="px-3 py-2.5">Reason / Justification</th>
                <th className="px-3 py-2.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E6EA]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F7F8FA] transition-colors">
                  <td className="px-3 py-2.5 font-mono text-[11px] text-[#5B6270] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="font-semibold text-[#1A1D22]">{log.actor_name}</div>
                    <div className="text-[10px] text-[#8A92A0]">{log.actor_role}</div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-mono font-bold text-[10px] bg-[#E8F0FA] text-[#1B4F8C] px-1.5 py-0.5 rounded border border-[#C5D9F1]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-[#5B6270] font-medium">{log.entity_type}</td>
                  <td className="px-3 py-2.5 max-w-xs text-[#1A1D22] truncate">{log.reason || '—'}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => setSelectedAuditEntry(log)}
                      className="p-1 text-[#5B6270] hover:text-[#1B4F8C] rounded hover:bg-[#E8F0FA]"
                      title="Inspect State Diff"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* State Diff Inspector Modal */}
      {selectedAuditEntry && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-xl w-full p-6 space-y-4 shadow-xl border border-[#E3E6EA]">
            <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-2">
              <div className="font-bold text-sm text-[#1A1D22] flex items-center gap-2">
                <History className="w-4 h-4 text-[#1B4F8C]" />
                Audit Trail Event Details ({selectedAuditEntry.action})
              </div>
              <button
                onClick={() => setSelectedAuditEntry(null)}
                className="text-[#8A92A0] hover:text-[#1A1D22] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#F7F8FA] rounded">
                <div>
                  <span className="text-[#8A92A0]">Actor:</span> {selectedAuditEntry.actor_name} ({selectedAuditEntry.actor_role})
                </div>
                <div>
                  <span className="text-[#8A92A0]">Timestamp:</span> {new Date(selectedAuditEntry.created_at).toLocaleString()}
                </div>
              </div>

              {selectedAuditEntry.reason && (
                <div className="p-2.5 bg-[#F0F2F5] rounded">
                  <span className="font-semibold text-[#5B6270]">Recorded Justification:</span>
                  <div className="text-[#1A1D22] mt-0.5">{selectedAuditEntry.reason}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-[#8A92A0] uppercase text-[10px]">Before State:</span>
                  <pre className="mt-1 p-2 bg-[#F7F8FA] border border-[#E3E6EA] rounded text-[10px] font-mono overflow-x-auto max-h-40">
                    {JSON.stringify(selectedAuditEntry.before_state || {}, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="font-semibold text-[#8A92A0] uppercase text-[10px]">After State:</span>
                  <pre className="mt-1 p-2 bg-[#F7F8FA] border border-[#E3E6EA] rounded text-[10px] font-mono overflow-x-auto max-h-40">
                    {JSON.stringify(selectedAuditEntry.after_state || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#EEF0F3]">
              <button
                onClick={() => setSelectedAuditEntry(null)}
                className="px-3.5 py-1.5 rounded bg-[#1B4F8C] text-white text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
