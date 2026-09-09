import numpy as np
from typing import Dict, Any, List

def compute_d8_approval_velocity(
    approval_duration_days: int,
    sanctioned_cost: float,
    peer_approval_durations: List[int]
) -> Dict[str, Any]:
    """
    D8: Approval Velocity
    Procurement & approval shortcut detection.
    Flags high-value projects with unusually accelerated approvals (<2-3 days) or extreme delays.
    """
    if len(peer_approval_durations) < 5:
        peer_approval_durations = [14, 21, 28, 18, 15, 30, 25]

    percentile = float(np.sum(np.array(peer_approval_durations) <= approval_duration_days) / len(peer_approval_durations) * 100.0)

    subscore = 10.0
    is_anomalous = False
    reason_text = None

    # High value project (e.g. > ₹25L) approved in under 3 days
    if sanctioned_cost > 2500000 and approval_duration_days <= 3:
        subscore = 75.0
        is_anomalous = True
        reason_text = (
            f"Approval: High-value project (₹{sanctioned_cost/100000:.1f}L) approved in just "
            f"{approval_duration_days} days (bottom {percentile:.0f}th percentile of peer approvals) (D8)"
        )
    elif approval_duration_days <= 2:
        subscore = 55.0
        if percentile <= 5.0:
            is_anomalous = True
            reason_text = f"Approval: Unusually accelerated approval cycle of {approval_duration_days} days (D8)"
    elif approval_duration_days > 90:
        subscore = 45.0

    return {
        "detector_code": "D8",
        "detector_name": "Approval Velocity",
        "subscore": round(subscore, 1),
        "abstained": False,
        "confidence": "Medium",
        "evidence": {
            "approval_duration_days": approval_duration_days,
            "percentile_rank": round(percentile, 1),
            "sanctioned_cost": sanctioned_cost
        },
        "reason_text": reason_text
    }
