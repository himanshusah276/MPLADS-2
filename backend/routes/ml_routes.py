from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.database import get_db
from backend.ml.pipeline import pipeline_instance
from backend.schemas import PreCheckWorkRequest, PreCheckWorkResponse

router = APIRouter(prefix="/ml", tags=["ML Microservice & Anomaly Pipeline"])

@router.post("/run-analysis")
def trigger_analysis(db: Session = Depends(get_db)):
    """
    Triggers the live hybrid ML & rule-based pipeline over the latest database records,
    recalculates risk scores, and updates alerts.
    """
    result = pipeline_instance.run_full_pipeline(db)
    return result

@router.post("/retrain")
def retrain_models(db: Session = Depends(get_db)):
    """
    Retrains Isolation Forest and TF-IDF semantic embeddings against fresh works data.
    """
    result = pipeline_instance.run_full_pipeline(db)
    return {
        "status": "success",
        "message": "Isolation Forest and TF-IDF models retrained on latest sanction datasets.",
        "details": result,
        "retrained_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    }

@router.get("/metrics")
def get_ml_metrics():
    """
    Returns explainability parameters, model hyperparameters, and statutory rule definitions.
    """
    return {
        "model_architecture": "Hybrid Rule Engine + Unsupervised Isolation Forest + NLP Semantic Clustering",
        "rules_enforced": [
            {"code": "R1", "name": "80% UC Pre-Release Rule", "statutory_clause": "MPLADS Para 4.3", "threshold": "≥ 80.0% prior expenditure certified"},
            {"code": "R2", "name": "Trust/Society Lifetime Ceiling", "statutory_clause": "MPLADS Para 3.14", "threshold": "Max ₹50.0 Lakh cumulative"},
            {"code": "R3", "name": "Outside Constituency Cap", "statutory_clause": "MPLADS Para 3.12", "threshold": "Max ₹25.0 Lakh per work"},
            {"code": "R4", "name": "Permissible Category Verification", "statutory_clause": "Annexure-VIII", "threshold": "Durable community asset mandate"},
            {"code": "R5", "name": "1-Year Execution Deadline", "statutory_clause": "MPLADS Para 5.2", "threshold": "≤ 365 days completion window"},
            {"code": "R6", "name": "UC Aging Compliance", "statutory_clause": "CAG Compliance Guidelines", "threshold": "30 / 60 / 90+ days aging buckets"}
        ],
        "ml_statistical_models": [
            {"model": "Isolation Forest", "features": ["Cost Overrun %", "Cost Ratio", "Sanctioned Amount"], "contamination": 0.08, "estimators": 100},
            {"model": "TF-IDF + Haversine Spatial Clustering", "similarity_threshold": 0.65, "distance_ceiling_meters": 800.0},
            {"model": "Herfindahl-Hirschman Index (HHI)", "market_share_threshold": 45.0, "index_threshold": 3500}
        ],
        "explainability": "Every generated alert produces human-readable statutory citations and numerical deviation percentages for CAG/MoSPI audit."
    }
