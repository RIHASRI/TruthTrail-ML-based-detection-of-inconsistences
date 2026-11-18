from fastapi import APIRouter, HTTPException, Query
from app.ml.generator import generate_synthetic_records
from app.ml.entity_matching import EntityMatcher
from app.ml.anomaly_detection import InconsistencyDetector
from app.ml.scoring import InconsistencyScorer
from app.ml.evaluation import evaluate_detection_pipeline

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation"])

@router.get("/run")
def run_evaluation_benchmark(
    num_entities: int = Query(60, ge=20, le=200),
    inconsistency_rate: float = Query(0.35, ge=0.1, le=0.8),
    threshold: int = Query(25, ge=10, le=80)
):
    """
    Runs synthetic ground truth benchmark evaluation pipeline.
    Returns Precision, Recall, F1-Score, Confusion Matrix, and ROC/PR curve points.
    """
    try:
        df_a, df_b, df_gt = generate_synthetic_records(
            num_entities=num_entities,
            inconsistency_rate=inconsistency_rate,
            seed=42
        )

        matcher = EntityMatcher(similarity_threshold=0.65)
        grouped_records = matcher.group_entities([df_a, df_b], id_col="entity_id")

        entity_groups = {}
        for rec in grouped_records:
            uid = rec["unified_entity_id"]
            if uid not in entity_groups:
                entity_groups[uid] = []
            entity_groups[uid].append(rec)

        detector = InconsistencyDetector(contamination=inconsistency_rate)
        entity_ids, feature_matrix = detector.extract_features_for_ml(entity_groups)
        ml_probs, predictions = detector.fit_ml_anomaly_detector(feature_matrix)
        ml_prob_map = dict(zip(entity_ids, ml_probs))

        pred_scores = []
        y_true = []

        gt_map = dict(zip(df_gt["entity_id"], df_gt["has_inconsistency"]))

        for uid, records in entity_groups.items():
            evidence_list, rule_flags = detector.check_rule_inconsistencies(records)
            ml_prob = ml_prob_map.get(uid, 0.0)

            score, severity = InconsistencyScorer.calculate_score(evidence_list, ml_prob, rule_flags)
            pred_scores.append(score)

            orig_ent_id = records[0].get("entity_id")
            has_gt = gt_map.get(orig_ent_id, False)
            y_true.append(1 if has_gt else 0)

        eval_result = evaluate_detection_pipeline(y_true, pred_scores, threshold=threshold)
        eval_result["benchmark_info"] = {
            "num_entities": num_entities,
            "inconsistency_rate": inconsistency_rate,
            "total_records_processed": len(df_a) + len(df_b)
        }

        return eval_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
