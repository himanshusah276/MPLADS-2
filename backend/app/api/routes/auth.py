from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.models import User, State, District, MP
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.rbac import get_current_user, CurrentUser, Role
from app.schemas.schemas import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RoleSwitchRequest(BaseModel):
    role: str
    email: str

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    geo_scope = {
        "state_id": user.state_id,
        "district_id": user.district_id,
        "mp_id": user.mp_id
    }
    
    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        geography_scope=geo_scope
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "state_id": user.state_id,
            "district_id": user.district_id,
            "mp_id": user.mp_id
        }
    }

@router.get("/me")
def get_current_user_profile(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user.id).first()
    if user:
        state_name = user.state_id and db.query(State).filter(State.id == user.state_id).first()
        district_name = user.district_id and db.query(District).filter(District.id == user.district_id).first()
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "state_name": state_name.name if state_name else None,
            "district_name": district_name.name if district_name else None,
            "geography_scope": current_user.geography_scope
        }
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role.value,
        "geography_scope": current_user.geography_scope
    }

@router.get("/demo-users")
def list_demo_users(db: Session = Depends(get_db)):
    """Returns the 6 demo personas for 1-click login during SIH presentation."""
    users = db.query(User).all()
    result = []
    for u in users:
        state_name = u.state_id and db.query(State).filter(State.id == u.state_id).first()
        district_name = u.district_id and db.query(District).filter(District.id == u.district_id).first()
        
        scope_str = "National Scope (All States)"
        if district_name:
            scope_str = f"{state_name.name if state_name else ''} · District: {district_name.name}"
        elif state_name:
            scope_str = f"State Scope: {state_name.name}"
        elif u.role == Role.MP_VIEWER.value:
            scope_str = "Constituency Transparency View"

        result.append({
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "scope_description": scope_str,
            "state_name": state_name.name if state_name else None,
            "district_name": district_name.name if district_name else None
        })
    return result

@router.post("/switch-demo-persona", response_model=TokenResponse)
def switch_demo_persona(req: RoleSwitchRequest, db: Session = Depends(get_db)):
    """Quick persona switcher for judging presentation."""
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        user = db.query(User).filter(User.role == req.role).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Demo persona not found")

    geo_scope = {
        "state_id": user.state_id,
        "district_id": user.district_id,
        "mp_id": user.mp_id
    }
    
    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        geography_scope=geo_scope
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "state_id": user.state_id,
            "district_id": user.district_id,
            "mp_id": user.mp_id
        }
    }
