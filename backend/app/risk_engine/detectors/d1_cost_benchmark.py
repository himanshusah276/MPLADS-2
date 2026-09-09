import math
import numpy as np
from typing import Dict, Any, Optional

def compute_d1_cost_benchmark(
    project_cost: float,
    peer_costs: list[float],
    category_name: str,
    state_name: str,
    year: int
) -> Dict[str, Any]:
    """
    D1: Cost Benchmarking
    Modified z-score on log-cost within peer group (category x state x year).
    Abstains if peer group size < 5.
    """
    if len(peer_costs) < 5:
        return {
            "detector_code": "D1",
            "detector_name": "Cost Benchmarking",
            "subscore": 0.0,
            "abstained": True,
            "confidence": "Low",
            "evidence": {
                "peer_count": len(peer_costs),
                "reason": "Insufficient peer group data (< 5 projects in category/state/year)"
            },
            "reason_text": None
        }

    log_peer_costs = np.log([max(c, 1000.0) for c in peer_costs])
    log_cost = math.log(max(project_cost, 1000.0))

    median_log = float(np.median(log_peer_costs))
    median_cost = float(np.exp(median_log))
    
    mad = float(np.median(np.abs(log_peer_costs - median_log)))
    if mad < 1e-4:
        mad = 0.1 # avoid division by zero

    # Modified Z-score: 0.6745 * (x - median) / MAD
    modified_z = 0.6745 * (log_cost - median_log) / mad
    deviation_pct = ((project_cost - median_cost) / median_cost) * 100.0

    # Calculate subscore (0 to 100)
    if modified_z > 0:
        # z = 1.5 -> ~60, z = 2.5 -> ~85, z >= 3.5 -> 95-100
        subscore = min(100.0, max(0.0, 40.0 + modified_z * 18.0))
    else:
        subscore = max(0.0, 20.0 + modified_z * 10.0)

    is_anomalous = deviation_pct > 25.0 and modified_z > 1.5

    reason_text = None
    if is_anomalous:
        reason_text = (
            f"Financial: Sanctioned cost (₹{project_cost/100000:.1f}L) is {deviation_pct:.0f}% above "
            f"the median for comparable '{category_name}' works in {state_name} ({year}) (D1)"
        )

    return {
        "detector_code": "D1",
        "detector_name": "Cost Benchmarking",
        "subscore": round(subscore, 1),
        "abstained": False,
        "confidence": "High" if len(peer_costs) >= 15 else "Medium",
        "evidence": {
            "sanctioned_cost": project_cost,
            "peer_median_cost": median_cost,
            "deviation_pct": round(deviation_pct, 1),
            "modified_z_score": round(modified_z, 2),
            "peer_count": len(peer_costs)
        },
        "reason_text": reason_text
    }
