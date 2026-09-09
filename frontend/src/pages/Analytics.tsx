import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import apiClient from '../lib/api';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analytics/overview');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-[#5B6270]">
        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#1B4F8C]" />
        Aggregating system analytics and model telemetry...
      </div>
    );
  }

  const {
    category_distribution,
    false_positive_rate_by_detector,
    state_utilization_trends,
    mean_time_to_resolution_days,
    detector_accuracy_metrics,
  } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E3E6EA]">
        <div>
          <h1 className="text-xl font-bold text-[#1A1D22] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#1B4F8C]" />
            Analytics & Model Accuracy Metrics
          </h1>
          <p className="text-xs text-[#5B6270] mt-0.5">
            Statistical distribution, false-positive feedback loops, and detector precision telemetry.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E3E6EA] rounded text-xs font-medium text-[#5B6270] hover:bg-[#F0F2F5] shadow-sm self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Model Health / Telemetry Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded border border-[#E3E6EA] border-l-[3px] border-l-[#1B4F8C] shadow-sm">
          <div className="flex items-center justify-between text-[#8A92A0] text-xs">
            <span>Overall Model Precision</span>
            <CheckCircle2 className="w-4 h-4 text-[#2E7D46]" />
          </div>
          <div className="text-2xl font-bold text-[#1A1D22] mt-1 tabular-nums">
            {detector_accuracy_metrics.overall_precision}%
          </div>
          <div className="text-[11px] text-[#5B6270] mt-0.5">Validated against ground truth</div>
        </div>

        <div className="bg-white p-4 rounded border border-[#E3E6EA] border-l-[3px] border-l-[#2E7D46] shadow-sm">
          <div className="flex items-center justify-between text-[#8A92A0] text-xs">
            <span>Anomaly Recall Rate</span>
            <Activity className="w-4 h-4 text-[#1B4F8C]" />
          </div>
          <div className="text-2xl font-bold text-[#1A1D22] mt-1 tabular-nums">
            {detector_accuracy_metrics.overall_recall}%
          </div>
          <div className="text-[11px] text-[#5B6270] mt-0.5">Surfaced in Top-20 ranking</div>
        </div>

        <div className="bg-white p-4 rounded border border-[#E3E6EA] border-l-[3px] border-l-[#C4551C] shadow-sm">
          <div className="flex items-center justify-between text-[#8A92A0] text-xs">
            <span>Mean Scoring Latency</span>
            <Zap className="w-4 h-4 text-[#C4551C]" />
          </div>
          <div className="text-2xl font-bold text-[#1A1D22] mt-1 tabular-nums">
            {detector_accuracy_metrics.mean_scoring_latency_ms} ms
          </div>
          <div className="text-[11px] text-[#5B6270] mt-0.5">Single-project evaluation</div>
        </div>

        <div className="bg-white p-4 rounded border border-[#E3E6EA] border-l-[3px] border-l-[#8A92A0] shadow-sm">
          <div className="flex items-center justify-between text-[#8A92A0] text-xs">
            <span>Mean Time to Resolution</span>
            <TrendingUp className="w-4 h-4 text-[#1A1D22]" />
          </div>
          <div className="text-2xl font-bold text-[#1A1D22] mt-1 tabular-nums">
            {mean_time_to_resolution_days} Days
          </div>
          <div className="text-[11px] text-[#5B6270] mt-0.5">Alert to recorded determination</div>
        </div>
      </div>

      {/* Main Charts: False Positive Rate by Detector & Category Risk Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* False Positive Rate by Detector (Auditor Feedback Loop) */}
        <div className="bg-white p-4 rounded border border-[#E3E6EA] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-[#1A1D22] uppercase tracking-wider">
                False-Positive Feedback Rate by Detector (%)
              </div>
              <div className="text-[11px] text-[#5B6270]">
                Calibrated from formal investigator decisions (D1 to D8)
              </div>
            </div>
            <Sliders className="w-4 h-4 text-[#1B4F8C]" />
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={false_positive_rate_by_detector}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
                <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 10, fill: '#8A92A0' }} />
                <YAxis dataKey="code" type="category" tick={{ fontSize: 11, fill: '#1A1D22', fontWeight: 600 }} />
                <Tooltip
                  formatter={(val: any) => [`${val}% FP Rate`, 'False Positive Rate']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3E6EA', fontSize: '11px' }}
                />
                <Bar dataKey="fp_rate" name="FP Rate (%)" fill="#1B4F8C" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Risk Profile */}
        <div className="bg-white p-4 rounded border border-[#E3E6EA] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-[#1A1D22] uppercase tracking-wider">
                Average Risk Index by Work Category
              </div>
              <div className="text-[11px] text-[#5B6270]">
                Sectoral risk concentration across civil, social, and energy works
              </div>
            </div>
            <BarChart3 className="w-4 h-4 text-[#C4551C]" />
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={category_distribution}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 9, fill: '#5B6270' }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[0, 60]} tick={{ fontSize: 10, fill: '#8A92A0' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}/100`, 'Avg Risk Score']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3E6EA', fontSize: '11px' }}
                />
                <Bar dataKey="avg_risk_score" name="Avg Risk Index" fill="#C4551C" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* State Utilization vs Flagged Projects Table */}
      <div className="bg-white rounded border border-[#E3E6EA] shadow-sm overflow-hidden">
        <div className="p-3.5 bg-[#F7F8FA] border-b border-[#E3E6EA] flex items-center justify-between">
          <div className="font-bold text-xs text-[#1A1D22] uppercase tracking-wider">
            State-Level Implementation & Risk Cross-Tabulation
          </div>
          <span className="text-[11px] text-[#5B6270]">6 State Nodal Divisions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-[#5B6270] border-b border-[#E3E6EA] font-semibold">
              <tr>
                <th className="px-4 py-2.5">State Name</th>
                <th className="px-3 py-2.5">Active Projects</th>
                <th className="px-3 py-2.5">Fund Utilization Rate</th>
                <th className="px-3 py-2.5">Mean State Risk Score</th>
                <th className="px-3 py-2.5 text-right">Critical Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E6EA]">
              {state_utilization_trends.map((st: any) => (
                <tr key={st.state} className="hover:bg-[#F7F8FA]">
                  <td className="px-4 py-3 font-semibold text-[#1A1D22]">{st.state}</td>
                  <td className="px-3 py-3 text-[#5B6270] font-mono tabular-nums">{st.active_projects}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[#E3E6EA] h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${st.utilization_pct}%` }}
                          className="h-full bg-[#1B4F8C]"
                        />
                      </div>
                      <span className="font-mono font-medium text-[#1A1D22]">{st.utilization_pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-[#5B6270]">{st.avg_risk} / 100</td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-mono font-bold text-[#B3261E] bg-[#FCE8E6] px-2 py-0.5 rounded">
                      {st.critical_flags}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
