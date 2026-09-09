from enum import Enum
from typing import List, Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings

security_scheme = HTTPBearer(auto_error=False)

class Role(str, Enum):
    MINISTRY_ANALYST = "MINISTRY_ANALYST"
    STATE_NODAL_OFFICER = "STATE_NODAL_OFFICER"
    DISTRICT_OFFICER = "DISTRICT_OFFICER"
    MP_VIEWER = "MP_VIEWER"
    AUDITOR = "AUDITOR"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"

class GeographyScope:
    def __init__(self, state_id: Optional[str] = None, district_id: Optional[str] = None, mp_id: Optional[str] = None):
        self.state_id = state_id
        self.district_id = district_id
        self.mp_id = mp_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "state_id": self.state_id,
            "district_id": self.district_id,
            "mp_id": self.mp_id
        }

class CurrentUser:
    def __init__(self, user_id: str, email: str, name: str, role: Role, geography_scope: Optional[Dict[str, Any]] = None):
        self.id = user_id
        self.email = email
        self.name = name
        self.role = role
        self.geography_scope = geography_scope or {}

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> CurrentUser:
    if not credentials:
        # For prototype demo simplicity, allow default demo Ministry Analyst if no token provided or fallback
        # Real JWT decode when token is passed
        return CurrentUser(
            user_id="demo-user-ministry-001",
            email="analyst@mospi.gov.in",
            name="Rajesh Sharma (Central Ministry)",
            role=Role.MINISTRY_ANALYST,
            geography_scope={}
        )
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role", Role.MINISTRY_ANALYST.value)
        geography_scope: dict = payload.get("geography_scope", {})
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return CurrentUser(
            user_id=user_id,
            email=payload.get("email", "user@mplads.gov.in"),
            name=payload.get("name", "MPLADS User"),
            role=Role(role),
            geography_scope=geography_scope
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_roles(allowed_roles: List[Role]):
    def role_checker(current_user: CurrentUser = Depends(get_current_user)):
        if current_user.role not in allowed_roles and current_user.role != Role.SYSTEM_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role: {current_user.role.value}"
            )
        return current_user
    return role_checker
