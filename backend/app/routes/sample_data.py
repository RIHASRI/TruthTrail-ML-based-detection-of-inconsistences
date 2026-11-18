import json
import uuid
import pandas as pd
from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.ml.generator import generate_synthetic_records
from app.ml.entity_matching import EntityMatcher
from app.ml.anomaly_detection import InconsistencyDetector
from app.ml.scoring import InconsistencyScorer

router = APIRouter(prefix="/api/sample", tags=["Sample Data"])

def process_and_store_datasets(df_a, df_b):
    """
    Core pipeline to run entity resolution, anomaly detection, scoring, and store in SQLite DB.
    """
    matcher = EntityMatcher(similarity_threshold=0.65)
    grouped_records = matcher.group_entities([df_a, df_b], id_col="entity_id")

    # Group records by unified_entity_id
    entity_groups = {}
    for rec in grouped_records:
        uid = rec["unified_entity_id"]
        if uid not in entity_groups:
            entity_groups[uid] = []
        entity_groups[uid].append(rec)

    detector = InconsistencyDetector(contamination=0.15)
    entity_ids, feature_matrix = detector.extract_features_for_ml(entity_groups)
    ml_probs, predictions = detector.fit_ml_anomaly_detector(feature_matrix)
    ml_prob_map = dict(zip(entity_ids, ml_probs))

    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing entities and records for fresh sample load
    cursor.execute("DELETE FROM records")
    cursor.execute("DELETE FROM entities")
    cursor.execute("DELETE FROM investigation_logs")

    processed_count = 0
    for uid, records in entity_groups.items():
        evidence_list, rule_flags = detector.check_rule_inconsistencies(records)
        ml_prob = ml_prob_map.get(uid, 0.0)

        # Flag ML specific anomaly if probability is high and no rules triggered
        if ml_prob >= 0.70 and not evidence_list:
            evidence_list.append({
                "type": "ML Statistical Anomaly",
                "severity": "High",
                "description": f"Isolation Forest ML model flagged abnormal multivariate statistical pattern (Anomaly Prob: {round(ml_prob, 2)})"
            })

        score, severity = InconsistencyScorer.calculate_score(evidence_list, ml_prob, rule_flags)

        primary_name = records[0].get("full_name") or records[0].get("name") or f"Entity {uid}"
        national_id = records[0].get("national_id") or records[0].get("ssn")

        cursor.execute("""
            INSERT INTO entities (id, unified_entity_id, primary_name, national_id, record_count, inconsistency_score, severity, investigation_status, evidence_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()),
            uid,
            primary_name,
            national_id,
            len(records),
            score,
            severity,
            "PENDING",
            json.dumps(evidence_list)
        ))

        for rec in records:
            rec_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO records (id, unified_entity_id, source_name, full_name, national_id, dob, email, address, account_balance, credit_score, status, registration_date, verification_date, raw_data_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                rec_id,
                uid,
                str(rec.get("source", "Source_File")),
                rec.get("full_name"),
                rec.get("national_id"),
                rec.get("dob"),
                rec.get("email"),
                rec.get("address"),
                rec.get("account_balance"),
                rec.get("credit_score"),
                rec.get("status"),
                rec.get("registration_date"),
                rec.get("verification_date"),
                json.dumps(rec, default=str)
            ))
        processed_count += 1

    conn.commit()
    conn.close()
    return processed_count

@router.post("/load")
def load_sample_dataset(num_entities: int = 50, inconsistency_rate: float = 0.35):
    """
    Generates and processes synthetic sample datasets into SQLite database.
    """
    try:
        df_a, df_b, df_gt = generate_synthetic_records(num_entities=num_entities, inconsistency_rate=inconsistency_rate, seed=42)
        count = process_and_store_datasets(df_a, df_b)
        return {
            "status": "success",
            "message": f"Successfully loaded sample datasets with {count} unified entities.",
            "entity_count": count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
