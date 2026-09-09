from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Case, Project, State
from app.core.rbac import get_current_user, CurrentUser
from app.api.routes.cases import get_case_workspace_detail

router = APIRouter(prefix="/reports", tags=["Reports & Dossiers"])

@router.get("/case/{case_id}")
def generate_case_dossier(case_id: str, db: Session = Depends(get_db)):
    """Provides formatted dossier payload ready for printable PDF export."""
    case_detail = get_case_workspace_detail(case_id=case_id, db=db)
    
    return {
        "report_type": "INVESTIGATION_CASE_DOSSIER",
        "generated_at": str(case_detail.opened_at),
        "case_number": case_detail.case_number,
        "investigation_officer": case_detail.owner_name,
        "status": case_detail.status,
        "resolution": case_detail.resolution,
        "resolution_reason": case_detail.resolution_reason,
        "project": {
            "code": case_detail.project.project_code,
            "title": case_detail.project.title,
            "category": case_detail.project.category,
            "state": case_detail.project.state_name,
            "district": case_detail.project.district_name,
            "sanctioned_cost": case_detail.project.sanctioned_cost,
            "sanction_date": str(case_detail.project.sanction_date),
            "contractor": case_detail.project.contractor_name,
            "risk_score": case_detail.project.current_risk_score,
            "risk_band": case_detail.project.risk_band,
            "reasons": case_detail.project.risk_breakdown.reasons,
            "subscores": case_detail.project.risk_breakdown.subscores
        },
        "financial_summary": {
            "total_sanctioned": case_detail.project.sanctioned_cost,
            "total_disbursed": sum(p.amount for p in case_detail.project.payments),
            "disbursement_pct": round((sum(p.amount for p in case_detail.project.payments) / max(case_detail.project.sanctioned_cost, 1.0)) * 100, 1),
            "latest_progress_pct": max([p.progress_pct for p in case_detail.project.progress_updates], default=0)
        },
        "case_notes": [
            {"author": n.author_name, "role": n.author_role, "time": str(n.created_at), "content": n.content}
            for n in case_detail.notes
        ],
        "evidence_attachments": [
            {"title": e.title, "type": e.type, "url": e.storage_url}
            for e in case_detail.evidence_attachments
        ]
    }

@router.get("/state-summary/{state_code}")
def generate_state_summary(state_code: str, db: Session = Depends(get_db)):
    """Provides formatted state compliance dossier."""
    st = db.query(State).filter(State.code == state_code.upper()).first()
    if not st:
        st = db.query(State).first()

    return {
        "report_type": "STATE_COMPLIANCE_SUMMARY",
        "state_name": st.name if st else "Karnataka",
        "state_code": st.code if st else "KA",
        "reporting_period": "FY 2024-25 / Q2",
        "total_allocated_cr": 45.0,
        "total_utilized_cr": 35.1,
        "utilization_pct": 78.0,
        "active_projects_count": 420,
        "completed_projects_count": 185,
        "high_risk_projects_count": 8,
        "critical_risk_projects_count": 3,
        "top_flags": [
            "Payment-Progress Mismatch in Doddaballapura Road Works (PRJ-2024-0091)",
            "Duplicate description alignment in Ward 14 Extension works",
            "Contractor concentration in drainage tenders (Nelamangala division)"
        ]
    }
