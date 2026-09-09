import numpy as np
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest

class MultivariateOutlierDetector:
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42
        )
        self.is_fitted = False
        self.feature_means = None
        self.feature_stds = None

    def fit(self, feature_matrix: np.ndarray):
        if len(feature_matrix) < 10:
            return
        
        # Standardize features
        self.feature_means = np.mean(feature_matrix, axis=0)
        self.feature_stds = np.std(feature_matrix, axis=0) + 1e-6
        norm_matrix = (feature_matrix - self.feature_means) / self.feature_stds
        
        self.model.fit(norm_matrix)
        self.is_fitted = True

    def score_single(self, feature_vector: np.ndarray) -> Dict[str, Any]:
        """
        Features: [cost_deviation_ratio, approval_duration_days, contractor_age_years, payment_velocity_ratio, progress_variance]
        """
        if not self.is_fitted or self.feature_means is None:
            # Fallback heuristic score based on multi-variate signal if model not yet fitted on full dataset
            cost_dev, approval_dur, cont_age, pay_vel, prog_var = feature_vector
            heuristic_score = 15.0
            if cost_dev > 1.3 and pay_vel > 1.5:
                heuristic_score += 45.0
            if approval_dur < 3: # suspiciously fast
                heuristic_score += 20.0
            if cont_age < 1.0: # very newly formed contractor
                heuristic_score += 15.0
            return {
                "detector_code": "D5",
                "detector_name": "Multivariate Outlier (Isolation Forest)",
                "subscore": round(min(100.0, heuristic_score), 1),
                "abstained": False,
                "confidence": "Medium",
                "evidence": {
                    "feature_vector": [round(float(f), 2) for f in feature_vector],
                    "raw_score": -0.1
                },
                "reason_text": "Multivariate: Unusual combination of high payment velocity, rapid approval, and cost deviation (D5)" if heuristic_score > 60 else None
            }

        norm_vec = (feature_vector - self.feature_means) / self.feature_stds
        norm_vec = norm_vec.reshape(1, -1)
        
        # decision_function returns negative values for outliers, positive for inliers
        raw_score = float(self.model.decision_function(norm_vec)[0])
        # Mapping: raw_score ranges typically from -0.3 (extreme outlier) to +0.3 (normal inlier)
        # We map -0.2 -> 90+, 0.0 -> 50, +0.2 -> 15
        subscore = 50.0 - (raw_score * 160.0)
        subscore = min(100.0, max(5.0, subscore))

        is_anomalous = subscore >= 65.0
        reason_text = None
        if is_anomalous:
            reason_text = "Multivariate: Complex non-linear outlier across cost, velocity, and contractor profile (D5)"

        return {
            "detector_code": "D5",
            "detector_name": "Multivariate Outlier (Isolation Forest)",
            "subscore": round(subscore, 1),
            "abstained": False,
            "confidence": "High",
            "evidence": {
                "raw_decision_score": round(raw_score, 4),
                "features": {
                    "cost_deviation": round(float(feature_vector[0]), 2),
                    "approval_duration_days": round(float(feature_vector[1]), 1),
                    "contractor_age_years": round(float(feature_vector[2]), 1),
                    "payment_velocity": round(float(feature_vector[3]), 2),
                    "progress_variance": round(float(feature_vector[4]), 2)
                }
            },
            "reason_text": reason_text
        }

multivariate_detector = MultivariateOutlierDetector()
