import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import IsolationForest

class InconsistencyDetector:
    """
    Hybrid detection engine combining rule-based deterministic checks with 
    Scikit-learn Isolation Forest unsupervised ML anomaly detection.
    """
    def __init__(self, contamination=0.15):
        self.contamination = contamination
        self.iso_forest = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=42
        )

    def parse_date(self, date_str):
        if not date_str or pd.isna(date_str):
            return None
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(str(date_str).strip(), fmt)
            except ValueError:
                pass
        return None

    def check_rule_inconsistencies(self, records):
        """
        Evaluates deterministic rules for a group of records belonging to the same entity.
        Returns detailed evidence list and severity counts.
        """
        evidence = []
        rule_flags = {
            "attribute_conflict": False,
            "date_inversion": False,
            "missing_field": False,
            "duplicate_record": False
        }

        if len(records) < 1:
            return evidence, rule_flags

        # 1. Attribute Conflicts & Missing Fields
        addresses = set()
        credit_scores = []
        statuses = set()
        emails = []

        for rec in records:
            # Address check
            addr = str(rec.get("address") or "").strip()
            if addr:
                addresses.add(addr.lower())
            
            # Credit score check
            cs = rec.get("credit_score")
            if cs is not None and not pd.isna(cs):
                try:
                    credit_scores.append(float(cs))
                except (ValueError, TypeError):
                    pass

            # Status check
            st = str(rec.get("status") or "").strip()
            if st:
                statuses.add(st.upper())

            # Email check for missingness
            em = str(rec.get("email") or "").strip()
            if em:
                emails.append(em)
            else:
                rule_flags["missing_field"] = True
                evidence.append({
                    "type": "Missing Field",
                    "severity": "Medium",
                    "description": f"Missing critical email field in source record '{rec.get('source', 'Unknown')}'."
                })

            # National ID missingness
            nid = rec.get("national_id") or rec.get("ssn")
            if not nid or pd.isna(nid) or str(nid).strip() == "":
                rule_flags["missing_field"] = True
                evidence.append({
                    "type": "Missing Field",
                    "severity": "High",
                    "description": f"Missing National Identifier in source record '{rec.get('source', 'Unknown')}'."
                })

        # Conflicting Addresses across records
        if len(addresses) > 1:
            rule_flags["attribute_conflict"] = True
            evidence.append({
                "type": "Attribute Conflict",
                "severity": "High",
                "description": f"Conflicting address recorded across sources: {', '.join(addresses)}"
            })

        # Conflicting Credit Scores
        if len(credit_scores) > 1:
            diff = max(credit_scores) - min(credit_scores)
            if diff > 50:
                rule_flags["attribute_conflict"] = True
                evidence.append({
                    "type": "Attribute Conflict",
                    "severity": "High",
                    "description": f"Significant credit score discrepancy across records: Max ({max(credit_scores)}) vs Min ({min(credit_scores)})"
                })

        # Conflicting Statuses
        if len(statuses) > 1:
            rule_flags["attribute_conflict"] = True
            evidence.append({
                "type": "Attribute Conflict",
                "severity": "Critical",
                "description": f"Incompatible entity status values across sources: {', '.join(statuses)}"
            })

        # 2. Date Inconsistencies (Chronological inversion)
        for rec in records:
            reg_date = self.parse_date(rec.get("registration_date") or rec.get("start_date"))
            ver_date = self.parse_date(rec.get("verification_date") or rec.get("end_date"))

            if reg_date and ver_date and ver_date < reg_date:
                rule_flags["date_inversion"] = True
                evidence.append({
                    "type": "Date Inconsistency",
                    "severity": "Critical",
                    "description": f"Verification date ({ver_date.strftime('%Y-%m-%d')}) precedes Registration date ({reg_date.strftime('%Y-%m-%d')}) in source '{rec.get('source', 'Unknown')}'."
                })

        return evidence, rule_flags

    def extract_features_for_ml(self, entity_groups):
        """
        Extracts numerical feature vector for each entity group for Isolation Forest.
        """
        feature_matrix = []
        entity_ids = []

        for entity_id, records in entity_groups.items():
            entity_ids.append(entity_id)

            # Feature 1: Num records for entity
            rec_count = len(records)

            # Feature 2: Account balance max ratio to min
            balances = []
            for r in records:
                b = r.get("account_balance") or r.get("amount") or 0.0
                try:
                    balances.append(float(b))
                except (ValueError, TypeError):
                    pass
            
            bal_ratio = 1.0
            if len(balances) > 1 and min(balances) > 0:
                bal_ratio = max(balances) / min(balances)
            elif len(balances) > 1 and max(balances) > 50000:
                bal_ratio = 10.0

            # Feature 3: Credit score variance
            c_scores = [float(r["credit_score"]) for r in records if r.get("credit_score") is not None and not pd.isna(r.get("credit_score"))]
            cs_std = float(np.std(c_scores)) if len(c_scores) > 1 else 0.0

            # Feature 4: Missing values count
            missing_cnt = sum(1 for r in records for v in r.values() if v is None or pd.isna(v) or str(v).strip() == "")

            feature_matrix.append([rec_count, bal_ratio, cs_std, missing_cnt])

        return entity_ids, np.array(feature_matrix, dtype=float)

    def fit_ml_anomaly_detector(self, feature_matrix):
        """
        Fits Isolation Forest on entity feature matrix.
        """
        if len(feature_matrix) < 2:
            return np.zeros(len(feature_matrix)), np.ones(len(feature_matrix))

        # Standardize features safely
        norm_matrix = (feature_matrix - np.mean(feature_matrix, axis=0)) / (np.std(feature_matrix, axis=0) + 1e-6)
        
        self.iso_forest.fit(norm_matrix)
        raw_scores = self.iso_forest.decision_function(norm_matrix) # Lower score = more anomalous
        predictions = self.iso_forest.predict(norm_matrix)           # -1 = anomaly, 1 = normal

        # Convert decision scores into [0, 1] anomaly probability (1 = extreme anomaly, 0 = completely normal)
        min_s, max_s = np.min(raw_scores), np.max(raw_scores)
        if max_s != min_s:
            ml_anomaly_prob = (max_s - raw_scores) / (max_s - min_s)
        else:
            ml_anomaly_prob = np.zeros(len(raw_scores))

        return ml_anomaly_prob, predictions
