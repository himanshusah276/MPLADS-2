import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from collections import defaultdict

from sqlalchemy.orm import Session
from backend.models import MP, Work, ImplementingAgency, FundRelease, UtilizationCertificate, AnomalyAlert
from backend.ml.rule_engine import MPLADSRuleEngine
from backend.ml.isolation_forest_model import StatisticalAnomalyDetector
from backend.ml.duplicate_detector import DuplicateWorkDetector
from backend.ml.agency_analyzer import AgencyConcentrationAnalyzer

def get_risk_band(score: float) -> str:
    if score >= 75.0:
        return "Critical"
    elif score >= 50.0:
        return "High"
    elif score >= 25.0:
        return "Medium"
    return "Low"

class MPLADSMLPipeline:
    """
    Master Hybrid ML & Rule-Based Anomaly Detection Pipeline for MPLADS.
    """

    def __init__(self):
        self.rule_engine = MPLADSRuleEngine()
        self.iso_detector = StatisticalAnomalyDetector()
        self.dup_detector = DuplicateWorkDetector()
        self.agency_analyzer = AgencyConcentrationAnalyzer()

    def run_full_pipeline(self, db: Session) -> Dict[str, Any]:
        """
        Executes all anomaly models over database, updates risk scores, and generates AnomalyAlert records.
        """
        mps = db.query(MP).all()
        works = db.query(Work).all()
        agencies = db.query(ImplementingAgency).all()
        fund_releases = db.query(FundRelease).all()
        ucs = db.query(UtilizationCertificate).all()

        agencies_map = {a.agency_id: {"name": a.name, "type": a.type, "district": a.district} for a in agencies}

        works_data = []
        for w in works:
            works_data.append({
                "work_id": w.work_id,
                "mp_id": w.mp_id,
                "state": w.state,
                "district": w.district,
                "category": w.category,
                "description": w.description,
                "recommended_date": w.recommended_date,
                "sanction_date": w.sanction_date,
                "sanctioned_amount": w.sanctioned_amount,
                "estimated_cost": w.estimated_cost,
                "actual_cost": w.actual_cost,
                "implementing_agency_id": w.implementing_agency_id,
                "status": w.status,
                "completion_date": w.completion_date,
                "lat": w.lat,
                "long": w.long,
                "is_outside_constituency": w.is_outside_constituency,
                "financial_year": w.financial_year
            })

        mps_data = [{"mp_id": m.mp_id, "name": m.name, "state": m.state, "constituency": m.constituency} for m in mps]

        generated_alerts: List[Dict[str, Any]] = []
        work_risk_scores = defaultdict(float)
        work_violation_counts = defaultdict(int)

        # -------------------------------------------------------------
        # 1. DETERMINISTIC RULE CHECKS (Per Work & MP)
        # -------------------------------------------------------------
        # Track cumulative amounts to Trust/Society agencies
        agency_cumulative_spend = defaultdict(float)
        for w in works:
            ag_id = w.implementing_agency_id
            if ag_id:
                agency_cumulative_spend[ag_id] += (w.sanctioned_amount or 0.0)

        for w in works:
            # Rule R2: Trust lifetime limit
            if w.implementing_agency_id and w.implementing_agency_id in agencies_map:
                ag_type = agencies_map[w.implementing_agency_id].get("type")
                cum_amount = agency_cumulative_spend[w.implementing_agency_id]
                has_violation, explanation = self.rule_engine.check_trust_lifetime_limit(
                    ag_type, cum_amount - (w.sanctioned_amount or 0.0), w.sanctioned_amount or 0.0
                )
                if has_violation:
                    work_risk_scores[w.work_id] += 40.0
                    work_violation_counts[w.work_id] += 1
                    generated_alerts.append({
                        "entity_type": "work",
                        "entity_id": w.work_id,
                        "alert_type": "Rule Violation: Trust Limit",
                        "rule_code": "R2",
                        "risk_score": 85.0,
                        "severity": "Critical",
                        "description": explanation,
                        "explainable_details": f"Guidelines Para 3.14 ceiling exceeded for agency {w.implementing_agency_id}."
                    })

            # Rule R3: Outside Constituency > ₹25 Lakh
            has_violation, explanation = self.rule_engine.check_outside_constituency_limit(
                w.is_outside_constituency, w.sanctioned_amount or 0.0
            )
            if has_violation:
                work_risk_scores[w.work_id] += 35.0
                work_violation_counts[w.work_id] += 1
                generated_alerts.append({
                    "entity_type": "work",
                    "entity_id": w.work_id,
                    "alert_type": "Rule Violation: Outside Constituency",
                    "rule_code": "R3",
                    "risk_score": 80.0,
                    "severity": "High",
                    "description": explanation,
                    "explainable_details": f"Para 3.12 statutory limit is ₹25 Lakh. Sanctioned: ₹{w.sanctioned_amount/100000:.2f} Lakh."
                })

            # Rule R4: Non-permissible Annexure-VIII category check
            has_violation, explanation = self.rule_engine.check_permissible_category(w.category, w.description)
            if has_violation:
                work_risk_scores[w.work_id] += 35.0
                work_violation_counts[w.work_id] += 1
                severity = "Critical" if "Prohibited" in explanation else "Medium"
                generated_alerts.append({
                    "entity_type": "work",
                    "entity_id": w.work_id,
                    "alert_type": "Rule Violation: Category Non-Permissible",
                    "rule_code": "R4",
                    "risk_score": 85.0 if severity == "Critical" else 55.0,
                    "severity": severity,
                    "description": explanation,
                    "explainable_details": "Asset item does not conform to official Annexure-VIII durable community asset mandate."
                })

            # Rule R5: In-progress work delay > 1 year
            has_violation, explanation = self.rule_engine.check_execution_delay(
                w.status, w.sanction_date, w.completion_date
            )
            if has_violation:
                work_risk_scores[w.work_id] += 25.0
                work_violation_counts[w.work_id] += 1
                generated_alerts.append({
                    "entity_type": "work",
                    "entity_id": w.work_id,
                    "alert_type": "Rule Violation: Work Delay",
                    "rule_code": "R5",
                    "risk_score": 65.0,
                    "severity": "Medium",
                    "description": explanation,
                    "explainable_details": "Para 5.2 stipulates 1-year normal completion window."
                })

        # -------------------------------------------------------------
        # 2. RULE R1: UC Release Threshold Check on Fund Releases
        # -------------------------------------------------------------
        work_releases = defaultdict(list)
        for rel in fund_releases:
            work_releases[rel.work_id].append(rel)

        for w in works:
            releases = sorted(work_releases.get(w.work_id, []), key=lambda r: r.installment_no)
            if len(releases) >= 2:
                inst1 = releases[0]
                inst2 = releases[1]
                # Check if UC was certified prior to inst2 release
                if not inst2.uc_verified:
                    has_v, exp = self.rule_engine.check_uc_release_threshold(
                        2, 0.0, inst1.amount
                    )
                    if has_v:
                        work_risk_scores[w.work_id] += 40.0
                        work_violation_counts[w.work_id] += 1
                        generated_alerts.append({
                            "entity_type": "work",
                            "entity_id": w.work_id,
                            "alert_type": "Rule Violation: UC Release",
                            "rule_code": "R1",
                            "risk_score": 88.0,
                            "severity": "Critical",
                            "description": exp,
                            "explainable_details": "Installment 2 disbursed without verified 80% Utilization Certificate."
                        })

        # -------------------------------------------------------------
        # 3. RULE R6: Utilization Certificate Aging Overdue Checks
        # -------------------------------------------------------------
        for uc in ucs:
            if uc.status in ["overdue", "pending"]:
                # Check days overdue
                if uc.days_overdue > 30:
                    severity = "Critical" if uc.days_overdue > 90 else "High"
                    score = min(95.0, 50.0 + uc.days_overdue * 0.4)
                    generated_alerts.append({
                        "entity_type": "mp",
                        "entity_id": uc.mp_id,
                        "alert_type": "UC Overdue Aging",
                        "rule_code": "R6",
                        "risk_score": score,
                        "severity": severity,
                        "description": f"MPLADS UC Overdue: Utilization certificate for {uc.financial_year} (₹{uc.amount_certified/100000:.2f}L) is {uc.days_overdue} days overdue.",
                        "explainable_details": "Statutory audit compliance requirement under CAG guidelines."
                    })

        # -------------------------------------------------------------
        # 4. STATISTICAL ISOLATION FOREST ANOMALIES
        # -------------------------------------------------------------
        iso_results = self.iso_detector.fit_and_predict(works_data)
        for res in iso_results:
            w_id = res["work_id"]
            work_risk_scores[w_id] += res["risk_score"] * 0.4
            work_violation_counts[w_id] += 1
            generated_alerts.append({
                "entity_type": "work",
                "entity_id": w_id,
                "alert_type": res["anomaly_type"],
                "rule_code": "ML-ISO",
                "risk_score": res["risk_score"],
                "severity": res["severity"],
                "description": res["explanation"],
                "explainable_details": "Isolation Forest multi-feature statistical anomaly detection."
            })

        # -------------------------------------------------------------
        # 5. NLP & GEOSPATIAL DUPLICATE / SPLIT WORK DETECTION
        # -------------------------------------------------------------
        dup_results = self.dup_detector.detect_duplicates(works_data)
        for dup in dup_results:
            w_id = dup["work_id"]
            work_risk_scores[w_id] += dup["risk_score"] * 0.5
            work_violation_counts[w_id] += 1
            generated_alerts.append({
                "entity_type": "work",
                "entity_id": w_id,
                "alert_type": "Duplicate / Split Work",
                "rule_code": "ML-DUP",
                "risk_score": dup["risk_score"],
                "severity": dup["severity"],
                "description": dup["explanation"],
                "explainable_details": f"TF-IDF similarity: {dup.get('similarity_score', 0)*100:.1f}%, Spatial proximity: {dup.get('distance_meters')}m."
            })

        # -------------------------------------------------------------
        # 6. AGENCY CONCENTRATION RISK (HHI)
        # -------------------------------------------------------------
        agency_alerts = self.agency_analyzer.analyze_mp_agency_concentration(
            mps_data, works_data, agencies_map
        )
        for ag_alert in agency_alerts:
            generated_alerts.append({
                "entity_type": "mp",
                "entity_id": ag_alert["mp_id"],
                "alert_type": "Agency Concentration Risk",
                "rule_code": "ML-HHI",
                "risk_score": ag_alert["risk_score"],
                "severity": ag_alert["severity"],
                "description": ag_alert["explanation"],
                "explainable_details": f"Herfindahl-Hirschman Index: {ag_alert.get('hhi_score'):.0f} / Dominant share: {ag_alert.get('dominant_share_pct'):.1f}%."
            })

        # -------------------------------------------------------------
        # 7. UPDATE DATABASE RECORDS & RISK SCORES
        # -------------------------------------------------------------
        # Update Work risk scores
        for w in works:
            raw_score = min(98.0, work_risk_scores.get(w.work_id, 0.0))
            w.risk_score = round(raw_score, 1)
            w.risk_band = get_risk_band(w.risk_score)

        # Update MP composite risk scores
        mp_work_map = defaultdict(list)
        for w in works:
            mp_work_map[w.mp_id].append(w)

        for mp in mps:
            mp_works_list = mp_work_map.get(mp.mp_id, [])
            if mp_works_list:
                avg_work_risk = sum(w.risk_score for w in mp_works_list) / len(mp_works_list)
                max_work_risk = max(w.risk_score for w in mp_works_list)
                # Composite MP risk incorporates work risks + pending UCs
                mp_alerts = [a for a in generated_alerts if a["entity_id"] == mp.mp_id or any(w.work_id == a["entity_id"] for w in mp_works_list)]
                alert_penalty = min(30.0, len(mp_alerts) * 4.0)
                
                mp_score = min(99.0, (avg_work_risk * 0.4) + (max_work_risk * 0.4) + alert_penalty)
                mp.composite_risk_score = round(mp_score, 1)
                mp.risk_band = get_risk_band(mp.composite_risk_score)

        # Update Implementing Agency stats
        ag_work_map = defaultdict(list)
        for w in works:
            if w.implementing_agency_id:
                ag_work_map[w.implementing_agency_id].append(w)

        for ag in agencies:
            ag_works_list = ag_work_map.get(ag.agency_id, [])
            ag.total_works_handled = len(ag_works_list)
            ag.total_sanctioned_amount = sum(w.sanctioned_amount or 0.0 for w in ag_works_list)
            flagged = [w for w in ag_works_list if w.risk_score >= 50.0]
            ag.flagged_works_count = len(flagged)
            if ag_works_list:
                ag_score = min(95.0, (len(flagged) / len(ag_works_list) * 80.0) + (15.0 if ag.type in ["Trust", "Society"] and ag.total_sanctioned_amount > 4000000 else 0.0))
                ag.risk_band = get_risk_band(ag_score)

        # Sync AnomalyAlert table:
        # Preserve user reviewer status if already triaged, else insert
        existing_alerts = {a.alert_id: a for a in db.query(AnomalyAlert).all()}
        
        # Clear out untriaged open alerts to avoid duplication
        db.query(AnomalyAlert).filter(AnomalyAlert.status == "Open").delete()
        db.flush()

        new_alert_objects = []
        for alert_dict in generated_alerts:
            alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
            alert_obj = AnomalyAlert(
                alert_id=alert_id,
                entity_type=alert_dict["entity_type"],
                entity_id=alert_dict["entity_id"],
                alert_type=alert_dict["alert_type"],
                risk_score=round(alert_dict["risk_score"], 1),
                severity=alert_dict["severity"],
                description=alert_dict["description"],
                rule_code=alert_dict.get("rule_code"),
                explainable_details=alert_dict.get("explainable_details"),
                detected_on=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                status="Open"
            )
            new_alert_objects.append(alert_obj)

        db.add_all(new_alert_objects)
        db.commit()

        return {
            "status": "success",
            "total_alerts_generated": len(new_alert_objects),
            "critical_count": sum(1 for a in new_alert_objects if a.severity == "Critical"),
            "high_count": sum(1 for a in new_alert_objects if a.severity == "High"),
            "medium_count": sum(1 for a in new_alert_objects if a.severity == "Medium"),
            "low_count": sum(1 for a in new_alert_objects if a.severity == "Low"),
            "analyzed_works_count": len(works),
            "analyzed_mps_count": len(mps),
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        }

pipeline_instance = MPLADSMLPipeline()
