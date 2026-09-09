from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import AuditLogEntry

def log_audit_event(
    db: Session,
    actor_id: str,
    actor_name: str,
    actor_role: str,
    action: str,
    entity_type: str,
    entity_id: str,
    before_state: Optional[Dict[str, Any]] = None,
    after_state: Optional[Dict[str, Any]] = None,
    reason: Optional[str] = None
) -> AuditLogEntry:
    entry = AuditLogEntry(
        actor_id=actor_id,
        actor_name=actor_name,
        actor_role=actor_role,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        before_state=before_state,
        after_state=after_state,
        reason=reason
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
