import pytest
from datetime import date
from app.risk_engine.detectors.d1_cost_benchmark import compute_d1_cost_benchmark
from app.risk_engine.detectors.d2_payment_mismatch import compute_d2_payment_mismatch
from app.risk_engine.detectors.d3_duplicate_works import compute_d3_duplicate_works
from app.risk_engine.detectors.d4_staleness import compute_d4_staleness
from app.risk_engine.detectors.d7_contractor_graph import compute_d7_contractor_graph_risk
from app.risk_engine.detectors.d8_approval_velocity import compute_d8_approval_velocity
from app.risk_engine.aggregator import evaluate_project_risk, get_risk_band

def test_d1_cost_benchmark_outlier():
    peer_costs = [2200000, 2400000, 2500000, 2600000, 2800000, 2300000, 2550000, 2450000]
    res = compute_d1_cost_benchmark(
        project_cost=4800000.0,
        peer_costs=peer_costs,
        category_name="Road Construction",
        state_name="Karnataka",
        year=2024
    )
    assert res["abstained"] is False
    assert res["subscore"] >= 65.0
    assert res["reason_text"] is not None
    assert "Sanctioned cost" in res["reason_text"]

def test_d1_abstains_on_sparse_peer_group():
    res = compute_d1_cost_benchmark(
        project_cost=3000000.0,
        peer_costs=[2800000, 3100000, 2900000],
        category_name="Rare Category",
        state_name="Assam",
        year=2024
    )
    assert res["abstained"] is True
    assert res["subscore"] == 0.0

def test_d2_payment_progress_mismatch():
    payments = [{"amount": 1800000.0, "payment_code": "PAY-2024-3391", "payment_date": "2024-08-12"}]
    progress = [{"progress_pct": 15, "update_date": "2024-08-10"}]
    res = compute_d2_payment_mismatch(
        sanctioned_cost=2900000.0,
        payments=payments,
        progress_updates=progress
    )
    assert res["subscore"] >= 80.0
    assert "PAY-2024-3391" in res["evidence"]["flagged_payments"]
    assert "Payment: " in res["reason_text"]

def test_d3_duplicate_works():
    proj1 = {
        "id": "p1",
        "project_code": "PRJ-0091",
        "title": "Widening of internal concrete road, Ward 14",
        "description": "Widening and laying CC road at Ward 14 with side drains",
        "location": {"latitude": 13.0562, "longitude": 77.5921}
    }
    candidate = {
        "id": "p2",
        "project_code": "PRJ-1187",
        "title": "Widening of internal concrete road at Ward 14 Extension",
        "description": "Laying and widening CC road at Ward 14 Extension with side drains",
        "sanctioned_cost": 2750000,
        "sanction_date": "2023-11-15",
        "status": "Active",
        "location": {"latitude": 13.0610, "longitude": 77.5815}
    }
    res = compute_d3_duplicate_works(proj1, [candidate])
    assert res["subscore"] >= 60.0
    assert len(res["duplicate_candidates"]) == 1
    assert res["duplicate_candidates"][0]["distance_km"] < 2.0
    assert res["duplicate_candidates"][0]["similarity_score"] >= 0.65

def test_d4_staleness():
    res = compute_d4_staleness(
        sanction_date=date(2023, 7, 10),
        expected_completion=date(2023, 12, 31),
        status="Active",
        progress_updates=[{"progress_pct": 20, "update_date": date(2023, 8, 1)}],
        current_date=date(2024, 3, 1)
    )
    assert res["subscore"] >= 60.0
    assert res["reason_text"] is not None

def test_aggregator_weighted_score():
    score_band_crit = get_risk_band(87)
    assert score_band_crit == "Critical"
    score_band_high = get_risk_band(72)
    assert score_band_high == "High"
    score_band_low = get_risk_band(25)
    assert score_band_low == "Low"
