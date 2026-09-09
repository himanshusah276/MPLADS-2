import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  AlertTriangle,
  FileSearch,
  FolderGit2,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Clock,
  IndianRupee,
  ExternalLink,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import apiClient from '../lib/api';
import { DashboardSummary, ProjectListItem, AlertItem } from '../types';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/ui/MetricCard';
import RiskBadge from '../components/risk/RiskBadge';
import RiskBar from '../components/risk/RiskBar';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { role } = useAuth();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-xs text-[#5B6270]">
          <RefreshCw className="w-4 h-4 animate-spin text-[#1B4F8C]" />
          <span>Synchronizing real-time project risk indicators...</span>
        </div>
      </div>
    );
  }

  const { counts, top_risk_projects, recent_alerts, utilization_trend, delay_rate_trend, role_scope_label } = data;

  return (
    <div className="space-y-6">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E3E6EA]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1A1D22]">National Risk & Project Intelligence</h1>
            <span className="text-[11px] font-mono font-bold bg-[#E8F0FA] text-[#1B4F8C] px-2 py-0.5 rounded">
              Sep 2026 Active Cycle
            </span>
          </div>
          <p className="text-xs text-[#5B6270] mt-0.5">
            Continuous automated oversight across sanctioned MPLADS funds, expenditure velocity, and reported physical progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E3E6EA] rounded text-xs font-medium text-[#5B6270] hover:text-[#1A1D22] hover:bg-[#F0F2F5] transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => navigate('/alerts')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4F8C] hover:bg-[#143D6D] text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Triage Alert Queue ({counts.critical + counts.high_risk})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* e-SAKSHI Portal Integration & Scheme Macro Telemetry */}
      <div className="bg-gradient-to-r from-[#1B4F8C]/10 via-[#F8FAFC] to-[#1B4F8C]/5 rounded border border-[#1B4F8C]/20 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E3E6EA]">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1A1D22]">Official e-SAKSHI DigiGov Portal Data Feed</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span>LIVE INGESTION</span>
                </span>
              </div>
              <p className="text-[11px] text-[#5B6270]">
                Source: MoSPI Data Informatics and Innovation Division (DIID) — <a href="https://mplads.mospi.gov.in/digigov/dashboard.html" target="_blank" rel="noreferrer" className="text-[#1B4F8C] hover:underline inline-flex items-center gap-0.5">mplads.mospi.gov.in/digigov <ExternalLink className="w-3 h-3" /></a>
              </p>
            </div>
          </div>

          {/* Tenure Selection */}
          <div className="flex items-center gap-1 bg-white p-1 rounded border border-[#E3E6EA] text-xs">
            <button className="px-2.5 py-1 bg-[#1B4F8C] text-white font-medium rounded shadow-xs text-[11px]">
              18th Lok Sabha (2024-29)
            </button>
            <button className="px-2.5 py-1 text-[#5B6270] hover:text-[#1A1D22] font-medium rounded text-[11px]">
              17th Lok Sabha
            </button>
            <button className="px-2.5 py-1 text-[#5B6270] hover:text-[#1A1D22] font-medium rounded text-[11px]">
              Rajya Sabha
            </button>
          </div>
        </div>

        {/* e-SAKSHI National Scheme Macro Figures */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
          <div className="bg-white/80 rounded p-2.5 border border-[#E3E6EA]/80">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5B6270]">Works Recommended</div>
            <div className="text-sm font-bold text-[#1A1D22] mt-0.5 font-mono">1,21,480 works</div>
            <div className="text-[11px] text-[#1B4F8C] font-semibold">₹33,123.85 Cr</div>
          </div>
          <div className="bg-white/80 rounded p-2.5 border border-[#E3E6EA]/80">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5B6270]">Works Sanctioned</div>
            <div className="text-sm font-bold text-[#1A1D22] mt-0.5 font-mono">88,412 works</div>
            <div className="text-[11px] text-emerald-700 font-semibold">₹4,466.38 Cr</div>
          </div>
          <div className="bg-white/80 rounded p-2.5 border border-[#E3E6EA]/80">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5B6270]">Works Completed</div>
            <div className="text-sm font-bold text-[#1A1D22] mt-0.5 font-mono">52,190 works</div>
            <div className="text-[11px] text-indigo-700 font-semibold">₹859.40 Cr</div>
          </div>
          <div className="bg-white/80 rounded p-2.5 border border-[#E3E6EA]/80">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5B6270]">Total Entitlement</div>
            <div className="text-sm font-bold text-[#1A1D22] mt-0.5 font-mono">788 Active MPs</div>
            <div className="text-[11px] text-amber-700 font-semibold">₹38,450.00 Cr</div>
          </div>
        </div>
      </div>

      {/* Sentinel AI Continuous Risk Oversight KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          title="Critical Anomalies"
          value={counts.critical}
          change="Requires Immediate Triage"
          isNegative={true}
          icon={Flame}
          variant="critical"
        />
        <MetricCard
          title="High Risk Projects"
          value={counts.high_risk}
          change="D1-D8 Threshold Crossings"
          isNegative={true}
          icon={AlertTriangle}
          variant="warning"
        />
        <MetricCard
          title="Under Active Review"
          value={counts.under_review}
          subtext="Assigned to Field Auditors"
          icon={FileSearch}
          variant="default"
        />
        <MetricCard
          title="Monitored Works"
          value={counts.total_projects.toLocaleString()}
          subtext="Across All 36 States & UTs"
          icon={FolderGit2}
          variant="default"
        />
        <MetricCard
          title="Fund Sanctioned"
          value={`₹${(counts.total_fund_sanctioned / 10000000).toFixed(1)} Cr`}
          subtext="Active Scored Cohort"
          icon={IndianRupee}
          variant="success"
        />
      </div>


      {/* Main 2-Column Section: Top Risk Projects & Alert Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Top Ranked Projects with Inline RiskBar */}
        <div className="lg:col-span-2 bg-white rounded border border-[#E3E6EA] shadow-sm flex flex-col">
          <div className="p-4 border-b border-[#E3E6EA] flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-[#1A1D22]">Priority Risk Projects (Ranked by Anomaly Score)</div>
              <div className="text-[11px] text-[#5B6270]">Flagged by hybrid statistical benchmarks and unsupervised anomaly models</div>
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs font-semibold text-[#1B4F8C] hover:underline flex items-center gap-1"
            >
              View Full Directory ({counts.total_projects})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] border-b border-[#E3E6EA] text-[#5B6270] font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Project ID & Title</th>
                  <th className="px-3 py-2.5">State / District</th>
                  <th className="px-3 py-2.5">Sanctioned</th>
                  <th className="px-3 py-2.5">Risk Level</th>
                  <th className="px-3 py-2.5 w-44">Signal Contribution</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6EA]">
                {top_risk_projects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-[#F7F8FA] transition-colors group cursor-pointer"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-[#1B4F8C] text-[11px] group-hover:underline">
                        {p.project_code}
                      </div>
                      <div className="font-medium text-[#1A1D22] line-clamp-1 max-w-xs">{p.title}</div>
                      <div className="text-[10px] text-[#8A92A0]">{p.category}</div>
                    </td>
                    <td className="px-3 py-3 text-[#5B6270]">
                      <div>{p.state_name}</div>
                      <div className="text-[10px] text-[#8A92A0]">{p.district_name}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[#1A1D22] tabular-nums font-medium">
                      ₹{(p.sanctioned_cost / 100000).toFixed(1)}L
                    </td>
                    <td className="px-3 py-3">
                      <RiskBadge band={p.risk_band} score={p.current_risk_score} size="sm" />
                    </td>
                    <td className="px-3 py-3">
                      <RiskBar subscores={p.subscores} totalScore={p.current_risk_score} height="sm" />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${p.id}`);
                        }}
                        className="p-1 text-[#5B6270] hover:text-[#1B4F8C] rounded hover:bg-[#E8F0FA]"
                        title="Open Deep-Dive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Recent Critical Alerts Feed */}
        <div className="bg-white rounded border border-[#E3E6EA] shadow-sm flex flex-col">
          <div className="p-4 border-b border-[#E3E6EA] flex items-center justify-between">
            <div className="font-bold text-sm text-[#1A1D22] flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#B3261E]" />
              Recent Alert Triggers
            </div>
            <span className="text-[10px] font-mono bg-[#FCE8E6] text-[#B3261E] font-bold px-1.5 py-0.5 rounded">
              Live Queue
            </span>
          </div>

          <div className="p-3 space-y-2.5 overflow-y-auto max-h-[480px]">
            {recent_alerts.map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(`/alerts`)}
                className="p-3 rounded border border-[#E3E6EA] hover:border-[#1B4F8C] hover:bg-[#F7F8FA] transition-all cursor-pointer text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#1B4F8C] text-[11px]">{a.project_code}</span>
                  <RiskBadge band={a.severity} size="sm" />
                </div>
                <div className="font-medium text-[#1A1D22] leading-snug line-clamp-2">
                  {a.description}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#8A92A0] pt-1 border-t border-[#EEF0F3]">
                  <span>{a.state_name} · {a.district_name}</span>
                  <span className="font-mono font-bold text-[#5B6270]">{a.detector_code}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#E3E6EA] bg-[#F7F8FA]">
            <button
              onClick={() => navigate('/alerts')}
              className="w-full py-1.5 text-center text-xs font-semibold text-[#1B4F8C] hover:underline"
            >
              Open Alert Triage Workspace &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Analytics & Compliance Trends Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Utilization Trend Chart */}
        <div className="bg-white p-4 rounded border border-[#E3E6EA] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-xs text-[#1A1D22] uppercase tracking-wider">Fund Utilization Trajectory (%)</div>
              <div className="text-[11px] text-[#5B6270]">Monthly released fund utilization vs MoSPI compliance benchmark</div>
            </div>
            <TrendingUp className="w-4 h-4 text-[#1B4F8C]" />
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={utilization_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8A92A0' }} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: '#8A92A0' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3E6EA', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line
                  type="monotone"
                  dataKey="utilization_pct"
                  name="Actual Utilization %"
                  stroke="#1B4F8C"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark_pct"
                  name="Target Benchmark %"
                  stroke="#8A92A0"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delay Rate & Staleness Trend */}
        <div className="bg-white p-4 rounded border border-[#E3E6EA] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-xs text-[#1A1D22] uppercase tracking-wider">Milestone Delay & Staleness Rate</div>
              <div className="text-[11px] text-[#5B6270]">Average project delay days & proportion of stalled works</div>
            </div>
            <Clock className="w-4 h-4 text-[#C4551C]" />
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delay_rate_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8A92A0' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8A92A0' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3E6EA', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="avg_delay_days" name="Avg Delay (Days)" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="stalled_projects_pct" name="Stalled Works (%)" fill="#EF4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
