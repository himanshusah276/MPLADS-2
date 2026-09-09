import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Float, Integer, Date, DateTime, Boolean, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class State(Base):
    __tablename__ = "states"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(10), nullable=False, unique=True)

    districts = relationship("District", back_populates="state", cascade="all, delete-orphan")

class District(Base):
    __tablename__ = "districts"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    state_id = Column(String(64), ForeignKey("states.id"), nullable=False)

    state = relationship("State", back_populates="districts")
    constituencies = relationship("Constituency", back_populates="district")
    agencies = relationship("ImplementingAgency", back_populates="district")
    locations = relationship("Location", back_populates="district")

class Constituency(Base):
    __tablename__ = "constituencies"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    house_type = Column(String(30), default="Lok Sabha") # Lok Sabha / Rajya Sabha
    district_id = Column(String(64), ForeignKey("districts.id"), nullable=True)
    state_id = Column(String(64), ForeignKey("states.id"), nullable=False)

    district = relationship("District", back_populates="constituencies")
    state = relationship("State")
    mps = relationship("MP", back_populates="constituency")

class MP(Base):
    __tablename__ = "mps"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    house = Column(String(30), default="Lok Sabha")
    party = Column(String(100), nullable=True)
    constituency_id = Column(String(64), ForeignKey("constituencies.id"), nullable=True)
    term_start = Column(Date, nullable=True)
    term_end = Column(Date, nullable=True)

    constituency = relationship("Constituency", back_populates="mps")
    projects = relationship("Project", back_populates="mp")

class ImplementingAgency(Base):
    __tablename__ = "implementing_agencies"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    type = Column(String(100), default="Panchayati Raj / PWD / Municipal")
    district_id = Column(String(64), ForeignKey("districts.id"), nullable=False)

    district = relationship("District", back_populates="agencies")
    projects = relationship("Project", back_populates="agency")

class Contractor(Base):
    __tablename__ = "contractors"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    registration_no = Column(String(100), nullable=True)
    pan_or_gstin = Column(String(50), nullable=True)
    registered_since = Column(Date, nullable=True)
    risk_flags = Column(JSON, default=list)

    projects = relationship("Project", back_populates="contractor")
    payments = relationship("Payment", back_populates="contractor")

class Location(Base):
    __tablename__ = "locations"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(255), nullable=True)
    district_id = Column(String(64), ForeignKey("districts.id"), nullable=False)

    district = relationship("District", back_populates="locations")
    projects = relationship("Project", back_populates="location")

class Project(Base):
    __tablename__ = "projects"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    project_code = Column(String(50), unique=True, index=True) # e.g. PRJ-2024-0091
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    mp_id = Column(String(64), ForeignKey("mps.id"), nullable=True)
    agency_id = Column(String(64), ForeignKey("implementing_agencies.id"), nullable=True)
    location_id = Column(String(64), ForeignKey("locations.id"), nullable=True)
    contractor_id = Column(String(64), ForeignKey("contractors.id"), nullable=True)
    
    sanctioned_cost = Column(Float, nullable=False)
    sanction_date = Column(Date, nullable=False)
    expected_completion = Column(Date, nullable=False)
    status = Column(String(50), default="Active") # Active / Completed / Stalled / Sanctioned
    
    current_risk_score = Column(Integer, default=15)
    risk_band = Column(String(30), default="Low") # Low / Medium / High / Critical
    last_scored_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    injected_anomaly = Column(String(100), nullable=True)

    # Relationships
    mp = relationship("MP", back_populates="projects")
    agency = relationship("ImplementingAgency", back_populates="projects")
    location = relationship("Location", back_populates="projects")
    contractor = relationship("Contractor", back_populates="projects")
    
    sanctions = relationship("Sanction", back_populates="project", cascade="all, delete-orphan")
    expenditures = relationship("Expenditure", back_populates="project", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="project", cascade="all, delete-orphan")
    progress_updates = relationship("ProgressUpdate", back_populates="project", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="project", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="project", cascade="all, delete-orphan")
    risk_events = relationship("RiskEvent", back_populates="project", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="project", cascade="all, delete-orphan")
    cases = relationship("Case", back_populates="project", cascade="all, delete-orphan")

class Sanction(Base):
    __tablename__ = "sanctions"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    amount = Column(Float, nullable=False)
    sanction_date = Column(Date, nullable=False)
    approving_authority = Column(String(150), default="District Collector / Magistrate")

    project = relationship("Project", back_populates="sanctions")

class Expenditure(Base):
    __tablename__ = "expenditures"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    amount = Column(Float, nullable=False)
    recorded_date = Column(Date, nullable=False)
    category = Column(String(100), default="Civil Works / Materials")

    project = relationship("Project", back_populates="expenditures")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    payment_code = Column(String(50), unique=True, index=True) # e.g. PAY-2024-3391
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    contractor_id = Column(String(64), ForeignKey("contractors.id"), nullable=True)
    amount = Column(Float, nullable=False)
    payment_date = Column(Date, nullable=False)
    installment_stage = Column(String(50), default="First Installment")
    injected_anomaly = Column(String(100), nullable=True)

    project = relationship("Project", back_populates="payments")
    contractor = relationship("Contractor", back_populates="payments")

