class InconsistencyScorer:
    """
    Computes unified 0 - 100 Inconsistency Score and evidence summary for an entity.
    """
    @staticmethod
    def calculate_score(evidence_list, ml_anomaly_prob, rule_flags):
        """
        Score components:
        - Critical rule evidence (Date inversion, Status mismatch): +35 per item
        - High severity evidence (Attribute conflict, missing NID): +20 per item
        - Medium severity evidence (Missing email): +10 per item
        - ML Isolation Forest Anomaly probability (0 to 1): +25 * ml_anomaly_prob
        """
        raw_score = 0.0

        for item in evidence_list:
            sev = item.get("severity", "Low")
            if sev == "Critical":
                raw_score += 35.0
            elif sev == "High":
                raw_score += 22.0
            elif sev == "Medium":
                raw_score += 12.0
            else:
                raw_score += 5.0

        # ML Anomaly contribution
        raw_score += float(ml_anomaly_prob * 25.0)

        # Cap between 0 and 100
        final_score = int(round(min(100.0, max(0.0, raw_score))))

        # Determine overall severity label
        if final_score >= 75:
            severity = "Critical"
        elif final_score >= 50:
            severity = "High"
        elif final_score >= 25:
            severity = "Medium"
        elif final_score > 0:
            severity = "Low"
        else:
            severity = "Clean"

        return final_score, severity
