from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.database import Base

class MP(Base):
    __tablename__ = "mps"

    mp_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    house = Column(String(10), nullable=False)  # 'LS' (Lok Sabha) or 'RS' (Rajya Sabha)
    tenure = Column(String(50), default="18th Lok Sabha (2024-2029)", index=True) # 18th LS, 17th LS, Rajya Sabha
    state = Column(String(100), nullable=False, index=True)
    constituency = Column(String(150), nullable=False, index=True)
    party = Column(String(100), nullable=False)
    term_start = Column(String(20), nullable=False)
    term_end = Column(String(20), nullable=False)
    annual_entitlement = Column(Float, default=50000000.0)  # ₹5 Crore
    allocated_limit = Column(Float, default=250000000.0)  # ₹25 Crore 5-yr entitlement
    total_recommended = Column(Float, default=0.0)
    total_sanctioned = Column(Float, default=0.0)
    total_released = Column(Float, default=0.0)
    total_utilized = Column(Float, default=0.0)
    works_recommended_count = Column(Integer, default=0)
    works_sanctioned_count = Column(Integer, default=0)
    works_completed_count = Column(Integer, default=0)
    works_in_progress_count = Column(Integer, default=0)
    uc_pending_flag = Column(Boolean, default=False)
    composite_risk_score = Column(Float, default=0.0)
    risk_band = Column(String(20), default="Low")  # Low, Medium, High, Critical

    works = relationship("Work", back_populates="mp", cascade="all, delete-orphan")
    ucs = relationship("UtilizationCertificate", back_populates="mp", cascade="all, delete-orphan")


class ImplementingAgency(Base):
    __tablename__ = "implementing_agencies"

    agency_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # 'Govt Dept', 'PSU', 'Trust', 'Society', 'Local Body'
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    total_works_handled = Column(Integer, default=0)
    total_sanctioned_amount = Column(Float, default=0.0)
    flagged_works_count = Column(Integer, default=0)
    hhi_concentration_score = Column(Float, default=0.0)
    risk_band = Column(String(20), default="Low")

    works = relationship("Work", back_populates="agency")


class Work(Base):
    __tablename__ = "works"

    work_id = Column(String(50), primary_key=True, index=True)
    mp_id = Column(String(50), ForeignKey("mps.mp_id"), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)  # Drinking Water, Roads, Sanitation, etc.
    description = Column(Text, nullable=False)
    recommended_date = Column(String(20), nullable=False)
    sanction_order_no = Column(String(100), nullable=True)
    sanction_date = Column(String(20), nullable=True)
    sanctioned_amount = Column(Float, default=0.0)
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    implementing_agency_id = Column(String(50), ForeignKey("implementing_agencies.agency_id"), nullable=True)
    status = Column(String(50), default="Recommended")  # Recommended, Sanctioned, In-Progress, Completed, Cancelled
    completion_date = Column(String(20), nullable=True)
    lat = Column(Float, nullable=False)
    long = Column(Float, nullable=False)
    is_outside_constituency = Column(Boolean, default=False)
    financial_year = Column(String(20), default="2024-25", index=True)
    tenure = Column(String(50), default="18th Lok Sabha (2024-2029)", index=True)
    photos_count = Column(Integer, default=2) # Geo-tagged stage completion photographs
    document_attachment_url = Column(String(255), nullable=True)
    risk_score = Column(Float, default=0.0)
    risk_band = Column(String(20), default="Low")

    mp = relationship("MP", back_populates="works")
    agency = relationship("ImplementingAgency", back_populates="works")
    releases = relationship("FundRelease", back_populates="work", cascade="all, delete-orphan")


class FundRelease(Base):
    __tablename__ = "fund_releases"

    payment_id = Column(String(50), primary_key=True, index=True)
    work_id = Column(String(50), ForeignKey("works.work_id"), nullable=False, index=True)
    installment_no = Column(Integer, default=1)  # 1 or 2
    amount = Column(Float, default=0.0)
    release_date = Column(String(20), nullable=False)
    vendor_ref = Column(String(100), nullable=False)
    uc_verified = Column(Boolean, default=True)

    work = relationship("Work", back_populates="releases")


class UtilizationCertificate(Base):
    __tablename__ = "utilization_certificates"

    uc_id = Column(String(50), primary_key=True, index=True)
    mp_id = Column(String(50), ForeignKey("mps.mp_id"), nullable=False, index=True)
    work_id = Column(String(50), nullable=True)
    financial_year = Column(String(20), nullable=False, index=True)
    amount_certified = Column(Float, default=0.0)
    submitted_date = Column(String(20), nullable=True)
    status = Column(String(50), default="pending")  # pending, submitted, overdue, verified
    days_overdue = Column(Integer, default=0)
    audit_certificate_attached = Column(Boolean, default=False)

    mp = relationship("MP", back_populates="ucs")


class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"

    alert_id = Column(String(50), primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True)  # 'work', 'mp', 'agency', 'district'
    entity_id = Column(String(50), nullable=False, index=True)
    alert_type = Column(String(100), nullable=False, index=True)
    risk_score = Column(Float, default=0.0)  # 0 to 100
    severity = Column(String(20), default="Medium", index=True)  # Low, Medium, High, Critical
    description = Column(Text, nullable=False)
    rule_code = Column(String(50), nullable=True)  # R1, R2, R3, R4, R5, R6, ML-ISO, ML-DUP, ML-HHI
    explainable_details = Column(Text, nullable=True)  # JSON or markdown text
    detected_on = Column(String(30), default=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))
    status = Column(String(50), default="Open", index=True)  # Open, Under Review, Resolved, False Positive
    reviewer_role = Column(String(50), nullable=True)
    reviewer_comment = Column(Text, nullable=True)
    reviewed_at = Column(String(30), nullable=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    email = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # ministry, auditor, state_nodal, district_authority, mp
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    mp_id = Column(String(50), nullable=True)
