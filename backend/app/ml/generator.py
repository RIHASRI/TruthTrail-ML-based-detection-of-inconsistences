import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_synthetic_records(num_entities=50, inconsistency_rate=0.35, seed=42):
    """
    Generates synthetic multi-source records (e.g. Master HR/KYC Data, Financial Records, Operations Log)
    with intentional inconsistencies (conflicts, date inversions, missing fields, duplicates, numerical anomalies).
    Includes ground truth labels for evaluation.
    """
    random.seed(seed)
    np.random.seed(seed)

    first_names = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth",
                   "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
                   "Siddharth", "Aarav", "Priya", "Ananya", "Rahul", "Devi", "Carlos", "Elena", "Mateo", "Sofia"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Sharma", "Verma", "Patel", "Gupta", "Singh"]
    cities = ["New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", 
              "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA", "Seattle, WA"]
    statuses = ["ACTIVE", "PENDING", "VERIFIED", "FLAGGED", "COMPLETED"]

    source_a_records = []
    source_b_records = []
    ground_truth = []

    base_date = datetime(2023, 1, 1)

    for i in range(1, num_entities + 1):
        entity_id = f"ENT-{i:04d}"
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        full_name = f"{fname} {lname}"
        ssn_id = f"{random.randint(100,999)}-{random.randint(10,99)}-{random.randint(1000,9999)}"
        dob = (base_date - timedelta(days=random.randint(7000, 20000))).strftime("%Y-%m-%d")
        email = f"{fname.lower()}.{lname.lower()}{random.randint(10,99)}@example.com"
        address = f"{random.randint(100, 9999)} Main St, {random.randint(10,99)}th Ave, {random.choice(cities)}"
        account_balance = round(random.uniform(1000.0, 50000.0), 2)
        credit_score = random.randint(600, 850)
        status = random.choice(statuses)

        start_dt = base_date + timedelta(days=random.randint(1, 100))
        end_dt = start_dt + timedelta(days=random.randint(5, 30))
        start_date = start_dt.strftime("%Y-%m-%d")
        end_date = end_dt.strftime("%Y-%m-%d")

        # Source A record (Primary System)
        rec_a = {
            "record_id": f"REC-A-{i:04d}",
            "entity_id": entity_id,
            "source": "Master_KYC_System",
            "full_name": full_name,
            "national_id": ssn_id,
            "dob": dob,
            "email": email,
            "address": address,
            "account_balance": account_balance,
            "credit_score": credit_score,
            "status": status,
            "registration_date": start_date,
            "verification_date": end_date
        }

        # Source B record (Secondary Operations System) - standard default match
        rec_b = rec_a.copy()
        rec_b["record_id"] = f"REC-B-{i:04d}"
        rec_b["source"] = "Operations_Log"

        # Apply subtle name/email variations in Source B (natural entity resolution challenge)
        if random.random() < 0.4:
            # Slight name typo or nickname
            rec_b["full_name"] = full_name.replace("a", "e") if "a" in full_name else full_name + " Jr."

        has_inconsistency = False
        inconsistency_types = []

        # Inject anomalies based on inconsistency_rate
        if random.random() < inconsistency_rate:
            has_inconsistency = True
            choice = random.choice(["attribute_conflict", "date_inversion", "missing_field", "numerical_anomaly", "duplicate_conflict"])

            if choice == "attribute_conflict":
                # Conflicting Address or Credit Score
                rec_b["address"] = f"{random.randint(1000, 9999)} Broadway Ave, Suite 400, Chicago, IL"
                rec_b["credit_score"] = credit_score - random.randint(150, 300)
                inconsistency_types.append("attribute_conflict")

            elif choice == "date_inversion":
                # Verification date BEFORE registration date (logical violation)
                inv_start = end_dt + timedelta(days=15)
                inv_end = start_dt - timedelta(days=10)
                rec_b["registration_date"] = inv_start.strftime("%Y-%m-%d")
                rec_b["verification_date"] = inv_end.strftime("%Y-%m-%d")
                inconsistency_types.append("date_inversion")

            elif choice == "missing_field":
                # Critical field missing in Source B
                rec_b["national_id"] = None
                rec_b["email"] = ""
                inconsistency_types.append("missing_field")

            elif choice == "numerical_anomaly":
                # Massive account balance jump or invalid negative score
                rec_b["account_balance"] = round(account_balance * random.uniform(25.0, 100.0), 2)
                inconsistency_types.append("numerical_anomaly")

            elif choice == "duplicate_conflict":
                # Status mismatch combined with duplicate record entry
                rec_b["status"] = "TERMINATED" if status == "ACTIVE" else "ACTIVE"
                inconsistency_types.append("duplicate_conflict")

        source_a_records.append(rec_a)
        source_b_records.append(rec_b)

        ground_truth.append({
            "entity_id": entity_id,
            "has_inconsistency": has_inconsistency,
            "inconsistency_types": ",".join(inconsistency_types) if inconsistency_types else "NONE"
        })

    df_a = pd.DataFrame(source_a_records)
    df_b = pd.DataFrame(source_b_records)
    df_gt = pd.DataFrame(ground_truth)

    return df_a, df_b, df_gt
