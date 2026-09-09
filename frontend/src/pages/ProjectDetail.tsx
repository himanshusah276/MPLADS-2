import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  UserCheck,
  Calendar,
  IndianRupee,
  MapPin,
  Flame,
  AlertTriangle,
  FileSearch,
  ExternalLink,
  ShieldCheck,
  Clock,
  Layers,
  FileText,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import apiClient from '../lib/api';
import { ProjectDetail as IProjectDetail } from '../types';
import RiskBadge from '../components/risk/RiskBadge';
import RiskBar from '../components/risk/RiskBar';
import SignalExplanation from '../components/risk/SignalExplanation';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<IProjectDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [escalating, setEscalating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const handleEscalate = async () => {
    if (!project) return;
    setEscalating(true);
    try {
      // Check if alert exists or find high risk alert
      const alertsRes = await apiClient.get('/alerts', { params: { status: 'New' } });
      const matchingAlert = alertsRes.data.items.find((a: any) => a.project_id === project.id);
      
      if (matchingAlert) {
        const res = await apiClient.post(`/alerts/${matchingAlert.id}/escalate`, {
          notes: `Formal case initiated from Project Detail inspection for ${project.project_code}.`
        });
        navigate(`/cases/${res.data.case_id}`);
      } else {
        // Navigate to case listing or trigger
        navigate('/cases');
      }
    } catch (err) {
      console.error('Escalation failed:', err);
    } finally {
      setEscalating(false);
    }
  };

  const copyCode = () => {
    if (project) {
      navigator.clipboard.writeText(project.project_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-[#5B6270]">
        Loading detailed telemetry and risk breakdown...
      </div>
    );
  }

  const totalPaid = project.payments.reduce((sum, p) => sum + p.amount, 0);
  const latestProgress = project.progress_updates.reduce((max, p) => Math.max(max, p.progress_pct), 0);
  const paymentPct = Math.round((totalPaid / Math.max(project.sanctioned_cost, 1)) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E3E6EA]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-[#E3E6EA] text-[#5B6270] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-[#1B4F8C]">
                {project.project_code}
              </span>
              <button
                onClick={copyCode}
                className="text-[#8A92A0] hover:text-[#1A1D22] transition-colors"
                title="Copy Project ID"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D46]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <RiskBadge band={project.risk_band} score={project.current_risk_score} size="md" />
            </div>
            <h1 className="text-base font-bold text-[#1A1D22] mt-0.5">{project.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/map`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E3E6EA] rounded text-xs font-medium text-[#5B6270] hover:text-[#1A1D22] hover:bg-[#F0F2F5] shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-[#1B4F8C]" />
            <span>View on Map</span>
          </button>
          <button
            onClick={handleEscalate}
            disabled={escalating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#B3261E] hover:bg-[#961F18] text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span>{escalating ? 'Opening Case...' : 'Escalate to Formal Investigation'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Explainable Risk Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Project Overview, Financials & Milestone Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white p-4 rounded border border-[#E3E6EA] shadow-sm space-y-4">
            <div className="text-xs font-bold text-[#1A1D22] uppercase tracking-wider border-b border-[#EEF0F3] pb-2">
              Administrative & Financial Profile
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-[#8A92A0] text-[11px]">Work Category</div>
                <div className="font-semibold text-[#1A1D22] mt-0.5">{project.category}</div>
              </div>
              <div>
                <div className="text-[#8A92A0] text-[11px]">State / District</div>
                <div className="font-semibold text-[#1A1D22] mt-0.5">{project.state_name} · {project.district_name}</div>
              </div>
              <div>
                <div className="text-[#8A92A0] text-[11px]">Recommending MP</div>
                <div className="font-semibold text-[#1A1D22] mt-0.5">{project.mp_name || 'Hon. MP'}</div>
              </div>
              <div>
                <div className="text-[#8A92A0] text-[11px]">Executing Agency</div>
                <div className="font-semibold text-[#1A1D22] mt-0.5">{project.agency_name || 'PWD Division'}</div>
              </div>
              <div>
                <div className="text-[#8A92A0] text-[11px]">Assigned Contractor</div>
                <div className="font-semibold text-[#1A1D22] mt-0.5">{project.contractor_name || 'Direct Execution'}</div>
              </div>
              <div>
                <div className="text-[#8A92A0] text-[11px]">Execution Status</div>
                <div className="font-semibold text-[#1A1D22] mt-0.5">{project.status}</div>
              </div>
            </div>

            {project.description && (
              <div className="pt-2 border-t border-[#EEF0F3]">
                <div className="text-[#8A92A0] text-[11px] mb-1">Sanction Scope Description</div>
                <div className="text-xs text-[#5B6270] leading-relaxed bg-[#F7F8FA] p-2.5 rounded border border-[#E3E6EA]">
                  {project.description}
                </div>
              </div>
            )}

            {project.location?.address && (
              <div className="flex items-center gap-1.5 text-xs text-[#5B6270] bg-[#F7F8FA] p-2 rounded">
                <MapPin className="w-3.5 h-3.5 text-[#1B4F8C] shrink-0" />
                <span><strong>Geotag Location:</strong> {project.location.address} ({project.location.latitude.toFixed(4)}, {project.location.longitude.toFixed(4)})</span>
              </div>
            )}
          </div>

          {/* Payment vs Physical Progress Overlay */}
          <div className="bg-white p-4 rounded border border-[#E3E6EA] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-2">
              <div className="text-xs font-bold text-[#1A1D22] uppercase tracking-wider">
                Payment Release vs Physical Progress Alignment
              </div>
              <span className="text-xs font-mono font-bold text-[#1A1D22]">
                Gap: {paymentPct - latestProgress}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-[#F7F8FA] rounded border border-[#E3E6EA]">
                <div className="text-[#8A92A0] text-[11px]">Sanctioned Cost</div>
                <div className="text-base font-bold font-mono text-[#1A1D22] mt-0.5">
                  ₹{(project.sanctioned_cost / 100000).toFixed(2)} Lakhs
                </div>
              </div>
              <div className="p-3 bg-[#F7F8FA] rounded border border-[#E3E6EA]">
                <div className="text-[#8A92A0] text-[11px]">Total Disbursed</div>
                <div className="text-base font-bold font-mono text-[#B3261E] mt-0.5">
                  ₹{(totalPaid / 100000).toFixed(2)}L ({paymentPct}%)
                </div>
              </div>
              <div className="p-3 bg-[#F7F8FA] rounded border border-[#E3E6EA]">
                <div className="text-[#8A92A0] text-[11px]">Reported Progress</div>
                <div className="text-base font-bold font-mono text-[#1B4F8C] mt-0.5">
                  {latestProgress}%
                </div>
              </div>
            </div>

            {/* Progress Bars Comparison */}
            <div className="space-y-2 pt-2">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-[#5B6270] mb-1">
                  <span>Disbursed Fund Ratio</span>
                  <span className="font-mono text-[#B3261E]">{paymentPct}%</span>
                </div>
                <div className="h-2 w-full bg-[#E3E6EA] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(paymentPct, 100)}%` }}
                    className="h-full bg-[#EF4444] rounded-full transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-[#5B6270] mb-1">
                  <span>Physical Progress Completed</span>
                  <span className="font-mono text-[#1B4F8C]">{latestProgress}%</span>
                </div>
                <div className="h-2 w-full bg-[#E3E6EA] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(latestProgress, 100)}%` }}
                    className="h-full bg-[#1B4F8C] rounded-full transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Registers Table */}
          <div className="bg-white rounded border border-[#E3E6EA] shadow-sm overflow-hidden">
            <div className="p-3 bg-[#F7F8FA] border-b border-[#E3E6EA] font-bold text-xs text-[#1A1D22]">
              Financial Disbursal Registers ({project.payments.length} Records)
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-white text-[#5B6270] border-b border-[#E3E6EA] font-semibold">
                <tr>
                  <th className="px-3 py-2">Payment ID</th>
                  <th className="px-3 py-2">Installment Stage</th>
                  <th className="px-3 py-2">Disbursal Date</th>
                  <th className="px-3 py-2 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6EA]">
                {project.payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-[#F7F8FA]">
                    <td className="px-3 py-2.5 font-mono font-bold text-[#1B4F8C]">{pay.payment_code}</td>
                    <td className="px-3 py-2.5 text-[#1A1D22]">{pay.installment_stage}</td>
                    <td className="px-3 py-2.5 text-[#5B6270] font-mono">{pay.payment_date}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-[#1A1D22]">
                      ₹{pay.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Progress Logs */}
          <div className="bg-white rounded border border-[#E3E6EA] shadow-sm overflow-hidden">
            <div className="p-3 bg-[#F7F8FA] border-b border-[#E3E6EA] font-bold text-xs text-[#1A1D22]">
              Physical Progress Inspections ({project.progress_updates.length} Updates)
            </div>
            <div className="divide-y divide-[#E3E6EA]">
              {project.progress_updates.map((prg) => (
                <div key={prg.id} className="p-3 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-[#1A1D22] flex items-center gap-2">
                      <span>Physical Milestone: {prg.progress_pct}%</span>
                      <span className="text-[10px] text-[#8A92A0] font-mono font-normal">
                        ({prg.update_date})
                      </span>
                    </div>
                    {prg.remarks && (
                      <div className="text-[11px] text-[#5B6270] mt-1">{prg.remarks}</div>
                    )}
                    <div className="text-[10px] text-[#8A92A0] mt-0.5">Inspected by: {prg.submitted_by}</div>
                  </div>
                  <span className="font-mono font-bold text-[#1B4F8C] text-sm tabular-nums">
                    {prg.progress_pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Explainable Risk Panel & Duplicate Comparison */}
        <div className="space-y-6">
          {/* Main Risk Score Card */}
          <div className="bg-white p-4 rounded border border-[#E3E6EA] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-2">
              <span className="text-xs font-bold text-[#1A1D22] uppercase tracking-wider">
                Risk Engine Evaluation
              </span>
              <span className="text-[10px] text-[#5B6270] font-mono font-medium">
                Scored: {new Date(project.last_scored_at).toLocaleDateString()}
              </span>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-between bg-[#F7F8FA] p-3.5 rounded border border-[#E3E6EA]">
              <div>
                <div className="text-[11px] text-[#8A92A0] font-semibold uppercase">Composite Risk Score</div>
                <div className="text-3xl font-extrabold font-mono text-[#1A1D22] mt-0.5">
                  {project.current_risk_score}
                  <span className="text-sm font-normal text-[#8A92A0]"> / 100</span>
                </div>
              </div>
              <RiskBadge band={project.risk_band} size="lg" />
            </div>

            {/* Stacked Risk Proportion Bar */}
            <div>
              <div className="text-[11px] font-semibold text-[#5B6270] mb-1.5">
                Subscore Contributions Across 8 Detectors
              </div>
              <RiskBar
                subscores={project.risk_breakdown.subscores}
                totalScore={project.current_risk_score}
                height="md"
                showLabels={true}
              />
            </div>

            {/* Natural-Language Explanation Bullets */}
            <div className="pt-2">
              <SignalExplanation
                reasons={project.risk_breakdown.reasons}
                confidence={project.risk_breakdown.confidence}
              />
            </div>
          </div>

          {/* Related Duplicate Projects Candidate Box */}
          {project.duplicate_candidates.length > 0 && (
            <div className="bg-white p-4 rounded border border-[#E3E6EA] shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-2">
                <span className="text-xs font-bold text-[#1A1D22] uppercase tracking-wider flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Potential Duplicate Sanctions ({project.duplicate_candidates.length})
                </span>
                <span className="text-[10px] font-bold text-[#C4551C] bg-[#FDF2E9] px-1.5 py-0.5 rounded">
                  D3 Detector
                </span>
              </div>

              <p className="text-[11px] text-[#5B6270] leading-snug">
                The TF-IDF similarity and geospatial proximity detectors flagged overlapping project scopes within 3km:
              </p>

              <div className="space-y-2">
                {project.duplicate_candidates.map((dc) => (
                  <div
                    key={dc.project_id}
                    onClick={() => navigate(`/projects/${dc.project_id}`)}
                    className="p-3 rounded border border-[#E3E6EA] hover:border-[#1B4F8C] hover:bg-[#F7F8FA] cursor-pointer transition-all text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#1B4F8C]">{dc.project_code}</span>
                      <span className="text-[10px] font-bold bg-[#FEF9E7] text-[#B98900] px-1.5 py-0.2 rounded border border-[#FCEAB3]">
                        {Math.round(dc.similarity_score * 100)}% Match · {dc.distance_km} km
                      </span>
                    </div>
                    <div className="font-medium text-[#1A1D22] line-clamp-1">{dc.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-[#8A92A0] pt-1">
                      <span>Sanctioned: ₹{(dc.sanctioned_cost / 100000).toFixed(1)}L</span>
                      <span>Date: {dc.sanction_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
