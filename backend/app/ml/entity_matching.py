import re
import numpy as np
import pandas as pd
from rapidfuzz import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def normalize_text(val):
    if val is None or pd.isna(val):
        return ""
    val = str(val).lower().strip()
    val = re.sub(r'[^\w\s]', '', val)
    return val

class EntityMatcher:
    """
    Hybrid entity resolution engine using RapidFuzz token matching + TF-IDF cosine similarity.
    Links disparate records belonging to the same underlying real-world entity.
    """
    def __init__(self, similarity_threshold=0.65):
        self.threshold = similarity_threshold

    def calculate_record_similarity(self, rec1, rec2):
        """
        Calculates composite similarity score (0.0 to 1.0) between two record dictionaries.
        """
        # Exact match check on National ID if present in both
        id1 = normalize_text(rec1.get("national_id") or rec1.get("ssn") or rec1.get("id"))
        id2 = normalize_text(rec2.get("national_id") or rec2.get("ssn") or rec2.get("id"))
        
        if id1 and id2 and id1 == id2:
            return 0.98  # Almost definite match

        # Name similarity (RapidFuzz token sort)
        name1 = normalize_text(rec1.get("full_name") or rec1.get("name"))
        name2 = normalize_text(rec2.get("full_name") or rec2.get("name"))
        
        if not name1 or not name2:
            name_score = 0.0
        else:
            name_score = fuzz.token_sort_ratio(name1, name2) / 100.0

        # Email similarity
        email1 = normalize_text(rec1.get("email"))
        email2 = normalize_text(rec2.get("email"))
        email_score = 1.0 if (email1 and email2 and email1 == email2) else (0.5 if email1 or email2 else 0.0)

        # Address similarity (TF-IDF Cosine or Fuzzy Partial)
        addr1 = normalize_text(rec1.get("address"))
        addr2 = normalize_text(rec2.get("address"))
        addr_score = fuzz.token_set_ratio(addr1, addr2) / 100.0 if (addr1 and addr2) else 0.0

        # DOB exact match
        dob1 = str(rec1.get("dob") or "")
        dob2 = str(rec2.get("dob") or "")
        dob_score = 1.0 if (dob1 and dob2 and dob1 == dob2) else 0.0

        # Weighted composite score
        weights = {
            "name": 0.40,
            "email": 0.25,
            "address": 0.20,
            "dob": 0.15
        }
        
        composite = (name_score * weights["name"] + 
                     email_score * weights["email"] + 
                     addr_score * weights["address"] + 
                     dob_score * weights["dob"])

        return round(float(composite), 4)

    def group_entities(self, df_list, id_col="entity_id"):
        """
        Takes multiple DataFrames (sources), matches records, and assigns a unified cluster_entity_id.
        """
        all_records = []
        for src_idx, df in enumerate(df_list):
            for row_idx, row in df.iterrows():
                rec_dict = row.to_dict()
                rec_dict["_source_index"] = src_idx
                rec_dict["_row_index"] = row_idx
                all_records.append(rec_dict)

        n = len(all_records)
        parent = list(range(n))

        def find(i):
            if parent[i] == i:
                return i
            parent[i] = find(parent[i])
            return parent[i]

        def union(i, j):
            root_i = find(i)
            root_j = find(j)
            if root_i != root_j:
                parent[root_i] = root_j

        # Compare records across sources or within same dataset if entity_id missing
        for i in range(n):
            for j in range(i + 1, n):
                # If explicit entity_id match exists:
                ent1 = all_records[i].get(id_col)
                ent2 = all_records[j].get(id_col)
                
                if ent1 and ent2 and ent1 == ent2:
                    union(i, j)
                else:
                    sim = self.calculate_record_similarity(all_records[i], all_records[j])
                    if sim >= self.threshold:
                        union(i, j)

        # Cluster mapping
        clusters = {}
        for i in range(n):
            root = find(i)
            if root not in clusters:
                clusters[root] = f"ENTITY-CLUSTER-{len(clusters) + 1:04d}"
            all_records[i]["unified_entity_id"] = clusters[root]

        return all_records
