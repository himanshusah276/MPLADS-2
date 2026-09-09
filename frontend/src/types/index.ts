export type Role =
  | 'MINISTRY_ANALYST'
  | 'STATE_NODAL_OFFICER'
  | 'DISTRICT_OFFICER'
  | 'MP_VIEWER'
  | 'AUDITOR'
  | 'SYSTEM_ADMIN';

export type RiskBand = 'Low' | 'Medium' | 'High' | 'Critical';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  state_id?: string;
  district_id?: string;
  mp_id?: string;
  state_name?: string;
  district_name?: string;
  scope_description?: string;
}

export interface RiskEvent {
  id: string;
  detector_code: string;
  detector_name: string;
  subscore: number;
  confidence: string;
  evidence_json: Record<string, any>;
  reason_template?: string;
  computed_at: string;
}

export interface RiskBreakdown {
  score: number;
  risk_band: RiskBand;
  subscores: Record<string, number>;
  reasons: string[];
  confidence: string;
}

export interface DuplicateCandidate {
  project_id: string;
  project_code: string;
  title: string;
  distance_km: number;
  similarity_score: number;
  sanctioned_cost: number;
  sanction_date: string;
  status: string;
}

export interface ProjectListItem {
  id: string;
  project_code: string;
  title: string;
  category: string;
  state_name: string;
  district_name: string;
  sanctioned_cost: number;
  sanction_date: string;
  status: string;
  current_risk_score: number;
  risk_band: RiskBand;
  subscores: Record<string, number>;
  has_active_alert: boolean;
  contractor_name?: string;
}

export interface SanctionItem {
  id: string;
  amount: number;
  sanction_date: string;
  approving_authority: string;
}

export interface PaymentItem {
  id: string;
  payment_code: string;
  amount: number;
  payment_date: string;
  installment_stage: string;
  contractor_name?: string;
}

export interface ProgressItem {
  id: string;
  progress_pct: number;
  update_date: string;
  submitted_by: string;
  remarks?: string;
}

export interface ApprovalItem {
  id: string;
  stage: string;
  requested_at: string;
  approved_at: string;
  duration_days: number;
  approver_name: string;
}

export interface ProjectDetail {
  id: string;
  project_code: string;
  title: string;
  category: string;
  description?: string;
  sanctioned_cost: number;
  sanction_date: string;
  expected_completion: string;
  status: string;
  current_risk_score: number;
  risk_band: RiskBand;
  last_scored_at: string;
  injected_anomaly?: string;
  mp_name?: string;
  agency_name?: string;
  contractor_name?: string;
  contractor_id?: string;
  state_name: string;
  district_name: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  sanctions: SanctionItem[];
  payments: PaymentItem[];
  progress_updates: ProgressItem[];
  approvals: ApprovalItem[];
  risk_events: RiskEvent[];
  risk_breakdown: RiskBreakdown;
  duplicate_candidates: DuplicateCandidate[];
}

export interface AlertItem {
  id: string;
  alert_code: string;
  project_id: string;
  project_code: string;
  project_title: string;
  detector_code: string;
  severity: 'Medium' | 'High' | 'Critical';
  status: 'New' | 'Under Review' | 'Resolved' | 'Dismissed';
  title: string;
  description: string;
  confidence: string;
  created_at: string;
  state_name: string;
  district_name: string;
  sanctioned_cost: number;
}

export interface CaseNote {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
}

export interface EvidenceItem {
  id: string;
  type: string;
  title: string;
  storage_url: string;
  uploaded_at: string;
}

export interface CaseDetail {
  id: string;
  case_number: string;
  project_id: string;
  project_code: string;
  project_title: string;
  alert_id?: string;
  owner_user_id?: string;
  owner_name: string;
  status: 'New' | 'Under Review' | 'Resolved';
  resolution?: 'Valid Concern' | 'False Positive' | 'Escalated to Higher Authority';
  resolution_reason?: string;
  opened_at: string;
  closed_at?: string;
  project: ProjectDetail;
  notes: CaseNote[];
  evidence_attachments: EvidenceItem[];
  contractor_history: {
    name?: string;
    registration_no?: string;
    registered_since?: string;
    total_projects_count?: number;
    total_sanctioned_val?: number;
    avg_risk_score?: number;
    active_projects?: number;
    recent_awards?: Array<{ code: string; title: string; cost: number; date: string }>;
  };
}

export interface AuditLogItem {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  reason?: string;
  created_at: string;
}

export interface DashboardSummary {
  counts: {
    critical: number;
    high_risk: number;
    medium: number;
    low: number;
    under_review: number;
    total_projects: number;
    total_fund_sanctioned: number;
  };
  top_risk_projects: ProjectListItem[];
  recent_alerts: AlertItem[];
  utilization_trend: Array<{ month: string; utilization_pct: number; benchmark_pct: number }>;
  delay_rate_trend: Array<{ month: string; avg_delay_days: number; stalled_projects_pct: number }>;
  risk_distribution: Record<string, number>;
  role_scope_label: string;
  esakshi_portal_stats?: {
    portal_name?: string;
    source?: string;
    metrics?: {
      recommended_works_count?: number;
      recommended_amount_cr?: number;
      sanctioned_works_count?: number;
      sanctioned_amount_cr?: number;
      completed_works_count?: number;
      completed_amount_cr?: number;
      fund_entitlement_cr?: number;
      expenditure_incurred_cr?: number;
      vendor_invoices_cleared?: number;
      active_mps_count?: number;
      tenures?: Array<{ id: string; name: string; house: string; is_current: boolean }>;
    };
    states_count?: number;
    categories_count?: number;
  };
}

