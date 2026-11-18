import io
import json
import pandas as pd
from fastapi import APIRouter, HTTPException, Response, Query
from fastapi.responses import StreamingResponse
from app.database import get_db_connection
from app.utils.export_pdf import generate_pdf_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/export/csv")
def export_csv_report(severity: str = Query(None)):
    """
    Exports all analyzed entities and flagged evidence as a downloadable CSV file.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM entities"
    params = []
    if severity and severity != "ALL":
        query += " WHERE severity = ?"
        params.append(severity)

    query += " ORDER BY inconsistency_score DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    export_list = []
    for r in rows:
        r_dict = dict(r)
        ev_list = json.loads(r_dict.get("evidence_json", "[]"))
        ev_descriptions = " | ".join([f"[{ev['severity']}] {ev['type']}: {ev['description']}" for ev in ev_list])
        
        export_list.append({
            "Unified Entity ID": r_dict.get("unified_entity_id"),
            "Primary Name": r_dict.get("primary_name"),
            "National ID": r_dict.get("national_id"),
            "Record Count": r_dict.get("record_count"),
            "Inconsistency Score": r_dict.get("inconsistency_score"),
            "Severity": r_dict.get("severity"),
            "Investigation Status": r_dict.get("investigation_status"),
            "Evidence Log": ev_descriptions,
            "Created At": r_dict.get("created_at")
        })

    df = pd.DataFrame(export_list)
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=truthtrail_inconsistency_report.csv"}
    )

@router.get("/export/pdf/{unified_entity_id}")
def export_pdf_report(unified_entity_id: str):
    """
    Generates and downloads a comprehensive PDF audit report for a specific entity.
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
    conn.close()

    try:
        pdf_bytes = generate_pdf_report(entity_dict, evidence, records)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=TruthTrail_Audit_{unified_entity_id}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
