import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Flame,
  Filter,
  FileSearch,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldAlert,
} from 'lucide-react';
import apiClient from '../lib/api';
import { AlertItem } from '../types';
import RiskBadge from '../components/risk/RiskBadge';

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detectorFilter, setDetectorFilter] = useState('');

  // Dismiss Modal State
  const [dismissModalAlert, setDismissModalAlert] = useState<AlertItem | null>(null);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissing, setDismissing] = useState(false);

  // Review Modal State
  const [reviewModalAlert, setReviewModalAlert] = useState<AlertItem | null>(null);

  const navigate = useNavigate();

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
      };
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;
      if (detectorFilter) params.detector = detectorFilter;

      const res = await apiClient.get('/alerts', { params });
      setAlerts(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, severityFilter, statusFilter, detectorFilter]);

  const handleEscalate = async (alertId: string) => {
    try {
      const res = await apiClient.post(`/alerts/${alertId}/escalate`, {
        notes: 'Escalated from Alert Queue triage screen.',
      });
      navigate(`/cases/${res.data.case_id}`);
    } catch (err) {
      console.error('Escalation failed:', err);
    }
  };

  const handleDismissSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dismissModalAlert || !dismissReason.trim()) return;
    setDismissing(true);
    try {
      await apiClient.post(`/alerts/${dismissModalAlert.id}/dismiss`, {
        reason: dismissReason,
      });
      setDismissModalAlert(null);
      setDismissReason('');
      fetchAlerts();
    } catch (err) {
      console.error('Dismissal failed:', err);
    } finally {
      setDismissing(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E3E6EA]">
        <div>
          <h1 className="text-xl font-bold text-[#1A1D22] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#B3261E]" />
            Anomaly & Risk Alert Queue
          </h1>
          <p className="text-xs text-[#5B6270] mt-0.5">
            Triage stream of threshold-crossing project risk signals requiring audit validation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-white px-3 py-1.5 rounded border border-[#E3E6EA] font-medium text-[#5B6270] shadow-sm tabular-nums">
            Total Alerts: <span className="font-bold text-[#1A1D22]">{total}</span>
          </span>
          <button
            onClick={fetchAlerts}
            className="p-1.5 bg-white border border-[#E3E6EA] rounded hover:bg-[#F0F2F5] text-[#5B6270] shadow-sm"
            title="Refresh Alert Feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded border border-[#E3E6EA] shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-[#5B6270] font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#F7F8FA] border border-[#E3E6EA] rounded px-2.5 py-1 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C]"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#F7F8FA] border border-[#E3E6EA] rounded px-2.5 py-1 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C]"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
          </select>
        </div>

        <div>
          <select
            value={detectorFilter}
            onChange={(e) => {
              setDetectorFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#F7F8FA] border border-[#E3E6EA] rounded px-2.5 py-1 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C]"
          >
            <option value="">All Detectors</option>
            <option value="D1">D1: Cost Benchmarking</option>
            <option value="D2">D2: Payment Mismatch</option>
            <option value="D3">D3: Duplicate Works</option>
            <option value="D4">D4: Execution Staleness</option>
            <option value="D5">D5: Multivariate Outlier</option>
            <option value="D6">D6: Local Density (LOF)</option>
            <option value="D7">D7: Contractor Graph Risk</option>
            <option value="D8">D8: Approval Velocity</option>
          </select>
        </div>

        {(severityFilter || statusFilter || detectorFilter) && (
          <button
            onClick={() => {
              setSeverityFilter('');
              setStatusFilter('');
              setDetectorFilter('');
              setPage(1);
            }}
            className="text-[#B3261E] hover:underline font-medium ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded border border-[#E3E6EA] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-xs text-[#5B6270]">
            <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#1B4F8C]" />
            Loading alert records...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8A92A0]">
            No alerts found matching the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] border-b border-[#E3E6EA] text-[#5B6270] font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Alert Code & Project</th>
                  <th className="px-3 py-2.5">Severity</th>
                  <th className="px-3 py-2.5">Detector</th>
                  <th className="px-4 py-2.5">Reason & Anomaly Description</th>
                  <th className="px-3 py-2.5">Location</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Triage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6EA]">
                {alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F7F8FA] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-[#1B4F8C] text-[11px]">{a.alert_code}</div>
                      <button
                        onClick={() => navigate(`/projects/${a.project_id}`)}
                        className="font-semibold text-[#1A1D22] hover:underline text-xs flex items-center gap-1 text-left"
                      >
                        {a.project_code}
                      </button>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <RiskBadge band={a.severity} size="sm" />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-[11px] bg-[#E8F0FA] text-[#1B4F8C] px-1.5 py-0.5 rounded border border-[#C5D9F1]">
                        {a.detector_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <div className="text-xs text-[#1A1D22] font-medium leading-relaxed">
                        {a.description}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-[#5B6270]">
                      <div>{a.state_name}</div>
                      <div className="text-[10px] text-[#8A92A0]">{a.district_name}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          a.status === 'New'
                            ? 'bg-[#FCE8E6] text-[#B3261E]'
                            : a.status === 'Under Review'
                            ? 'bg-[#FEF9E7] text-[#B98900]'
                            : a.status === 'Resolved'
                            ? 'bg-[#EAF5EC] text-[#2E7D46]'
                            : 'bg-[#F0F2F5] text-[#5B6270]'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setReviewModalAlert(a)}
                        className="px-2 py-1 rounded bg-white border border-[#E3E6EA] hover:bg-[#F0F2F5] text-[#1A1D22] text-[11px] font-medium shadow-sm"
                      >
                        Quick Review
                      </button>
                      {a.status === 'New' && (
                        <>
                          <button
                            onClick={() => handleEscalate(a.id)}
                            className="px-2 py-1 rounded bg-[#1B4F8C] hover:bg-[#143D6D] text-white text-[11px] font-semibold shadow-sm"
                          >
                            Escalate
                          </button>
                          <button
                            onClick={() => setDismissModalAlert(a)}
                            className="px-2 py-1 rounded bg-white border border-[#F5C2BE] text-[#B3261E] hover:bg-[#FCE8E6] text-[11px] font-medium"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-3 bg-[#F7F8FA] border-t border-[#E3E6EA] flex items-center justify-between text-xs text-[#5B6270]">
          <div>
            Page <span className="font-semibold text-[#1A1D22]">{page}</span> of{' '}
            <span className="font-semibold text-[#1A1D22]">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-2.5 py-1 rounded bg-white border border-[#E3E6EA] hover:bg-[#F0F2F5] disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-2.5 py-1 rounded bg-white border border-[#E3E6EA] hover:bg-[#F0F2F5] disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dismissal as False Positive Modal */}
      {dismissModalAlert && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E3E6EA]">
            <div className="flex items-center gap-2 text-[#B3261E]">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[#1A1D22]">
                Dismiss Alert as False Positive ({dismissModalAlert.alert_code})
              </h3>
            </div>

            <p className="text-xs text-[#5B6270] leading-relaxed">
              To ensure compliance and auditability, MoSPI governance requires recording a justification reason. This action will be permanently recorded in the append-only audit trail.
            </p>

            <form onSubmit={handleDismissSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1D22] mb-1">
                  Justification Reason (Required for Audit Trail)
                </label>
                <textarea
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  required
                  placeholder="e.g. Field measurement verifies rock excavation justified initial higher payment release under approved revised schedule."
                  rows={3}
                  className="w-full bg-[#F7F8FA] border border-[#E3E6EA] rounded p-2.5 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C] focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDismissModalAlert(null)}
                  className="px-3 py-1.5 rounded border border-[#E3E6EA] text-xs font-medium text-[#5B6270] hover:bg-[#F0F2F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dismissing || !dismissReason.trim()}
                  className="px-4 py-1.5 rounded bg-[#B3261E] hover:bg-[#961F18] text-white text-xs font-semibold shadow-sm"
                >
                  {dismissing ? 'Recording...' : 'Confirm Dismissal & Write to Audit Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Review Modal */}
      {reviewModalAlert && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-xl w-full p-6 space-y-4 shadow-xl border border-[#E3E6EA]">
            <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#1B4F8C]">
                  {reviewModalAlert.alert_code}
                </span>
                <RiskBadge band={reviewModalAlert.severity} size="sm" />
              </div>
              <button
                onClick={() => setReviewModalAlert(null)}
                className="text-[#8A92A0] hover:text-[#1A1D22] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#8A92A0]">Project Reference:</span>
                <div className="font-bold text-[#1A1D22] mt-0.5">{reviewModalAlert.project_code} — {reviewModalAlert.project_title}</div>
              </div>

              <div className="p-3 bg-[#F7F8FA] rounded border border-[#E3E6EA]">
                <span className="font-semibold text-[#5B6270] uppercase text-[10px]">Detector Evidence Summary:</span>
                <div className="mt-1 text-[#1A1D22] leading-relaxed">{reviewModalAlert.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-[#F0F2F5] rounded">
                  <span className="text-[#8A92A0] text-[10px]">Detector Algorithm:</span>
                  <div className="font-mono font-bold text-[#1B4F8C]">{reviewModalAlert.detector_code}</div>
                </div>
                <div className="p-2.5 bg-[#F0F2F5] rounded">
                  <span className="text-[#8A92A0] text-[10px]">Model Confidence:</span>
                  <div className="font-semibold text-[#2E7D46]">{reviewModalAlert.confidence} Confidence</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#EEF0F3]">
              <button
                onClick={() => {
                  setReviewModalAlert(null);
                  navigate(`/projects/${reviewModalAlert.project_id}`);
                }}
                className="text-xs font-semibold text-[#1B4F8C] hover:underline flex items-center gap-1"
              >
                Inspect Full Project Detail <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReviewModalAlert(null)}
                  className="px-3 py-1.5 rounded border border-[#E3E6EA] text-xs font-medium text-[#5B6270] hover:bg-[#F0F2F5]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleEscalate(reviewModalAlert.id);
                    setReviewModalAlert(null);
                  }}
                  className="px-3.5 py-1.5 rounded bg-[#1B4F8C] hover:bg-[#143D6D] text-white text-xs font-semibold shadow-sm"
                >
                  Escalate to Investigation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
