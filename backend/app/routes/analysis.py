import json
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.database import get_db_connection

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

@router.get("/summary")
def get_analysis_summary():
    """
    Returns aggregate stats, inconsistency distributions, and error type breakdown for the Dashboard.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM entities")
    total_entities = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM entities WHERE inconsistency_score > 0")
    flagged_entities = cursor.fetchone()[0]

    clean_entities = total_entities - flagged_entities

    cursor.execute("SELECT COUNT(*) FROM entities WHERE severity = 'Critical'")
    critical_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM entities WHERE severity = 'High'")
    high_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM entities WHERE severity = 'Medium'")
    medium_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM entities WHERE severity = 'Low'")
    low_count = cursor.fetchone()[0]

    cursor.execute("SELECT AVG(inconsistency_score) FROM entities")
    avg_score_row = cursor.fetchone()[0]
    avg_score = round(float(avg_score_row), 1) if avg_score_row else 0.0

    # Error type breakdown by parsing evidence_json
    cursor.execute("SELECT evidence_json FROM entities WHERE evidence_json IS NOT NULL")
    rows = cursor.fetchall()

    error_breakdown = {
        "Attribute Conflict": 0,
        "Date Inconsistency": 0,
        "Missing Field": 0,
        "ML Statistical Anomaly": 0,
        "Duplicate Conflict": 0
    }

    for row in rows:
        try:
            ev_list = json.loads(row[0]) if row[0] else []
            for item in ev_list:
                t = item.get("type", "Other")
                if t in error_breakdown:
                    error_breakdown[t] += 1
                else:
                    error_breakdown[t] = 1
        except Exception:
            pass

    conn.close()

    return {
        "total_entities": total_entities,
        "flagged_entities": flagged_entities,
        "clean_entities": clean_entities,
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "average_score": avg_score,
        "error_breakdown": error_breakdown
    }

@router.get("/entities")
def get_entities(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Returns list of analyzed entities with optional filtering, search, and pagination.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM entities WHERE 1=1"
    params = []

    if severity and severity != "ALL":
        query += " AND severity = ?"
        params.append(severity)

    if status and status != "ALL":
        query += " AND investigation_status = ?"
        params.append(status)

    if search:
        query += " AND (primary_name LIKE ? OR unified_entity_id LIKE ? OR national_id LIKE ?)"
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern, search_pattern])

    # Count total matching query
    count_query = f"SELECT COUNT(*) FROM ({query})"
    cursor.execute(count_query, params)
    total_records = cursor.fetchone()[0]

    # Order by inconsistency_score DESC (highest risk first)
    query += " ORDER BY inconsistency_score DESC, created_at DESC LIMIT ? OFFSET ?"
    offset = (page - 1) * limit
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    entities = []
    for row in rows:
        r_dict = dict(row)
        r_dict["evidence"] = json.loads(r_dict["evidence_json"]) if r_dict.get("evidence_json") else []
        entities.append(r_dict)

    conn.close()

    return {
        "entities": entities,
        "page": page,
        "limit": limit,
        "total": total_records,
        "total_pages": (total_records + limit - 1) // limit if total_records > 0 else 1
    }
