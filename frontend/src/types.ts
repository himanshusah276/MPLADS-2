export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertStatus = 'Open' | 'Under Review' | 'Resolved' | 'False Positive';
export type WorkStatus = 'Recommended' | 'Sanctioned' | 'In-Progress' | 'Completed' | 'Cancelled';
export type UserRole = 'ministry' | 'auditor' | 'state_nodal' | 'district_authority' | 'mp';

export interface MP {
  mp_id: string;
  name: string;
  house: string;
  state: string;
  constituency: string;
  party: string;
  term_start: string;
  term_end: string;
  annual_entitlement: number;
  total_recommended: number;
  total_sanctioned: number;
  total_released: number;
  total_utilized: number;
  uc_pending_flag: boolean;
  composite_risk_score: number;
  risk_band: Severity;
  works_count?: number;
  open_alerts_count?: number;
  utilization_percentage?: number;
}

export interface Work {
  work_id: string;
  mp_id: string;
  mp_name?: string;
  state: string;
  district: string;
  category: string;
  description: string;
  recommended_date: string;
  sanction_order_no?: string;
  sanction_date?: string;
  sanctioned_amount: number;
  estimated_cost: number;
  actual_cost: number;
  implementing_agency_id?: string;
  agency_name?: string;
  status: WorkStatus;
  completion_date?: string;
  lat: number;
  long: number;
  is_outside_constituency: boolean;
  financial_year: string;
  risk_score: number;
  risk_band: Severity;
  alerts_count?: number;
}

export interface ImplementingAgency {
  agency_id: string;
  name: string;
  type: string;
  district: string;
  state: string;
  total_works_handled: number;
  total_sanctioned_amount: number;
  flagged_works_count: number;
  hhi_concentration_score: number;
  risk_band: Severity;
}

export interface AnomalyAlert {
  alert_id: string;
  entity_type: 'work' | 'mp' | 'agency' | 'district';
  entity_id: string;
  entity_name?: string;
  state?: string;
  district?: string;
  alert_type: string;
  risk_score: number;
  severity: Severity;
  description: string;
  rule_code?: string;
  explainable_details?: string;
  detected_on: string;
  status: AlertStatus;
  reviewer_role?: string;
  reviewer_comment?: string;
  reviewed_at?: string;
}

export interface DashboardKPIs {
  total_sanctioned_inr: number;
  total_sanctioned_cr: number;
  total_utilized_inr: number;
  total_utilized_cr: number;
  total_released_cr: number;
  utilization_rate_pct: number;
  total_works: number;
  uc_overdue_count: number;
  uc_overdue_growth_pct: number;
  open_alerts_count: number;
  critical_alerts_count: number;
  high_alerts_count: number;
  synced_time: string;
}

export interface DistrictRiskSummary {
  state: string;
  district: string;
  lat: number;
  long: number;
  total_works: number;
  total_sanctioned_lakh: number;
  total_utilized_lakh: number;
  open_alerts: number;
  critical_alerts: number;
  composite_risk_score: number;
  risk_band: Severity;
}

export interface PreCheckViolation {
  rule_code: string;
  rule_name: string;
  severity: Severity;
  is_blocking: boolean;
  explanation: string;
  guideline_reference: string;
}

export interface PreCheckWorkResponse {
  is_compliant: boolean;
  risk_score: number;
  risk_band: Severity;
  violations: PreCheckViolation[];
  warnings: string[];
  recommendation: string;
}

export interface UserProfile {
  id?: number;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  state?: string;
  district?: string;
  mp_id?: string;
  role_title?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  username: string;
  full_name: string;
  state?: string;
  district?: string;
  mp_id?: string;
  role_title?: string;
}

export interface DigiGovSummary {
  total_allocated_limit_cr: number;
  total_recommended_cr: number;
  total_sanctioned_cr: number;
  total_vendor_released_cr: number;
  works_metrics: {
    total_works_recommended: number;
    total_works_sanctioned: number;
    total_works_completed: number;
    total_works_in_progress: number;
    sanction_rate_pct: number;
    completion_rate_pct: number;
  };
}

export interface DigiGovMPRecord {
  mp_id: string;
  mp_name: string;
  house: string;
  tenure: string;
  state: string;
  constituency: string;
  party: string;
  allocated_limit_cr: number;
  amount_recommended_cr: number;
  amount_sanctioned_cr: number;
  vendor_payments_released_cr: number;
  works_recommended: number;
  works_sanctioned: number;
  works_completed: number;
  risk_score: number;
}
