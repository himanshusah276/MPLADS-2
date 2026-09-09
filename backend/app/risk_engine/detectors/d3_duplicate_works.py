import math
import re
from typing import Dict, Any, List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in kilometers between two points on the earth."""
    R = 6371.0 # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def compute_d3_duplicate_works(
    current_project: Dict[str, Any],
    candidate_projects: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    D3: Duplicate / Near-Duplicate Works
    TF-IDF cosine similarity on work description + Haversine distance on geotags.
    Flags pairs with similarity >= 0.70 AND distance <= 3.5 km.
    """
    if not candidate_projects:
        return {
            "detector_code": "D3",
            "detector_name": "Duplicate Works Detection",
            "subscore": 5.0,
            "abstained": False,
            "confidence": "Medium",
            "evidence": {"duplicate_candidates": []},
            "reason_text": None,
            "duplicate_candidates": []
        }

    current_id = current_project.get("id")
    current_text = f"{current_project.get('title', '')} {current_project.get('description', '')}".strip()
    current_loc = current_project.get("location") or {}
    cur_lat = current_loc.get("latitude")
    cur_lng = current_loc.get("longitude")

    corpus = [current_text]
    valid_candidates = []
    
    for cand in candidate_projects:
        if cand.get("id") == current_id:
            continue
        c_text = f"{cand.get('title', '')} {cand.get('description', '')}".strip()
        corpus.append(c_text)
        valid_candidates.append(cand)

    if not valid_candidates or not current_text:
        return {
            "detector_code": "D3",
            "detector_name": "Duplicate Works Detection",
            "subscore": 5.0,
            "abstained": False,
            "confidence": "Medium",
            "evidence": {"duplicate_candidates": []},
            "reason_text": None,
            "duplicate_candidates": []
        }

    try:
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", min_df=1)
        tfidf_matrix = vectorizer.fit_transform(corpus)
        cosine_sims = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    except Exception:
        # Fallback to token overlap Jaccard similarity if vectorizer fails
        words1 = set(re.findall(r'\w+', current_text.lower()))
        cosine_sims = []
        for cand in valid_candidates:
            c_text = f"{cand.get('title', '')} {cand.get('description', '')}".strip()
            words2 = set(re.findall(r'\w+', c_text.lower()))
            jaccard = len(words1 & words2) / max(len(words1 | words2), 1)
            cosine_sims.append(jaccard)

    top_duplicates = []
    max_risk_subscore = 10.0
    highest_match = None

    for idx, cand in enumerate(valid_candidates):
        sim_score = float(cosine_sims[idx])
        c_loc = cand.get("location") or {}
        c_lat = c_loc.get("latitude")
        c_lng = c_loc.get("longitude")
        
        dist_km = 999.0
        if cur_lat is not None and cur_lng is not None and c_lat is not None and c_lng is not None:
            dist_km = haversine_distance_km(cur_lat, cur_lng, c_lat, c_lng)
        
        # Check duplicate threshold
        if (sim_score >= 0.60 and dist_km <= 4.0) or sim_score >= 0.85:
            dup_item = {
                "project_id": cand.get("id"),
                "project_code": cand.get("project_code", "PRJ-UNKNOWN"),
                "title": cand.get("title"),
                "distance_km": round(dist_km, 2),
                "similarity_score": round(sim_score, 2),
                "sanctioned_cost": cand.get("sanctioned_cost", 0),
                "sanction_date": str(cand.get("sanction_date", "")),
                "status": cand.get("status", "Active")
            }
            top_duplicates.append(dup_item)

            # Subscore: High textual match + proximity
            prox_weight = max(0.0, 4.0 - dist_km) / 4.0 if dist_km < 4.0 else 0.2
            sub = (sim_score * 65.0) + (prox_weight * 30.0)
            if sub > max_risk_subscore:
                max_risk_subscore = sub
                highest_match = dup_item

    top_duplicates = sorted(top_duplicates, key=lambda x: x["similarity_score"], reverse=True)[:5]

    reason_text = None
    if highest_match and highest_match["similarity_score"] >= 0.65 and highest_match["distance_km"] <= 3.0:
        sim_pct = int(highest_match["similarity_score"] * 100)
        dist = highest_match["distance_km"]
        code = highest_match["project_code"]
        reason_text = (
            f"Duplicate: A work with {sim_pct}% description similarity exists {dist:.1f} km away, "
            f"sanctioned under ID {code} (D3)"
        )

    return {
        "detector_code": "D3",
        "detector_name": "Duplicate Works Detection",
        "subscore": round(min(100.0, max_risk_subscore), 1),
        "abstained": False,
        "confidence": "High" if cur_lat is not None else "Medium",
        "evidence": {
            "duplicate_candidates": top_duplicates,
            "count": len(top_duplicates)
        },
        "reason_text": reason_text,
        "duplicate_candidates": top_duplicates
    }
