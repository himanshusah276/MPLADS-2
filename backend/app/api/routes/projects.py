from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.models import (
    Project, Sanction, Payment, ProgressUpdate, Approval, RiskEvent, State, District, ImplementingAgency, MP
)
from app.core.rbac import get_current_user, CurrentUser, Role
from app.schemas.schemas import (
    ProjectListItem, ProjectDetailResponse, SanctionItem, PaymentItem, ProgressItem, ApprovalItem,
    RiskEventResponse, RiskBreakdown, DuplicateCandidate
)
from app.risk_engine.detectors.d3_duplicate_works import compute_d3_duplicate_works

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=Dict[str, Any])
def list_projects(
    state: Optional[str] = None,
    district: Optional[str] = None,
    category: Optional[str] = None,
    risk_band: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("risk_score_desc", regex="^(risk_score_desc|risk_score_asc|cost_desc|cost_asc|date_desc|date_asc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Project)

    # Scoping by role
    scope = current_user.geography_scope or {}
    if current_user.role == Role.STATE_NODAL_OFFICER and scope.get("state_id"):
        query = query.join(Project.mp).join(MP.constituency).filter(Constituency.state_id == scope["state_id"])
    elif current_user.role == Role.DISTRICT_OFFICER and scope.get("district_id"):
        query = query.join(Project.agency).filter(ImplementingAgency.district_id == scope["district_id"])

    # Query filters
    if state:
        query = query.join(Project.mp).join(MP.constituency).join(State).filter(State.name.ilike(f"%{state}%"))
    if district:
        query = query.join(Project.agency).join(District).filter(District.name.ilike(f"%{district}%"))
    if category:
        query = query.filter(Project.category == category)
    if risk_band:
        query = query.filter(Project.risk_band == risk_band)
    if status:
        query = query.filter(Project.status == status)
    if search:
        s_term = f"%{search}%"
        query = query.filter(
            or_(
                Project.title.ilike(s_term),
                Project.project_code.ilike(s_term),
                Project.description.ilike(s_term)
            )
        )

    # Sorting
    if sort_by == "risk_score_desc":
        query = query.order_by(Project.current_risk_score.desc())
    elif sort_by == "risk_score_asc":
        query = query.order_by(Project.current_risk_score.asc())
    elif sort_by == "cost_desc":
        query = query.order_by(Project.sanctioned_cost.desc())
    elif sort_by == "cost_asc":
        query = query.order_by(Project.sanctioned_cost.asc())
    elif sort_by == "date_desc":
        query = query.order_by(Project.sanction_date.desc())
    elif sort_by == "date_asc":
        query = query.order_by(Project.sanction_date.asc())

    total_count = query.count()
    projects_page = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for p in projects_page:
        st_name = p.mp.constituency.state.name if p.mp and p.mp.constituency and p.mp.constituency.state else "Karnataka"
        dt_name = p.agency.district.name if p.agency and p.agency.district else "Bengaluru Rural"
        
        sub_dict = {}
        for re in p.risk_events:
            sub_dict[re.detector_code] = re.subscore

        items.append(ProjectListItem(
            id=p.id,
            project_code=p.project_code,
            title=p.title,
            category=p.category,
            state_name=st_name,
            district_name=dt_name,
            sanctioned_cost=p.sanctioned_cost,
            sanction_date=p.sanction_date,
            status=p.status,
            current_risk_score=p.current_risk_score,
            risk_band=p.risk_band,
            subscores=sub_dict,
            has_active_alert=len(p.alerts) > 0,
            contractor_name=p.contractor.name if p.contractor else None
        ))

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }

@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project_detail(project_id: str, db: Session = Depends(get_db)):
    p = db.query(Project).filter(or_(Project.id == project_id, Project.project_code == project_id)).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    st_name = p.mp.constituency.state.name if p.mp and p.mp.constituency and p.mp.constituency.state else "Karnataka"
    dt_name = p.agency.district.name if p.agency and p.agency.district else "Bengaluru Rural"

    loc_dict = None
    if p.location:
        loc_dict = {
            "latitude": p.location.latitude,
            "longitude": p.location.longitude,
            "address": p.location.address
        }

    # Financials & Updates
    sanctions = [
        SanctionItem(id=s.id, amount=s.amount, sanction_date=s.sanction_date, approving_authority=s.approving_authority)
        for s in p.sanctions
    ]
    payments = [
        PaymentItem(
            id=pay.id,
            payment_code=pay.payment_code,
            amount=pay.amount,
            payment_date=pay.payment_date,
            installment_stage=pay.installment_stage,
            contractor_name=p.contractor.name if p.contractor else None
        )
        for pay in p.payments
    ]
    progress_updates = [
        ProgressItem(
            id=prg.id,
            progress_pct=prg.progress_pct,
            update_date=prg.update_date,
            submitted_by=prg.submitted_by,
            remarks=prg.remarks
        )
        for prg in p.progress_updates
    ]
    approvals = [
        ApprovalItem(
            id=appr.id,
            stage=appr.stage,
            requested_at=appr.requested_at,
            approved_at=appr.approved_at,
            duration_days=appr.duration_days,
            approver_name=appr.approver_name
        )
        for appr in p.approvals
    ]

    # Risk Events & Explanations
    risk_events_res = []
    subscores = {}
    reasons = []

    for re in p.risk_events:
        risk_events_res.append(RiskEventResponse(
            id=re.id,
            detector_code=re.detector_code,
            detector_name=re.detector_name,
            subscore=re.subscore,
            confidence=re.confidence,
            evidence_json=re.evidence_json or {},
            reason_template=re.reason_template,
            computed_at=re.computed_at
        ))
        subscores[re.detector_code] = re.subscore
        if re.reason_template:
            reasons.append(re.reason_template)

    if not reasons:
        reasons = ["Project parameters (cost, timeline, payment pacing, approvals) are aligned with peer benchmarks."]

    risk_breakdown = RiskBreakdown(
        score=p.current_risk_score,
        risk_band=p.risk_band,
        subscores=subscores,
        reasons=reasons,
        confidence="High" if len(risk_events_res) >= 6 else "Medium"
    )

    # Evaluate Duplicate candidates dynamically
    duplicate_candidates = []
    if p.location:
        # Check nearby projects in database
        near_projects = db.query(Project).filter(Project.id != p.id).limit(60).all()
        cand_list = []
        for np_obj in near_projects:
            if np_obj.location:
                cand_list.append({
                    "id": np_obj.id,
                    "project_code": np_obj.project_code,
                    "title": np_obj.title,
                    "description": np_obj.description,
                    "sanctioned_cost": np_obj.sanctioned_cost,
                    "sanction_date": np_obj.sanction_date,
                    "status": np_obj.status,
                    "location": {"latitude": np_obj.location.latitude, "longitude": np_obj.location.longitude}
                })
        
        cur_dict = {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "location": {"latitude": p.location.latitude, "longitude": p.location.longitude}
        }
        dup_eval = compute_d3_duplicate_works(cur_dict, cand_list)
        for dc in dup_eval.get("duplicate_candidates", []):
            duplicate_candidates.append(DuplicateCandidate(
                project_id=dc["project_id"],
                project_code=dc["project_code"],
                title=dc["title"],
                distance_km=dc["distance_km"],
                similarity_score=dc["similarity_score"],
                sanctioned_cost=dc["sanctioned_cost"],
                sanction_date=dc["sanction_date"] if isinstance(dc["sanction_date"], str) else dc["sanction_date"],
                status=dc["status"]
            ))

    return ProjectDetailResponse(
        id=p.id,
        project_code=p.project_code,
        title=p.title,
        category=p.category,
        description=p.description,
        sanctioned_cost=p.sanctioned_cost,
        sanction_date=p.sanction_date,
        expected_completion=p.expected_completion,
        status=p.status,
        current_risk_score=p.current_risk_score,
        risk_band=p.risk_band,
        last_scored_at=p.last_scored_at,
        injected_anomaly=p.injected_anomaly,
        mp_name=p.mp.name if p.mp else None,
        agency_name=p.agency.name if p.agency else None,
        contractor_name=p.contractor.name if p.contractor else None,
        contractor_id=p.contractor_id,
        state_name=st_name,
        district_name=dt_name,
        location=loc_dict,
        sanctions=sanctions,
        payments=payments,
        progress_updates=progress_updates,
        approvals=approvals,
        risk_events=risk_events_res,
        risk_breakdown=risk_breakdown,
        duplicate_candidates=duplicate_candidates
    )
