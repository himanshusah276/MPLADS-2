import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Building,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  IndianRupee,
  Scale,
} from 'lucide-react';
import apiClient from '../lib/api';

export const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<'case' | 'state'>('case');
  const [casesList, setCasesList] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/cases').then((res) => {
      setCasesList(res.data.items);
      if (res.data.items.length > 0) {
        setSelectedCaseId(res.data.items[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (reportType === 'case' && selectedCaseId) {
      setLoading(true);
      apiClient.get(`/reports/case/${selectedCaseId}`).then((res) => {
        setReportData(res.data);
        setLoading(false);
      });
    } else if (reportType === 'state') {
      setLoading(true);
      apiClient.get('/reports/state-summary/KA').then((res) => {
        setReportData(res.data);
        setLoading(false);
      });
    }
  }, [reportType, selectedCaseId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Controls (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E3E6EA] print:hidden">
        <div>
          <h1 className="text-xl font-bold text-[#1A1D22] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1B4F8C]" />
            Official Audit Reports & Dossiers
          </h1>
          <p className="text-xs text-[#5B6270] mt-0.5">
            Standardized export-ready investigation reports with verified evidence attachments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Report Type Switcher */}
          <div className="flex bg-[#F0F2F5] p-0.5 rounded border border-[#E3E6EA] text-xs">
            <button
              onClick={() => setReportType('case')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                reportType === 'case' ? 'bg-white text-[#1B4F8C] shadow-sm font-semibold' : 'text-[#5B6270]'
              }`}
            >
              Case Dossier
            </button>
            <button
              onClick={() => setReportType('state')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                reportType === 'state' ? 'bg-white text-[#1B4F8C] shadow-sm font-semibold' : 'text-[#5B6270]'
              }`}
            >
              State Summary
            </button>
          </div>

          {reportType === 'case' && (
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-white border border-[#E3E6EA] rounded px-3 py-1.5 text-xs text-[#1A1D22] shadow-sm focus:outline-none focus:border-[#1B4F8C]"
            >
              {casesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} ({c.project_code})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4F8C] hover:bg-[#143D6D] text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Surface */}
      <div className="bg-white p-8 sm:p-12 rounded border border-[#E3E6EA] shadow-md print:border-none print:shadow-none print:p-0 space-y-6 text-xs text-[#1A1D22]">
        {/* Government Header */}
        <div className="text-center border-b-2 border-[#1A1D22] pb-4 space-y-1">
          <div className="font-bold text-sm uppercase tracking-widest text-[#1B4F8C]">
            Government of India · Ministry of Statistics and Programme Implementation
          </div>
          <div className="font-extrabold text-base tracking-tight text-[#1A1D22]">
            {reportType === 'case' ? 'MPLADS INVESTIGATION & AUDIT FINDINGS DOSSIER' : 'STATE MPLADS COMPLIANCE BRIEF'}
          </div>
          <div className="text-[11px] text-[#5B6270] font-mono">
            {reportType === 'case'
              ? `Case Number: ${reportData?.case_number || 'CASE-2026-00042'} · Confidential Internal Record`
              : `State Scope: ${reportData?.state_name} · Period: ${reportData?.reporting_period}`}
          </div>
        </div>

        {reportType === 'case' && reportData ? (
          <div className="space-y-6">
            {/* Meta Table */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#F7F8FA] rounded border border-[#E3E6EA]">
              <div>
                <span className="text-[#8A92A0] text-[10px] uppercase font-semibold">Project Code & Name</span>
                <div className="font-bold text-[#1B4F8C] mt-0.5">{reportData.project.code}</div>
                <div className="font-semibold text-xs mt-0.5">{reportData.project.title}</div>
                <div className="text-[#5B6270] text-[11px] mt-0.5">Category: {reportData.project.category}</div>
              </div>
              <div className="text-right">
                <span className="text-[#8A92A0] text-[10px] uppercase font-semibold">Investigation Details</span>
                <div className="font-semibold mt-0.5">Auditor: {reportData.investigation_officer}</div>
                <div className="font-mono text-[#5B6270] text-[11px]">Initiated: {new Date(reportData.generated_at).toLocaleDateString()}</div>
                <div className="font-bold text-[#B3261E] mt-1 text-xs">
                  Risk Evaluation: {reportData.project.risk_score}/100 ({reportData.project.risk_band})
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-2">
              <div className="font-bold text-xs uppercase tracking-wider text-[#1B4F8C] border-b border-[#E3E6EA] pb-1">
                1. Financial Pacing vs Physical Progress
              </div>
              <div className="grid grid-cols-3 gap-3 p-3 bg-white border border-[#E3E6EA] rounded text-center">
                <div>
                  <div className="text-[#8A92A0] text-[10px]">Total Sanctioned</div>
                  <div className="font-bold font-mono text-sm mt-0.5">₹{(reportData.financial_summary.total_sanctioned / 100000).toFixed(2)} Lakhs</div>
                </div>
                <div>
                  <div className="text-[#8A92A0] text-[10px]">Total Disbursed</div>
                  <div className="font-bold font-mono text-sm text-[#B3261E] mt-0.5">
                    ₹{(reportData.financial_summary.total_disbursed / 100000).toFixed(2)}L ({reportData.financial_summary.disbursement_pct}%)
                  </div>
                </div>
                <div>
                  <div className="text-[#8A92A0] text-[10px]">Reported Milestone</div>
                  <div className="font-bold font-mono text-sm text-[#1B4F8C] mt-0.5">{reportData.financial_summary.latest_progress_pct}%</div>
                </div>
              </div>
            </div>

            {/* Detector Explanations */}
            <div className="space-y-2">
              <div className="font-bold text-xs uppercase tracking-wider text-[#1B4F8C] border-b border-[#E3E6EA] pb-1">
                2. AI/ML Anomaly Signals & Traceable Reasons
              </div>
              <div className="space-y-2">
                {reportData.project.reasons.map((r: string, idx: number) => (
                  <div key={idx} className="p-2.5 bg-[#F7F8FA] border border-[#E3E6EA] rounded flex items-start gap-2">
                    <span className="font-mono font-bold text-[#1B4F8C] shrink-0 text-[11px]">•</span>
                    <span className="leading-relaxed">{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Investigator Notes */}
            <div className="space-y-2">
              <div className="font-bold text-xs uppercase tracking-wider text-[#1B4F8C] border-b border-[#E3E6EA] pb-1">
                3. Audit Notes & Inquiry Trail
              </div>
              <div className="space-y-2">
                {reportData.case_notes.map((n: any, idx: number) => (
                  <div key={idx} className="p-2.5 border border-[#E3E6EA] rounded">
                    <div className="flex justify-between text-[10px] text-[#8A92A0] font-mono">
                      <span>{n.author} ({n.role})</span>
                      <span>{n.time}</span>
                    </div>
                    <div className="text-xs text-[#1A1D22] mt-1 leading-relaxed">{n.content}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formal Determination */}
            <div className="p-4 bg-[#F7F8FA] border-2 border-[#1B4F8C] rounded space-y-2">
              <div className="font-bold text-xs uppercase tracking-wider text-[#1B4F8C] flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                4. Formal Decision & Determination Finding
              </div>
              <div className="text-xs font-bold text-[#1A1D22]">
                Ruling: {reportData.resolution || 'Under Review — Field Measurement Inquiry Ongoing'}
              </div>
              {reportData.resolution_reason && (
                <div className="text-[11px] text-[#5B6270] leading-relaxed">
                  <strong>Justification:</strong> {reportData.resolution_reason}
                </div>
              )}
            </div>

            {/* Signatures Footer */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-[#1A1D22] pt-2">
                <div className="font-bold">{reportData.investigation_officer}</div>
                <div className="text-[10px] text-[#5B6270]">Investigating Audit Officer</div>
              </div>
              <div className="border-t border-[#1A1D22] pt-2">
                <div className="font-bold">Deputy Director (Monitoring)</div>
                <div className="text-[10px] text-[#5B6270]">MoSPI DIID Oversight Cell</div>
              </div>
            </div>
          </div>
        ) : reportType === 'state' && reportData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-[#F7F8FA] rounded border border-[#E3E6EA]">
                <div className="text-[#8A92A0] text-[10px]">Total Allocated</div>
                <div className="font-bold font-mono text-base mt-0.5">₹{reportData.total_allocated_cr} Cr</div>
              </div>
              <div className="p-3 bg-[#F7F8FA] rounded border border-[#E3E6EA]">
                <div className="text-[#8A92A0] text-[10px]">Total Utilized</div>
                <div className="font-bold font-mono text-base text-[#2E7D46] mt-0.5">₹{reportData.total_utilized_cr} Cr ({reportData.utilization_pct}%)</div>
              </div>
              <div className="p-3 bg-[#F7F8FA] rounded border border-[#E3E6EA]">
                <div className="text-[#8A92A0] text-[10px]">Critical Anomaly Works</div>
                <div className="font-bold font-mono text-base text-[#B3261E] mt-0.5">{reportData.critical_risk_projects_count}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-xs uppercase tracking-wider text-[#1B4F8C] border-b border-[#E3E6EA] pb-1">
                Priority Systemic Risk Observations
              </div>
              <div className="space-y-2">
                {reportData.top_flags.map((flag: string, idx: number) => (
                  <div key={idx} className="p-2.5 bg-[#F7F8FA] border border-[#E3E6EA] rounded text-xs leading-relaxed">
                    <strong>Observation #{idx + 1}:</strong> {flag}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Reports;
