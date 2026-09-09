import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.risk_engine.detectors.d1_cost_benchmark import compute_d1_cost_benchmark
from app.risk_engine.detectors.d2_payment_mismatch import compute_d2_payment_mismatch
from app.risk_engine.detectors.d3_duplicate_works import compute_d3_duplicate_works
from app.risk_engine.detectors.d4_staleness import compute_d4_staleness
from app.risk_engine.detectors.d5_isolation_forest import multivariate_detector
from app.risk_engine.detectors.d6_lof_density import compute_d6_lof_density
from app.risk_engine.detectors.d7_contractor_graph import compute_d7_contractor_graph_risk
from app.risk_engine.detectors.d8_approval_velocity import compute_d8_approval_velocity

def get_risk_band(score: float) -> str:
    if score >= 85.0:
        return "Critical"
    elif score >= 65.0:
        return "High"
    elif score >= 40.0:
        return "Medium"
    else:
        return "Low"

def evaluate_project_risk(
    project_data: Dict[str, Any],
    context: Dict[str, Any],
    weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Evaluates all 8 detectors for a project and computes the explainable composite risk score.
    """
    if weights is None:
        weights = settings.DEFAULT_WEIGHTS

    detector_results = []
    subscores = {}
    reasons = []

    # 1. D1: Cost Benchmark
    d1_res = compute_d1_cost_benchmark(
        project_cost=project_data.get("sanctioned_cost", 0.0),
        peer_costs=context.get("peer_costs", []),
        category_name=project_data.get("category", "General"),
        state_name=project_data.get("state_name", "National"),
        year=project_data.get("sanction_year", 2024)
    )
    detector_results.append(d1_res)
    subscores["D1"] = d1_res["subscore"]
    if d1_res.get("reason_text"):
        reasons.append(d1_res["reason_text"])

    # 2. D2: Payment-Progress Mismatch
    d2_res = compute_d2_payment_mismatch(
        sanctioned_cost=project_data.get("sanctioned_cost", 0.0),
        payments=project_data.get("payments", []),
        progress_updates=project_data.get("progress_updates", [])
    )
    detector_results.append(d2_res)
    subscores["D2"] = d2_res["subscore"]
    if d2_res.get("reason_text"):
        reasons.append(d2_res["reason_text"])

    # 3. D3: Duplicate Works
    d3_res = compute_d3_duplicate_works(
        current_project=project_data,
        candidate_projects=context.get("all_projects_in_state", [])
    )
    detector_results.append(d3_res)
    subscores["D3"] = d3_res["subscore"]
    if d3_res.get("reason_text"):
        reasons.append(d3_res["reason_text"])

    # 4. D4: Execution Staleness
    d4_res = compute_d4_staleness(
        sanction_date=project_data.get("sanction_date"),
        expected_completion=project_data.get("expected_completion"),
        status=project_data.get("status", "Active"),
        progress_updates=project_data.get("progress_updates", [])
    )
    detector_results.append(d4_res)
    subscores["D4"] = d4_res["subscore"]
    if d4_res.get("reason_text"):
        reasons.append(d4_res["reason_text"])

    # 5. D5: Multivariate Outlier (Isolation Forest)
    cost_dev_ratio = project_data.get("sanctioned_cost", 1.0) / max(d1_res["evidence"].get("peer_median_cost", project_data.get("sanctioned_cost", 1.0)), 1.0)
    approval_days = project_data.get("approval_duration_days", 14)
    cont_age = project_data.get("contractor_age_years", 3.0)
    pay_pct = d2_res["evidence"].get("payment_pct", 0.0) / 100.0
    prog_pct = d2_res["evidence"].get("reported_progress_pct", 0) / 100.0
    pay_vel_ratio = pay_pct / max(prog_pct, 0.1)

    import numpy as np
    feat_vec = np.array([cost_dev_ratio, approval_days, cont_age, pay_vel_ratio, abs(pay_pct - prog_pct)])
    d5_res = multivariate_detector.score_single(feat_vec)
    detector_results.append(d5_res)
    subscores["D5"] = d5_res["subscore"]
    if d5_res.get("reason_text"):
        reasons.append(d5_res["reason_text"])

    # 6. D6: Local Density Outlier (LOF)
    d6_res = compute_d6_lof_density(
        project_feature=[project_data.get("sanctioned_cost", 0.0), pay_pct, prog_pct],
        cluster_features=context.get("district_category_features", []),
        district_name=project_data.get("district_name", "District"),
        category_name=project_data.get("category", "General")
    )
    detector_results.append(d6_res)
    subscores["D6"] = d6_res["subscore"]
    if d6_res.get("reason_text"):
        reasons.append(d6_res["reason_text"])

    # 7. D7: Contractor Graph Risk
    d7_res = compute_d7_contractor_graph_risk(
        contractor_id=project_data.get("contractor_id"),
        contractor_name=project_data.get("contractor_name"),
        contractor_all_projects=context.get("contractor_all_projects", []),
        total_district_projects=context.get("total_district_projects", 100)
    )
    detector_results.append(d7_res)
    subscores["D7"] = d7_res["subscore"]
    if d7_res.get("reason_text"):
        reasons.append(d7_res["reason_text"])

    # 8. D8: Approval Velocity
    d8_res = compute_d8_approval_velocity(
        approval_duration_days=approval_days,
        sanctioned_cost=project_data.get("sanctioned_cost", 0.0),
        peer_approval_durations=context.get("peer_approval_durations", [])
    )
    detector_results.append(d8_res)
    subscores["D8"] = d8_res["subscore"]
    if d8_res.get("reason_text"):
        reasons.append(d8_res["reason_text"])

    # Aggregate weighted score
    weighted_sum = 0.0
    total_active_weight = 0.0

    for code, sub in subscores.items():
        w = weights.get(code, 0.125)
        weighted_sum += w * sub
        total_active_weight += w

    composite_score = int(round(weighted_sum / max(total_active_weight, 0.001)))
    composite_score = max(0, min(100, composite_score))
    risk_band = get_risk_band(composite_score)

    # If no anomaly fired, provide normal baseline summary
    if not reasons:
        reasons = ["Project parameters (cost, timeline, payment pacing, approvals) are aligned with peer benchmarks."]

    return {
        "score": composite_score,
        "risk_band": risk_band,
        "subscores": subscores,
        "reasons": reasons,
        "detector_results": detector_results,
        "duplicate_candidates": d3_res.get("duplicate_candidates", []),
        "confidence": "High" if len(detector_results) >= 6 else "Medium"
    }
