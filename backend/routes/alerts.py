from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from backend.database import get_db
from backend.models import AnomalyAlert, Work, MP
from backend.schemas import AlertResponse, AlertTriageRequest
from backend.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["Anomaly Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    entity_type: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    limit: int = Query(250, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(AnomalyAlert)
    if severity and severity != "All":
        query = query.filter(AnomalyAlert.severity == severity)
    if status and status != "All":
        query = query.filter(AnomalyAlert.status == status)
    if entity_type and entity_type != "All":
        query = query.filter(AnomalyAlert.entity_type == entity_type)

    alerts = query.order_by(AnomalyAlert.risk_score.desc(), AnomalyAlert.detected_on.desc()).offset(offset).limit(limit).all()
    results = []

    # Cache work locations and MP names for fast enrichment
    works_map = {w.work_id: {"state": w.state, "district": w.district, "desc": w.description} for w in db.query(Work).all()}
    mps_map = {m.mp_id: {"name": m.name, "state": m.state, "constituency": m.constituency} for m in db.query(MP).all()}

    for a in alerts:
        entity_name = a.entity_id
        alert_state = None
        alert_dist = None

        if a.entity_type == "work" and a.entity_id in works_map:
            w_info = works_map[a.entity_id]
            alert_state = w_info["state"]
            alert_dist = w_info["district"]
            entity_name = f"{a.entity_id} ({w_info['district']})"
        elif a.entity_type == "mp" and a.entity_id in mps_map:
            m_info = mps_map[a.entity_id]
            alert_state = m_info["state"]
            alert_dist = m_info["constituency"]
            entity_name = f"{m_info['name']} ({m_info['constituency']})"

        # Filter by state/district if requested
        if state and state != "All" and alert_state != state:
            continue
        if district and district != "All" and alert_dist != district:
            continue

        resp = AlertResponse.model_validate(a)
        resp.entity_name = entity_name
        resp.state = alert_state
        resp.district = alert_dist
        results.append(resp)

    return results

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_detail(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(AnomalyAlert).filter(AnomalyAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return AlertResponse.model_validate(alert)

@router.post("/{alert_id}/triage")
def triage_alert(
    alert_id: str,
    payload: AlertTriageRequest,
    db: Session = Depends(get_db)
):
    """
    Official Auditor / Nodal Officer triage action.
    Updates alert status (Under Review, Resolved, False Positive) with formal audit comment.
    """
    alert = db.query(AnomalyAlert).filter(AnomalyAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    valid_statuses = ["Open", "Under Review", "Resolved", "False Positive"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    alert.status = payload.status
    alert.reviewer_comment = payload.comment
    alert.reviewer_role = payload.reviewer_role or "Auditor"
    alert.reviewed_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    db.commit()
    db.refresh(alert)

    return {
        "status": "success",
        "message": f"Alert {alert_id} successfully marked as '{alert.status}'",
        "alert": alert
    }
