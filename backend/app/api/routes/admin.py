import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import ScoringConfig, AuditLogEntry, Project
from app.core.rbac import get_current_user, CurrentUser, Role
from app.core.config import settings
from app.services.audit import log_audit_event
from app.services.seed_generator import generate_initial_risk_events_and_alerts
from app.schemas.schemas import ScoringConfigResponse, ScoringConfigUpdate, ScoringRunResponse, AuditLogItem

router = APIRouter(prefix="/admin", tags=["Administration & Model Configuration"])

@router.get("/config", response_model=ScoringConfigResponse)
def get_scoring_config(db: Session = Depends(get_db)):
    cfg = db.query(ScoringConfig).filter(ScoringConfig.config_name == "default_weights").first()
    if not cfg:
        return {
            "weights": settings.DEFAULT_WEIGHTS,
            "thresholds": {"critical_threshold": 85, "high_threshold": 65, "medium_threshold": 40},
            "updated_at": datetime.now(timezone.utc)
        }
    return {
        "weights": cfg.weights_json,
        "thresholds": cfg.thresholds_json or {"critical_threshold": 85, "high_threshold": 65, "medium_threshold": 40},
        "updated_at": cfg.updated_at
    }

@router.patch("/config", response_model=ScoringConfigResponse)
def update_scoring_config(
    req: ScoringConfigUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cfg = db.query(ScoringConfig).filter(ScoringConfig.config_name == "default_weights").first()
    if not cfg:
        cfg = ScoringConfig(
            config_name="default_weights",
            weights_json=settings.DEFAULT_WEIGHTS,
            thresholds_json={"critical_threshold": 85, "high_threshold": 65, "medium_threshold": 40}
        )
        db.add(cfg)
        db.flush()

    before_state = {"weights": cfg.weights_json, "thresholds": cfg.thresholds_json}

    cfg.weights_json = req.weights
    if req.thresholds:
        cfg.thresholds_json = req.thresholds
    cfg.updated_at = datetime.now(timezone.utc)

    after_state = {"weights": cfg.weights_json, "thresholds": cfg.thresholds_json}

    # Log audit entry
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        action="MODEL_WEIGHTS_UPDATED",
        entity_type="CONFIG",
        entity_id=cfg.id,
        before_state=before_state,
        after_state=after_state,
        reason="Updated detector weights for live model tuning"
    )

    db.commit()
    return {
        "weights": cfg.weights_json,
        "thresholds": cfg.thresholds_json,
        "updated_at": cfg.updated_at
    }

@router.post("/recompute", response_model=ScoringRunResponse)
def trigger_batch_scoring(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers batch re-scoring across all projects in the system with latest weights.
    Used for live demonstration during SIH presentations.
    """
    start_time = time.time()
    
    # Re-run scoring engine across projects
    generate_initial_risk_events_and_alerts(db)

    duration_ms = (time.time() - start_time) * 1000.0
    total_proj = db.query(Project).count()
    crit_count = db.query(Project).filter(Project.risk_band == "Critical").count()
    high_count = db.query(Project).filter(Project.risk_band == "High").count()

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        action="BATCH_RESCORING_EXECUTED",
        entity_type="SYSTEM",
        entity_id="scoring_engine",
        before_state=None,
        after_state={"total_scored": total_proj, "critical_alerts": crit_count, "execution_ms": duration_ms},
        reason=f"Admin triggered full batch re-scoring in {duration_ms:.1f}ms"
    )

    return {
        "total_projects_scored": total_proj,
        "critical_alerts_generated": crit_count,
        "high_alerts_generated": high_count,
        "execution_time_ms": round(duration_ms, 2),
        "timestamp": datetime.now(timezone.utc)
    }

@router.get("/audit-log", response_model=Dict[str, Any])
def list_audit_log(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLogEntry)
    if action:
        query = query.filter(AuditLogEntry.action == action)
    if entity_type:
        query = query.filter(AuditLogEntry.entity_type == entity_type)

    query = query.order_by(AuditLogEntry.created_at.desc())
    total = query.count()
    entries = query.offset((page - 1) * page_size).limit(page_size).all()

    items = [
        AuditLogItem(
            id=e.id,
            actor_id=e.actor_id,
            actor_name=e.actor_name,
            actor_role=e.actor_role,
            action=e.action,
            entity_type=e.entity_type,
            entity_id=e.entity_id,
            before_state=e.before_state,
            after_state=e.after_state,
            reason=e.reason,
            created_at=e.created_at
        )
        for e in entries
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
