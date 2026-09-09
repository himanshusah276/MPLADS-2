import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MPLADS Sentinel"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Database
    ENV: str = "dev"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./mplads.db")
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mplads_sentinel_super_secret_jwt_key_sih2026_mo_spi_diid_26102")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for demo ease
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ]
    
    # Default Risk Engine Weights (Admin editable via DB)
    DEFAULT_WEIGHTS: dict = {
        "D1": 0.18, # Cost Benchmarking
        "D2": 0.22, # Payment-Progress Mismatch (high confidence)
        "D3": 0.20, # Duplicate Works (high confidence)
        "D4": 0.12, # Execution Staleness
        "D5": 0.10, # Multivariate Outlier (Isolation Forest)
        "D6": 0.08, # Local Density Outlier (LOF)
        "D7": 0.06, # Contractor Graph Risk
        "D8": 0.04  # Approval Velocity
    }
    
    class Config:
        case_sensitive = True

settings = Settings()
