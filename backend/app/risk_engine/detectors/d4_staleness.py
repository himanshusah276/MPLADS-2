from datetime import date, datetime
from typing import Dict, Any, List, Optional

def compute_d4_staleness(
    sanction_date: date,
    expected_completion: date,
    status: str,
    progress_updates: List[Dict[str, Any]],
    current_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    D4: Execution Staleness
    Rule-based: Days since last progress update vs category-median expected duration.
    Detects ghost/delayed projects with no completion reports.
    """
    if current_date is None:
        current_date = date.today()

    if isinstance(sanction_date, str):
        sanction_date = datetime.strptime(sanction_date, "%Y-%m-%d").date()
    if isinstance(expected_completion, str):
        expected_completion = datetime.strptime(expected_completion, "%Y-%m-%d").date()

    # Determine last activity date
    if progress_updates:
        dates = []
        for p in progress_updates:
            ud = p.get("update_date")
            if isinstance(ud, str):
                ud = datetime.strptime(ud, "%Y-%m-%d").date()
            if ud:
                dates.append(ud)
        last_activity_date = max(dates) if dates else sanction_date
    else:
        last_activity_date = sanction_date

    days_since_update = (current_date - last_activity_date).days
    total_expected_days = max((expected_completion - sanction_date).days, 30)
    days_overdue = (current_date - expected_completion).days

    subscore = 10.0
    is_anomalous = False

    if status in ["Active", "Sanctioned"]:
        if days_since_update > 180 or days_overdue > 60:
            is_anomalous = True
            # Scaling score based on delay and inactivity
            inactivity_factor = min(50.0, (days_since_update / 180.0) * 40.0)
            overdue_factor = min(50.0, max(0.0, days_overdue / 90.0) * 45.0)
            subscore = min(100.0, 30.0 + inactivity_factor + overdue_factor)
        elif days_since_update > 90:
            subscore = 35.0 + (days_since_update - 90) * 0.2
        else:
            subscore = max(5.0, days_since_update * 0.1)
    elif status == "Completed":
        subscore = 5.0

    reason_text = None
    if is_anomalous:
        reason_text = (
            f"Timeline: No progress update in {days_since_update} days against an expected duration "
            f"of {total_expected_days} days (D4)"
        )

    return {
        "detector_code": "D4",
        "detector_name": "Execution Staleness",
        "subscore": round(subscore, 1),
        "abstained": False,
        "confidence": "High",
        "evidence": {
            "days_since_update": days_since_update,
            "days_overdue": max(0, days_overdue),
            "expected_duration_days": total_expected_days,
            "status": status,
            "last_activity_date": str(last_activity_date)
        },
        "reason_text": reason_text
    }
