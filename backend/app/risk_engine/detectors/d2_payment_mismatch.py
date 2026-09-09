from typing import Dict, Any, List

def compute_d2_payment_mismatch(
    sanctioned_cost: float,
    payments: List[Dict[str, Any]],
    progress_updates: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    D2: Payment-Progress Mismatch
    Rule + ratio check: cumulative_payment_pct - reported_progress_pct
    Flags tranches released far ahead of reported physical milestones.
    """
    total_paid = sum(p.get("amount", 0.0) for p in payments)
    payment_pct = (total_paid / max(sanctioned_cost, 1.0)) * 100.0

    # Get latest progress percentage
    if progress_updates:
        latest_progress = max(p.get("progress_pct", 0) for p in progress_updates)
    else:
        latest_progress = 0

    gap_pct = payment_pct - latest_progress

    # Calculate subscore
    # Gap < 15% -> Low risk (0-30)
    # Gap 15-30% -> Medium risk (30-65)
    # Gap 30-50% -> High risk (65-85)
    # Gap > 50% -> Critical risk (85-100)
    if gap_pct <= 10:
        subscore = max(5.0, gap_pct * 2.0)
    elif gap_pct <= 25:
        subscore = 25.0 + (gap_pct - 10) * 2.5
    elif gap_pct <= 45:
        subscore = 62.5 + (gap_pct - 25) * 1.1
    else:
        subscore = min(100.0, 84.5 + (gap_pct - 45) * 0.8)

    is_anomalous = gap_pct > 25.0 and total_paid > 0

    flagged_payments = []
    reason_text = None
    if is_anomalous and payments:
        # Find latest significant payment
        last_pay = sorted(payments, key=lambda x: str(x.get("payment_date", "")), reverse=True)[0]
        pay_code = last_pay.get("payment_code", "PAY-RECENT")
        flagged_payments.append(pay_code)
        
        reason_text = (
            f"Payment: ₹{total_paid/100000:.1f}L ({payment_pct:.0f}% of sanctioned cost) was released "
            f"while reported physical progress stood at {latest_progress}% (D2, Payment ID {pay_code})"
        )

    return {
        "detector_code": "D2",
        "detector_name": "Payment-Progress Mismatch",
        "subscore": round(subscore, 1),
        "abstained": False,
        "confidence": "High",
        "evidence": {
            "sanctioned_cost": sanctioned_cost,
            "total_paid": total_paid,
            "payment_pct": round(payment_pct, 1),
            "reported_progress_pct": latest_progress,
            "gap_pct": round(gap_pct, 1),
            "flagged_payments": flagged_payments
        },
        "reason_text": reason_text
    }