class ProgressUpdate(Base):
    __tablename__ = "progress_updates"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    progress_code = Column(String(50), nullable=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    progress_pct = Column(Integer, nullable=False) # 0 to 100
    update_date = Column(Date, nullable=False)
    submitted_by = Column(String(150), default="Junior Engineer / Field Inspection Officer")
    remarks = Column(Text, nullable=True)

    project = relationship("Project", back_populates="progress_updates")

class Asset(Base):
    __tablename__ = "assets"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    asset_type = Column(String(100), nullable=False)
    creation_date = Column(Date, nullable=False)
    condition_status = Column(String(50), default="Functional / Verified")
    geotag_verified = Column(Boolean, default=True)

    project = relationship("Project", back_populates="assets")

class Approval(Base):
    __tablename__ = "approvals"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    stage = Column(String(100), nullable=False) # e.g. "Administrative Approval", "Technical Sanction", "Financial Sanction"
    requested_at = Column(DateTime, nullable=False)
    approved_at = Column(DateTime, nullable=False)
    approver_name = Column(String(150), default="District Planning Officer")
    duration_days = Column(Integer, default=14)

    project = relationship("Project", back_populates="approvals")

class RiskEvent(Base):
    __tablename__ = "risk_events"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    detector_code = Column(String(20), nullable=False) # D1, D2, D3, D4, D5, D6, D7, D8
    detector_name = Column(String(100), nullable=False)
    subscore = Column(Float, nullable=False) # 0 to 100
    confidence = Column(String(20), default="High") # High / Medium / Low
    evidence_json = Column(JSON, default=dict)
    reason_template = Column(Text, nullable=True)
    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="risk_events")
    alerts = relationship("Alert", back_populates="risk_event")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    alert_code = Column(String(50), unique=True, index=True) # e.g. ALT-2026-0042
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    risk_event_id = Column(String(64), ForeignKey("risk_events.id"), nullable=True)
    detector_code = Column(String(20), nullable=False)
    severity = Column(String(20), default="High") # Medium / High / Critical
    status = Column(String(30), default="New") # New / Under Review / Escalated / Dismissed
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    confidence = Column(String(20), default="High")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="alerts")
    risk_event = relationship("RiskEvent", back_populates="alerts")
    case = relationship("Case", back_populates="alert", uselist=False)

class Case(Base):
    __tablename__ = "cases"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    case_number = Column(String(50), unique=True, index=True) # e.g. CASE-2026-00042
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False)
    alert_id = Column(String(64), ForeignKey("alerts.id"), nullable=True)
    owner_user_id = Column(String(64), nullable=True)
    owner_name = Column(String(150), default="Auditor Sharma")
    status = Column(String(30), default="Under Review") # New / Under Review / Resolved / Escalated
    resolution = Column(String(50), nullable=True) # Valid Concern / False Positive / Escalated to Higher Authority
    resolution_reason = Column(Text, nullable=True)
    opened_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="cases")
    alert = relationship("Alert", back_populates="case")
    notes = relationship("CaseNote", back_populates="case", cascade="all, delete-orphan")
    evidence_attachments = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")

class CaseNote(Base):
    __tablename__ = "case_notes"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    case_id = Column(String(64), ForeignKey("cases.id"), nullable=False)
    author_id = Column(String(64), nullable=False)
    author_name = Column(String(150), nullable=False)
    author_role = Column(String(50), default="Auditor")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("Case", back_populates="notes")

class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    case_id = Column(String(64), ForeignKey("cases.id"), nullable=False)
    type = Column(String(50), default="Payment Record / Site Photo / MB Copy")
    title = Column(String(200), nullable=False)
    storage_url = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("Case", back_populates="evidence_attachments")

class AuditLogEntry(Base):
    __tablename__ = "audit_log_entries"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    actor_id = Column(String(64), nullable=False)
    actor_name = Column(String(150), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False) # e.g. "CASE_RESOLVED", "ALERT_DISMISSED", "WEIGHTS_UPDATED", "PROJECT_RESCORING"
    entity_type = Column(String(50), nullable=False) # "CASE", "ALERT", "CONFIG", "PROJECT"
    entity_id = Column(String(64), nullable=False)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class User(Base):
    __tablename__ = "users"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    email = Column(String(150), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # MINISTRY_ANALYST, STATE_NODAL_OFFICER, etc.
    state_id = Column(String(64), ForeignKey("states.id"), nullable=True)
    district_id = Column(String(64), ForeignKey("districts.id"), nullable=True)
    mp_id = Column(String(64), ForeignKey("mps.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ScoringConfig(Base):
    __tablename__ = "scoring_configs"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    config_name = Column(String(100), default="default_weights", unique=True)
    weights_json = Column(JSON, nullable=False)
    thresholds_json = Column(JSON, default=dict)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class QuarantineRecord(Base):
    __tablename__ = "quarantine_records"
    id = Column(String(64), primary_key=True, default=generate_uuid)
    source = Column(String(100), default="CSV Ingestion / API")
    raw_data = Column(JSON, nullable=False)
    reason = Column(Text, nullable=False)
    quarantined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
