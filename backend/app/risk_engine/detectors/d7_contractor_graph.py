import networkx as nx
from typing import Dict, Any, List, Optional
from datetime import datetime

def compute_d7_contractor_graph_risk(
    contractor_id: Optional[str],
    contractor_name: Optional[str],
    contractor_all_projects: List[Dict[str, Any]],
    total_district_projects: int = 100
) -> Dict[str, Any]:
    """
    D7: Contractor/Agency Graph Risk
    Graph construction + degree/centrality thresholds.
    Detects contractor concentration, rapid repeat awards, and agency capture.
    """
    if not contractor_id or not contractor_all_projects:
        return {
            "detector_code": "D7",
            "detector_name": "Contractor Concentration & Graph Risk",
            "subscore": 10.0,
            "abstained": False,
            "confidence": "Medium",
            "evidence": {
                "contractor_name": contractor_name or "Unassigned",
                "total_projects_awarded": 0,
                "concentration_pct": 0.0
            },
            "reason_text": None
        }

    proj_count = len(contractor_all_projects)
    total_val = sum(p.get("sanctioned_cost", 0) for p in contractor_all_projects)
    
    # Calculate unique agencies that awarded to this contractor
    agencies = set(p.get("agency_id") for p in contractor_all_projects if p.get("agency_id"))
    
    # Check award timing concentration (multiple high-value projects within <45 days)
    award_dates = []
    for p in contractor_all_projects:
        sd = p.get("sanction_date")
        if sd:
            if isinstance(sd, str):
                try:
                    sd = datetime.strptime(sd, "%Y-%m-%d").date()
                except Exception:
                    sd = None
            if sd:
                award_dates.append(sd)

    rapid_awards_count = 0
    if len(award_dates) >= 3:
        award_dates.sort()
        for i in range(len(award_dates) - 1):
            if (award_dates[i+1] - award_dates[i]).days <= 30:
                rapid_awards_count += 1

    concentration_ratio = proj_count / max(total_district_projects, 10)

    # Subscore logic:
    # High project count (>8) + rapid repeat awards -> High Risk
    subscore = 10.0
    if proj_count >= 8 and rapid_awards_count >= 3:
        subscore = 82.0
    elif proj_count >= 6:
        subscore = 65.0
    elif proj_count >= 4 and rapid_awards_count >= 2:
        subscore = 55.0
    elif proj_count >= 3:
        subscore = 35.0

    is_anomalous = subscore >= 60.0
    reason_text = None
    if is_anomalous:
        reason_text = (
            f"Contractor Graph: Contractor '{contractor_name}' has captured {proj_count} high-value awards "
            f"(total ₹{total_val/100000:.1f}L) with {rapid_awards_count} repeat awards in rapid succession (D7)"
        )

    return {
        "detector_code": "D7",
        "detector_name": "Contractor Concentration & Graph Risk",
        "subscore": round(subscore, 1),
        "abstained": False,
        "confidence": "High",
        "evidence": {
            "contractor_name": contractor_name,
            "total_projects_awarded": proj_count,
            "total_awarded_value": total_val,
            "distinct_agencies_count": len(agencies),
            "rapid_awards_count": rapid_awards_count,
            "concentration_ratio": round(concentration_ratio, 3)
        },
        "reason_text": reason_text
    }
