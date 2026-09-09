import numpy as np
from typing import Dict, Any, List
from sklearn.neighbors import LocalOutlierFactor

def compute_d6_lof_density(
    project_feature: List[float],
    cluster_features: List[List[float]],
    district_name: str,
    category_name: str
) -> Dict[str, Any]:
    """
    D6: Local Density Outliers (LOF)
    Projects that are outliers relative to their immediate peer cluster (district + category).
    Catches anomalies missed by the global macro model.
    """
    if len(cluster_features) < 6:
        return {
            "detector_code": "D6",
            "detector_name": "Local Density Outlier (LOF)",
            "subscore": 10.0,
            "abstained": True,
            "confidence": "Low",
            "evidence": {
                "cluster_size": len(cluster_features),
                "reason": "District-category cluster too small for LOF density estimation (< 6)"
            },
            "reason_text": None
        }

    try:
        X = np.array(cluster_features)
        target = np.array(project_feature).reshape(1, -1)
        combined = np.vstack([target, X])

        n_neighbors = min(10, len(combined) - 1)
        lof = LocalOutlierFactor(n_neighbors=n_neighbors, novelty=True)
        lof.fit(X)
        
        # negative_outlier_factor_: close to -1 is inlier, << -1.5 is outlier
        score = float(lof.score_samples(target)[0])
        
        # Mapping score (-1.0 -> 15, -1.5 -> 50, -2.5 -> 90)
        subscore = max(5.0, min(100.0, 15.0 + max(0.0, (-score - 1.0) * 50.0)))

        is_anomalous = subscore >= 65.0
        reason_text = None
        if is_anomalous:
            reason_text = (
                f"Local Cluster: Project metrics diverge significantly from local '{category_name}' "
                f"density norms in {district_name} (D6)"
            )

        return {
            "detector_code": "D6",
            "detector_name": "Local Density Outlier (LOF)",
            "subscore": round(subscore, 1),
            "abstained": False,
            "confidence": "High",
            "evidence": {
                "lof_score": round(score, 3),
                "cluster_size": len(cluster_features),
                "district": district_name,
                "category": category_name
            },
            "reason_text": reason_text
        }
    except Exception:
        return {
            "detector_code": "D6",
            "detector_name": "Local Density Outlier (LOF)",
            "subscore": 10.0,
            "abstained": True,
            "confidence": "Low",
            "evidence": {"error": "LOF calculation fallback"},
            "reason_text": None
        }
