from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Project, State, District, Location
from app.core.rbac import get_current_user, CurrentUser

router = APIRouter(prefix="/map", tags=["Geospatial Intelligence"])

@router.get("/projects")
def get_map_projects(
    state: Optional[str] = None,
    category: Optional[str] = None,
    risk_band: Optional[str] = None,
    limit: int = Query(500, ge=10, le=2000),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Project).join(Project.location)

    if state:
        query = query.join(Project.mp).join(MP.constituency).join(State).filter(State.name == state)
    if category:
        query = query.filter(Project.category == category)
    if risk_band:
        query = query.filter(Project.risk_band == risk_band)

    projects = query.limit(limit).all()

    features = []
    for p in projects:
        if not p.location:
            continue
        
        st_name = p.mp.constituency.state.name if p.mp and p.mp.constituency and p.mp.constituency.state else "Karnataka"
        dt_name = p.agency.district.name if p.agency and p.agency.district else "District"

        features.append({
            "id": p.id,
            "project_code": p.project_code,
            "title": p.title,
            "category": p.category,
            "sanctioned_cost": p.sanctioned_cost,
            "current_risk_score": p.current_risk_score,
            "risk_band": p.risk_band,
            "status": p.status,
            "latitude": p.location.latitude,
            "longitude": p.location.longitude,
            "address": p.location.address,
            "state_name": st_name,
            "district_name": dt_name,
            "contractor_name": p.contractor.name if p.contractor else None
        })

    return {
        "count": len(features),
        "projects": features
    }
