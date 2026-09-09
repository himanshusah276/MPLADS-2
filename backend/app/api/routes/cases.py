from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.models import Case, CaseNote, Evidence, Project, Alert, Contractor
from app.core.rbac import get_current_user, CurrentUser, Role
from app.services.audit import log_audit_event
from app.schemas.schemas import (
    CaseListItem, CaseDetailResponse, CaseNoteCreate, CaseResolveRequest, CaseNoteItem, EvidenceItem
)
from app.api.routes.projects import get_project_detail

router = APIRouter(prefix="/cases", tags=["Investigations"])

@router.get("", response_model=Dict[str, Any])
def list_cases(
    status: Optional[str] = None,
    resolution: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Case).join(Case.project)

    if status:
        query = query.filter(Case.status == status)
    if resolution:
        query = query.filter(Case.resolution == resolution)

    query = query.order_by(Case.opened_at.desc())
    total = query.count()
    cases_page = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for c in cases_page:
        p = c.project
        st_name = p.mp.constituency.state.name if p and p.mp and p.mp.constituency and p.mp.constituency.state else "Karnataka"
        dt_name = p.agency.district.name if p and p.agency and p.agency.district else "Bengaluru Rural"

        items.append(CaseListItem(
            id=c.id,
            case_number=c.case_number,
            project_id=c.project_id,
            project_code=p.project_code if p else "PRJ-UNKNOWN",
            project_title=p.title if p else "Project",
            owner_name=c.owner_name,
            status=c.status,
            resolution=c.resolution,
            opened_at=c.opened_at,
            closed_at=c.closed_at,
            risk_score=p.current_risk_score if p else 0,
            risk_band=p.risk_band if p else "Medium",
            state_name=st_name,
            district_name=dt_name
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }

@router.get("/{case_id}", response_model=CaseDetailResponse)
def get_case_workspace_detail(case_id: str, db: Session = Depends(get_db)):
    c = db.query(Case).filter(or_(Case.id == case_id, Case.case_number == case_id)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    proj_detail = get_project_detail(project_id=c.project_id, db=db)

    # Notes
    notes = [
        CaseNoteItem(
            id=n.id,
            author_id=n.author_id,
            author_name=n.author_name,
            author_role=n.author_role,
            content=n.content,
            created_at=n.created_at
        )
        for n in c.notes
    ]

    # Evidence
    evidence_attachments = [
        EvidenceItem(
            id=e.id,
            type=e.type,
            title=e.title,
            storage_url=e.storage_url,
            uploaded_at=e.uploaded_at
        )
        for e in c.evidence_attachments
    ]

    # Contractor History Graph summary
    contractor_history = {}
    if proj_detail.contractor_id:
        c_obj = db.query(Contractor).filter(Contractor.id == proj_detail.contractor_id).first()
        if c_obj:
            all_c_projects = db.query(Project).filter(Project.contractor_id == c_obj.id).all()
            contractor_history = {
                "name": c_obj.name,
                "registration_no": c_obj.registration_no,
                "registered_since": str(c_obj.registered_since),
                "total_projects_count": len(all_c_projects),
                "total_sanctioned_val": sum(p.sanctioned_cost for p in all_c_projects),
                "avg_risk_score": int(sum(p.current_risk_score for p in all_c_projects) / max(len(all_c_projects), 1)),
                "active_projects": len([p for p in all_c_projects if p.status == "Active"]),
                "recent_awards": [
                    {"code": p.project_code, "title": p.title, "cost": p.sanctioned_cost, "date": str(p.sanction_date)}
                    for p in all_c_projects[:5]
                ]
            }

    return CaseDetailResponse(
        id=c.id,
        case_number=c.case_number,
        project_id=c.project_id,
        project_code=proj_detail.project_code,
        project_title=proj_detail.title,
        alert_id=c.alert_id,
        owner_user_id=c.owner_user_id,
        owner_name=c.owner_name,
        status=c.status,
        resolution=c.resolution,
        resolution_reason=c.resolution_reason,
        opened_at=c.opened_at,
        closed_at=c.closed_at,
        project=proj_detail,
        notes=notes,
        evidence_attachments=evidence_attachments,
        contractor_history=contractor_history
    )

@router.post("/{case_id}/notes")
def add_case_note(
    case_id: str,
    req: CaseNoteCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    note = CaseNote(
        case_id=c.id,
        author_id=current_user.id,
        author_name=current_user.name,
        author_role=current_user.role.value,
        content=req.content
    )
    db.add(note)

    # Log audit entry
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        action="CASE_NOTE_ADDED",
        entity_type="CASE",
        entity_id=c.id,
        reason=f"Added investigator note: {req.content[:50]}..."
    )

    db.commit()
    return {"message": "Case note added successfully", "note_id": note.id}

@router.post("/{case_id}/resolve")
def resolve_case(
    case_id: str,
    req: CaseResolveRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    valid_resolutions = ["Valid Concern", "False Positive", "Escalated to Higher Authority"]
    if req.resolution not in valid_resolutions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid resolution. Must be one of: {valid_resolutions}"
        )

    if not req.resolution_reason or len(req.resolution_reason.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="A detailed resolution justification (minimum 10 characters) is required for audit recording."
        )

    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    before_state = {
        "status": c.status,
        "resolution": c.resolution,
        "resolution_reason": c.resolution_reason
    }

    c.status = "Resolved"
    c.resolution = req.resolution
    c.resolution_reason = req.resolution_reason
    c.closed_at = datetime.now(timezone.utc)

    # If alert linked, update alert status
    if c.alert:
        c.alert.status = "Resolved" if req.resolution != "False Positive" else "Dismissed"

    after_state = {
        "status": c.status,
        "resolution": c.resolution,
        "resolution_reason": c.resolution_reason,
        "closed_at": str(c.closed_at)
    }

    # Write permanent immutable audit log entry
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        action="CASE_RESOLVED",
        entity_type="CASE",
        entity_id=c.id,
        before_state=before_state,
        after_state=after_state,
        reason=f"Resolution: {req.resolution}. Justification: {req.resolution_reason}"
    )

    db.commit()
    return {"message": "Case resolved and permanently recorded in audit trail", "case_id": c.id, "resolution": c.resolution}

@router.post("/{case_id}/evidence")
def attach_evidence_file(
    case_id: str,
    title: str = Query(..., description="Evidence document title"),
    evidence_type: str = Query("Measurement Book / Site Inspection Photos / Invoices", description="Type of evidence"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    ev = Evidence(
        case_id=c.id,
        type=evidence_type,
        title=title,
        storage_url=f"/evidence/doc_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.pdf"
    )
    db.add(ev)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        action="EVIDENCE_ATTACHED",
        entity_type="CASE",
        entity_id=c.id,
        reason=f"Attached evidence document: {title} ({evidence_type})"
    )

    db.commit()
    return {"message": "Evidence document attached successfully", "evidence_id": ev.id}
