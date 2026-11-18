import json
from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.schemas import InvestigationUpdate

router = APIRouter(prefix="/api/entities", tags=["Entities"])

@router.get("/{unified_entity_id}")
def get_entity_detail(unified_entity_id: str):
    """
    Returns single entity overview, detailed evidence list, and side-by-side source records.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM entities WHERE unified_entity_id = ?", (unified_entity_id,))
    ent_row = cursor.fetchone()

    if not ent_row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Entity '{unified_entity_id}' not found.")

    entity_dict = dict(ent_row)
    evidence = json.loads(entity_dict["evidence_json"]) if entity_dict.get("evidence_json") else []

    cursor.execute("SELECT * FROM records WHERE unified_entity_id = ?", (unified_entity_id,))
    rec_rows = cursor.fetchall()
    records = [dict(r) for r in rec_rows]

    # Fetch investigation audit logs
    cursor.execute("SELECT * FROM investigation_logs WHERE unified_entity_id = ? ORDER BY timestamp DESC", (unified_entity_id,))
    log_rows = cursor.fetchall()
    logs = [dict(l) for l in log_rows]

    conn.close()

    return {
        "entity": entity_dict,
        "evidence": evidence,
        "records": records,
        "logs": logs
    }

@router.post("/{unified_entity_id}/investigate")
def update_investigation_status(unified_entity_id: str, payload: InvestigationUpdate):
    """
    Updates the investigation status (UNDER_REVIEW, RESOLVED, FALSE_POSITIVE, PENDING) and logs auditor notes.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM entities WHERE unified_entity_id = ?", (unified_entity_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Entity '{unified_entity_id}' not found.")

    cursor.execute(
        "UPDATE entities SET investigation_status = ? WHERE unified_entity_id = ?",
        (payload.status, unified_entity_id)
    )

    cursor.execute(
        "INSERT INTO investigation_logs (unified_entity_id, action, notes) VALUES (?, ?, ?)",
        (unified_entity_id, f"STATUS_CHANGED_TO_{payload.status}", payload.notes or "Updated by auditor")
    )

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "unified_entity_id": unified_entity_id,
        "new_status": payload.status,
        "notes": payload.notes
    }
