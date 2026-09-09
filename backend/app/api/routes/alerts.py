import random
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.models import Alert, Case, Project, RiskEvent, State, District, ImplementingAgency, MP
from app.core.rbac import get_current_user, CurrentUser, Role
from app.services.audit import log_audit_event
from app.schemas.schemas import AlertListItem, AlertDismissRequest, AlertEscalateRequest

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=Dict[str, Any])
def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    detector: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).join(Alert.project)

    if severity:
        query = query.filter(Alert.severity == severity)
    if status:
        query = query.filter(Alert.status == status)
    if detector:
        query = query.filter(Alert.detector_code == detector)

    query = query.order_by(Alert.created_at.desc())
    total = query.count()
    alerts_page = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for a in alerts_page:
        p = a.project
        st_name = p.mp.constituency.state.name if p and p.mp and p.mp.constituency and p.mp.constituency.state else "Karnataka"
        dt_name = p.agency.district.name if p and p.agency and p.agency.district else "Bengaluru Rural"

        items.append(AlertListItem(
            id=a.id,
            alert_code=a.alert_code,
            project_id=a.project_id,
            project_code=p.project_code if p else "PRJ-UNKNOWN",
            project_title=p.title if p else "MPLADS Project",
            detector_code=a.detector_code,
            severity=a.severity,
            status=a.status,
            title=a.title,
            description=a.description,
            confidence=a.confidence,
            created_at=a.created_at,
            state_name=st_name,
            district_name=dt_name,
            sanctioned_cost=p.sanctioned_cost if p else 0.0
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }

@router.get("/{alert_id}")
def get_alert_detail(alert_id: str, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(or_(Alert.id == alert_id, Alert.alert_code == alert_id)).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")

    p = a.project
    st_name = p.mp.constituency.state.name if p and p.mp and p.mp.constituency and p.mp.constituency.state else "Karnataka"
    dt_name = p.agency.district.name if p and p.agency and p.agency.district else "Bengaluru Rural"

    evidence_data = a.risk_event.evidence_json if a.risk_event else {}

    return {
        "id": a.id,
        "alert_code": a.alert_code,
        "project_id": a.project_id,
        "project_code": p.project_code,
        "project_title": p.title,
        "detector_code": a.detector_code,
        "severity": a.severity,
        "status": a.status,
        "title": a.title,
        "description": a.description,
        "confidence": a.confidence,
        "created_at": a.created_at,
        "state_name": st_name,
        "district_name": dt_name,
        "sanctioned_cost": p.sanctioned_cost,
        "sanction_date": str(p.sanction_date),
        "evidence": evidence_data,
        "case_id": a.case.id if a.case else None,
        "case_number": a.case.case_number if a.case else None
    }

@router.post("/{alert_id}/escalate")
def escalate_alert_to_case(
    alert_id: str,
    req: AlertEscalateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")

    if a.case:
        return {"message": "Case already exists for this alert", "case_id": a.case.id, "case_number": a.case.case_number}

    before_state = {"status": a.status}
    a.status = "Under Review"

    case_num = f"CASE-2026-{random.randint(10000, 99999)}"
    new_case = Case(
        case_number=case_num,
        project_id=a.project_id,
        alert_id=a.id,
        owner_user_id=current_user.id,
        owner_name=current_user.name,
        status="Under Review",
        resolution=None,
        resolution_reason=None
    )
    db.add(new_case)
    db.flush()

    if req.notes:
        from app.models.models import CaseNote
        note = CaseNote(
            case_id=new_case.id,
            author_id=current_user.id,
            author_name=current_user.name,
            author_role=current_user.role.value,
            content=req.notes
        )
        db.add(note)

    after_state = {"status": a.status, "case_id": new_case.id, "case_number": case_num}
    
    # Write immutable audit entry
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        action="ALERT_ESCALATED_TO_CASE",
        entity_type="ALERT",
        entity_id=a.id,
        before_state=before_state,
        after_state=after_state,
        reason=req.notes or "Escalated to investigation case"
    )

    db.commit()
    return {"message": "Alert escalated to case successfully", "case_id": new_case.id, "case_number": case_num}

@router.post("/{alert_id}/dismiss")
def dismiss_alert(
    alert_id: str,
    req: AlertDismissRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.reason or len(req.reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="A valid justification reason is required to dismiss an alert as False Positive.")

    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")

    before_state = {"status": a.status}
    a.status = "Dismissed"

    after_state = {"status": "Dismissed", "dismissal_reason": req.reason}

    # Write immutable audit entry
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        action="ALERT_DISMISSED_FALSE_POSITIVE",
        entity_type="ALERT",
        entity_id=a.id,
        before_state=before_state,
        after_state=after_state,
        reason=req.reason
    )

    db.commit()
    return {"message": "Alert dismissed as false positive", "alert_id": a.id, "status": "Dismissed"}
