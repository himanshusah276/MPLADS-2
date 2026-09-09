from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr

# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    state_id: Optional[str] = None
    district_id: Optional[str] = None
    mp_id: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

# Risk & Explanation Schemas
class RiskEventResponse(BaseModel):
    id: str
    detector_code: str
    detector_name: str
    subscore: float
    confidence: str
    evidence_json: Dict[str, Any]
    reason_template: Optional[str]
    computed_at: datetime

    class Config:
        from_attributes = True

class RiskBreakdown(BaseModel):
    score: int
    risk_band: str
    subscores: Dict[str, float] # {"D1": 68, "D2": 85, ...}
    reasons: List[str] # Natural language bullet points
    confidence: str

# Project Schemas
class ProjectListItem(BaseModel):
    id: str
    project_code: str
    title: str
    category: str
    state_name: str
    district_name: str
    sanctioned_cost: float
    sanction_date: date
    status: str
    current_risk_score: int
    risk_band: str
    subscores: Dict[str, float]
    has_active_alert: bool
    contractor_name: Optional[str]

    class Config:
        from_attributes = True

class SanctionItem(BaseModel):
    id: str
    amount: float
    sanction_date: date
    approving_authority: str

class PaymentItem(BaseModel):
    id: str
    payment_code: str
    amount: float
    payment_date: date
    installment_stage: str
    contractor_name: Optional[str]

class ProgressItem(BaseModel):
    id: str
    progress_pct: int
    update_date: date
    submitted_by: str
    remarks: Optional[str]

class ApprovalItem(BaseModel):
    id: str
    stage: str
    requested_at: datetime
    approved_at: datetime
    duration_days: int
    approver_name: str

class DuplicateCandidate(BaseModel):
    project_id: str
    project_code: str
    title: str
    distance_km: float
    similarity_score: float
    sanctioned_cost: float
    sanction_date: date
    status: str

class ProjectDetailResponse(BaseModel):
    id: str
    project_code: str
    title: str
    category: str
    description: Optional[str]
    sanctioned_cost: float
    sanction_date: date
    expected_completion: date
    status: str
    current_risk_score: int
    risk_band: str
    last_scored_at: datetime
    injected_anomaly: Optional[str]
    
    # Administrative & Location Details
    mp_name: Optional[str]
    agency_name: Optional[str]
    contractor_name: Optional[str]
    contractor_id: Optional[str]
    state_name: str
    district_name: str
    location: Optional[Dict[str, Any]]
    
    # Financials & Progress
    sanctions: List[SanctionItem]
    payments: List[PaymentItem]
    progress_updates: List[ProgressItem]
    approvals: List[ApprovalItem]
    
    # Explainable Risk Output
    risk_events: List[RiskEventResponse]
    risk_breakdown: RiskBreakdown
    duplicate_candidates: List[DuplicateCandidate]

# Alert Schemas
class AlertListItem(BaseModel):
    id: str
    alert_code: str
    project_id: str
    project_code: str
    project_title: str
    detector_code: str
    severity: str
    status: str
    title: str
    description: str
    confidence: str
    created_at: datetime
    state_name: str
    district_name: str
    sanctioned_cost: float

    class Config:
        from_attributes = True

class AlertDismissRequest(BaseModel):
    reason: str

class AlertEscalateRequest(BaseModel):
    notes: Optional[str] = None

# Case & Investigation Schemas
class CaseNoteItem(BaseModel):
    id: str
    author_id: str
    author_name: str
    author_role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class EvidenceItem(BaseModel):
    id: str
    type: str
    title: str
    storage_url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class CaseListItem(BaseModel):
    id: str
    case_number: str
    project_id: str
    project_code: str
    project_title: str
    owner_name: str
    status: str
    resolution: Optional[str]
    opened_at: datetime
    closed_at: Optional[datetime]
    risk_score: int
    risk_band: str
    state_name: str
    district_name: str

class CaseDetailResponse(BaseModel):
    id: str
    case_number: str
    project_id: str
    project_code: str
    project_title: str
    alert_id: Optional[str]
    owner_user_id: Optional[str]
    owner_name: str
    status: str
    resolution: Optional[str]
    resolution_reason: Optional[str]
    opened_at: datetime
    closed_at: Optional[datetime]
    
    # Project Snapshot
    project: ProjectDetailResponse
    
    # Notes & Evidence
    notes: List[CaseNoteItem]
    evidence_attachments: List[EvidenceItem]
    contractor_history: Dict[str, Any]

class CaseNoteCreate(BaseModel):
    content: str

class CaseResolveRequest(BaseModel):
    resolution: str # "Valid Concern", "False Positive", "Escalated to Higher Authority"
    resolution_reason: str

# Config & Scoring Schemas
class ScoringConfigResponse(BaseModel):
    weights: Dict[str, float]
    thresholds: Dict[str, Any]
    updated_at: datetime

class ScoringConfigUpdate(BaseModel):
    weights: Dict[str, float]
    thresholds: Optional[Dict[str, Any]] = None

class ScoringRunResponse(BaseModel):
    total_projects_scored: int
    critical_alerts_generated: int
    high_alerts_generated: int
    execution_time_ms: float
    timestamp: datetime

# Audit Log Schemas
class AuditLogItem(BaseModel):
    id: str
    actor_id: str
    actor_name: str
    actor_role: str
    action: str
    entity_type: str
    entity_id: str
    before_state: Optional[Dict[str, Any]]
    after_state: Optional[Dict[str, Any]]
    reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard & Analytics Schemas
class MetricCard(BaseModel):
    label: str
    value: Any
    change: Optional[str] = None
    type: str = "neutral"

class DashboardSummaryResponse(BaseModel):
    counts: Dict[str, int] # critical, high_risk, under_review, total_projects, total_fund_sanctioned
    top_risk_projects: List[ProjectListItem]
    recent_alerts: List[AlertListItem]
    utilization_trend: List[Dict[str, Any]]
    delay_rate_trend: List[Dict[str, Any]]
    risk_distribution: Dict[str, int]
    role_scope_label: str
    esakshi_portal_stats: Optional[Dict[str, Any]] = None

class AnalyticsResponse(BaseModel):
    category_distribution: List[Dict[str, Any]]
    false_positive_rate_by_detector: List[Dict[str, Any]]
    state_utilization_trends: List[Dict[str, Any]]
    mean_time_to_resolution_days: float
    detector_accuracy_metrics: Dict[str, Any]
