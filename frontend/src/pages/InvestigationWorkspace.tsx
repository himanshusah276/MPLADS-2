import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileSearch,
  ArrowLeft,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Send,
  Building,
  User,
  ExternalLink,
  History,
  FileCheck,
  Flame,
  Scale,
} from 'lucide-react';
import apiClient from '../lib/api';
import { CaseDetail, CaseNote } from '../types';
import RiskBadge from '../components/risk/RiskBadge';
import RiskBar from '../components/risk/RiskBar';
import SignalExplanation from '../components/risk/SignalExplanation';

export const InvestigationWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [casesList, setCasesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Note State
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Resolution State
  const [resolutionChoice, setResolutionChoice] = useState<'Valid Concern' | 'False Positive' | 'Escalated to Higher Authority'>('Valid Concern');
  const [resolutionReason, setResolutionReason] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolutionSuccess, setResolutionSuccess] = useState(false);

  // Evidence Upload State
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState('Measurement Book Inspection Report');

  const navigate = useNavigate();

  const fetchCasesList = async () => {
    try {
      const res = await apiClient.get('/cases');
      setCasesList(res.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCase = async (caseId: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/cases/${caseId}`);
      setCaseData(res.data);
    } catch (err) {
      console.error('Failed to load case workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCasesList();
    if (id) {
      fetchCase(id);
    } else {
      // Default to first case if available
      apiClient.get('/cases').then((res) => {
        if (res.data.items && res.data.items.length > 0) {
          navigate(`/cases/${res.data.items[0].id}`, { replace: true });
        }
      });
    }
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !newNote.trim()) return;
    setSubmittingNote(true);
    try {
      await apiClient.post(`/cases/${caseData.id}/notes`, { content: newNote });
      setNewNote('');
      fetchCase(caseData.id);
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !evidenceTitle.trim()) return;
    try {
      await apiClient.post(`/cases/${caseData.id}/evidence`, null, {
        params: { title: evidenceTitle, evidence_type: evidenceType },
      });
      setEvidenceTitle('');
      fetchCase(caseData.id);
    } catch (err) {
      console.error('Failed to attach evidence:', err);
    }
  };

  const handleResolveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !resolutionReason.trim()) return;
    setResolving(true);
    try {
      await apiClient.post(`/cases/${caseData.id}/resolve`, {
        resolution: resolutionChoice,
        resolution_reason: resolutionReason,
      });
      setResolutionSuccess(true);
      fetchCase(caseData.id);
    } catch (err) {
      console.error('Failed to resolve case:', err);
    } finally {
      setResolving(false);
    }
  };

  if (loading && !caseData) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-[#5B6270]">
        Initializing investigation workspace and evidence links...
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-12 text-center text-xs text-[#8A92A0]">
        No investigation cases found. Escalate an alert from the Alert Queue to begin.
      </div>
    );
  }

  const { project, notes, evidence_attachments, contractor_history } = caseData;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E3E6EA]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/alerts')}
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-[#E3E6EA] text-[#5B6270]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-[#1B4F8C]">
                {caseData.case_number}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  caseData.status === 'Resolved'
                    ? 'bg-[#EAF5EC] text-[#2E7D46]'
                    : 'bg-[#FEF9E7] text-[#B98900]'
                }`}
              >
                ● {caseData.status.toUpperCase()}
              </span>
              {caseData.resolution && (
                <span className="text-[10px] font-bold bg-[#E8F0FA] text-[#1B4F8C] px-2 py-0.5 rounded border border-[#C5D9F1]">
                  Decision: {caseData.resolution}
                </span>
              )}
            </div>
            <h1 className="text-sm font-bold text-[#1A1D22] mt-0.5">
              Investigation: {project.project_code} — {project.title}
            </h1>
          </div>
        </div>

        {/* Case Switcher Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[#8A92A0] text-[11px] font-medium hidden md:inline">Cases:</span>
          {casesList.slice(0, 4).map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/cases/${c.id}`)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                c.id === caseData.id
                  ? 'bg-[#1B4F8C] text-white font-bold'
                  : 'bg-white border border-[#E3E6EA] text-[#5B6270] hover:bg-[#F0F2F5]'
              }`}
            >
              {c.case_number}
            </button>
          ))}
        </div>
      </div>

      {/* 3-COLUMN WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* COLUMN 1 (4 Cols): EVIDENCE & PROJECT SNAPSHOT */}
        <div className="lg:col-span-4 space-y-4">
          {/* Project Snapshot Card */}
          <div className="bg-white p-3.5 rounded border border-[#E3E6EA] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-2">
              <span className="text-xs font-bold text-[#1A1D22] uppercase tracking-wider">
                Project Profile Under Audit
              </span>
              <RiskBadge band={project.risk_band} score={project.current_risk_score} size="sm" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8A92A0]">Sanctioned Value:</span>
                <span className="font-mono font-bold text-[#1A1D22]">
                  ₹{(project.sanctioned_cost / 100000).toFixed(2)} Lakhs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A92A0]">Executing Agency:</span>
                <span className="font-medium text-[#1A1D22] text-right truncate max-w-[180px]">
                  {project.agency_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A92A0]">Assigned Contractor:</span>
                <span className="font-medium text-[#1A1D22] text-right truncate max-w-[180px]">
                  {project.contractor_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A92A0]">Location / District:</span>
                <span className="font-medium text-[#1A1D22]">{project.state_name} · {project.district_name}</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/projects/${project.id}`)}
              className="w-full mt-2 py-1.5 bg-[#F7F8FA] hover:bg-[#F0F2F5] border border-[#E3E6EA] text-xs font-semibold text-[#1B4F8C] rounded flex items-center justify-center gap-1"
            >
              <span>Full Project Dossier</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Evidence Attachments Panel */}
          <div className="bg-white p-3.5 rounded border border-[#E3E6EA] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-2">
              <span className="text-xs font-bold text-[#1A1D22] uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#1B4F8C]" />
                Evidence Repository ({evidence_attachments.length})
              </span>
              <span className="text-[10px] text-[#8A92A0] font-mono">Immutable Files</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {evidence_attachments.length === 0 ? (
                <div className="text-[11px] text-[#8A92A0] p-2 bg-[#F7F8FA] rounded text-center">
                  No evidence files attached yet.
                </div>
              ) : (
                evidence_attachments.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded bg-[#F7F8FA] border border-[#E3E6EA] text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#1A1D22] truncate">{ev.title}</div>
                      <div className="text-[10px] text-[#8A92A0]">{ev.type} · {new Date(ev.uploaded_at).toLocaleDateString()}</div>
                    </div>
                    <span className="text-[10px] font-mono text-[#1B4F8C] bg-white px-2 py-0.5 rounded border border-[#E3E6EA] shrink-0">
                      PDF/DOC
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Quick Evidence Attachment Form */}
            <form onSubmit={handleAddEvidence} className="pt-2 border-t border-[#EEF0F3] space-y-2 text-xs">
              <div className="font-semibold text-[11px] text-[#5B6270]">Attach New Audit Record:</div>
              <input
                type="text"
                value={evidenceTitle}
                onChange={(e) => setEvidenceTitle(e.target.value)}
                placeholder="Document title (e.g. MB Measurement Book pg 42)"
                className="w-full bg-[#F7F8FA] border border-[#E3E6EA] rounded p-1.5 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C]"
              />
              <div className="flex gap-2">
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="flex-1 bg-[#F7F8FA] border border-[#E3E6EA] rounded p-1.5 text-[11px] text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C]"
                >
                  <option value="Measurement Book Inspection">MB Inspection Record</option>
                  <option value="PFMS Bank Scroll">PFMS Bank Scroll</option>
                  <option value="Geotagged Site Photo">Geotagged Site Photo</option>
                  <option value="Quality Inspection Certificate">Quality Certificate</option>
                </select>
                <button
                  type="submit"
                  disabled={!evidenceTitle.trim()}
                  className="px-3 py-1 bg-[#1B4F8C] hover:bg-[#143D6D] text-white text-xs font-semibold rounded disabled:opacity-40"
                >
                  Attach
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* COLUMN 2 (4 Cols): CONTRACTOR GRAPH & DUPLICATE INTELLIGENCE */}
        <div className="lg:col-span-4 space-y-4">
          {/* Signal Explanation Box */}
          <div className="bg-white p-3.5 rounded border border-[#E3E6EA] shadow-sm space-y-3">
            <div className="text-xs font-bold text-[#1A1D22] uppercase tracking-wider border-b border-[#EEF0F3] pb-2">
              Automated Anomaly Decomposition
            </div>
            <RiskBar
              subscores={project.risk_breakdown.subscores}
              totalScore={project.current_risk_score}
              height="sm"
            />
            <SignalExplanation
              reasons={project.risk_breakdown.reasons}
              confidence={project.risk_breakdown.confidence}
            />
          </div>

          {/* Contractor Concentration Profile */}
          <div className="bg-white p-3.5 rounded border border-[#E3E6EA] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-2">
              <span className="text-xs font-bold text-[#1A1D22] uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#1B4F8C]" />
                Contractor Graph Intelligence
              </span>
              <span className="text-[10px] font-bold bg-[#E8F0FA] text-[#1B4F8C] px-1.5 py-0.5 rounded font-mono">
                D7 Analysis
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-[#1A1D22] text-xs">
                {contractor_history?.name || project.contractor_name}
              </div>
              <div className="text-[11px] text-[#8A92A0]">
                Reg: {contractor_history?.registration_no || 'REG-PWD-77821'} · Registered: {contractor_history?.registered_since || '2018'}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-center">
                <div className="p-2 bg-[#F7F8FA] rounded border border-[#E3E6EA]">
                  <div className="text-[10px] text-[#8A92A0]">Total District Awards</div>
                  <div className="font-mono font-bold text-sm text-[#1A1D22]">
                    {contractor_history?.total_projects_count || 6} Projects
                  </div>
                </div>
                <div className="p-2 bg-[#F7F8FA] rounded border border-[#E3E6EA]">
                  <div className="text-[10px] text-[#8A92A0]">Avg Risk Profile</div>
                  <div className="font-mono font-bold text-sm text-[#C4551C]">
                    {contractor_history?.avg_risk_score || 64}/100
                  </div>
                </div>
              </div>

              {contractor_history?.recent_awards && contractor_history.recent_awards.length > 0 && (
                <div className="pt-2">
                  <div className="text-[10px] text-[#8A92A0] font-semibold uppercase mb-1">
                    Recent Award Clusters (DBSCAN Graph Signal):
                  </div>
                  <div className="space-y-1">
                    {contractor_history.recent_awards.map((ra) => (
                      <div key={ra.code} className="flex justify-between text-[11px] p-1.5 bg-[#F7F8FA] rounded border border-[#EEF0F3]">
                        <span className="font-mono font-semibold text-[#1B4F8C]">{ra.code}</span>
                        <span className="text-[#5B6270]">₹{(ra.cost / 100000).toFixed(1)}L · {ra.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3 (4 Cols): CASE NOTES & FORMAL DECISION RECORDING */}
        <div className="lg:col-span-4 space-y-4">
          {/* Formal Resolution Box */}
          <div className="bg-white p-3.5 rounded border border-[#E3E6EA] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-2">
              <span className="text-xs font-bold text-[#1A1D22] uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#1B4F8C]" />
                Formal Audit Determination
              </span>
              <span className="text-[10px] text-[#2E7D46] bg-[#EAF5EC] px-1.5 py-0.5 rounded font-mono font-bold">
                Immutable
              </span>
            </div>

            {caseData.status === 'Resolved' ? (
              <div className="p-3 bg-[#EAF5EC] border border-[#BDE3C4] rounded text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#2E7D46]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Case Resolved: {caseData.resolution}</span>
                </div>
                <div className="text-[#1A1D22] leading-relaxed text-[11px]">
                  <strong>Recorded Justification:</strong> {caseData.resolution_reason}
                </div>
                <div className="text-[10px] text-[#5B6270] pt-1 border-t border-[#BDE3C4]">
                  Closed: {caseData.closed_at ? new Date(caseData.closed_at).toLocaleString() : 'Recent'} · Logged to Audit Trail
                </div>
              </div>
            ) : (
              <form onSubmit={handleResolveCase} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#1A1D22] mb-1">
                    Audit Decision Ruling:
                  </label>
                  <select
                    value={resolutionChoice}
                    onChange={(e: any) => setResolutionChoice(e.target.value)}
                    className="w-full bg-[#F7F8FA] border border-[#E3E6EA] rounded p-2 text-xs font-medium text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C]"
                  >
                    <option value="Valid Concern">Valid Concern — Requires Field Physical Verification</option>
                    <option value="False Positive">False Positive — Justified Disbursal / Verified Scope</option>
                    <option value="Escalated to Higher Authority">Escalate to MoSPI / CVC Audit Wing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1A1D22] mb-1">
                    Official Ruling Justification (Minimum 10 chars):
                  </label>
                  <textarea
                    value={resolutionReason}
                    onChange={(e) => setResolutionReason(e.target.value)}
                    required
                    placeholder="Enter comprehensive findings from document examination or field measurement..."
                    rows={3}
                    className="w-full bg-[#F7F8FA] border border-[#E3E6EA] rounded p-2 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resolving || resolutionReason.trim().length < 10}
                  className="w-full py-2 bg-[#1B4F8C] hover:bg-[#143D6D] text-white rounded text-xs font-semibold shadow-sm transition-colors disabled:opacity-40"
                >
                  {resolving ? 'Recording Decision in Audit Log...' : 'Submit Formal Ruling & Record in Audit Log'}
                </button>
              </form>
            )}
          </div>

          {/* Case Notes & Audit Feed */}
          <div className="bg-white p-3.5 rounded border border-[#E3E6EA] shadow-sm space-y-3 flex flex-col h-80">
            <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-2">
              <span className="text-xs font-bold text-[#1A1D22] uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#5B6270]" />
                Case Notes & Inquiries ({notes.length})
              </span>
              <span className="text-[10px] text-[#8A92A0] font-mono">Live Feed</span>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {notes.length === 0 ? (
                <div className="text-[11px] text-[#8A92A0] text-center py-6">
                  No notes recorded yet.
                </div>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="p-2.5 rounded bg-[#F7F8FA] border border-[#E3E6EA] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1A1D22] text-[11px]">{n.author_name}</span>
                      <span className="text-[10px] text-[#8A92A0] font-mono">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[#5B6270] text-[11px] leading-relaxed">{n.content}</div>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="pt-2 border-t border-[#EEF0F3] flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type investigator note..."
                className="flex-1 bg-[#F7F8FA] border border-[#E3E6EA] rounded px-2.5 py-1.5 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C]"
              />
              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="px-3 py-1.5 bg-[#1B4F8C] hover:bg-[#143D6D] text-white rounded text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigationWorkspace;
