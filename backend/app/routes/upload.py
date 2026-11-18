import os
import uuid
import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.database import get_db_connection
from app.routes.sample_data import process_and_store_datasets

router = APIRouter(prefix="/api/upload", tags=["Upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/files")
async def upload_files(files: list[UploadFile] = File(...)):
    """
    Accepts multiple CSV or Excel files, saves them, parses previews, and runs entity resolution.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    dfs = []
    file_metas = []

    for file in files:
        file_ext = os.path.splitext(file.filename)[1].lower()
        content = await file.read()
        
        try:
            if file_ext == ".csv":
                df = pd.read_csv(io.BytesIO(content))
            elif file_ext in [".xlsx", ".xls"]:
                df = pd.read_excel(io.BytesIO(content))
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file format '{file_ext}'. Use CSV or Excel.")

            # Standardize column headers
            df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

            # Add source name if not present
            if "source" not in df.columns:
                df["source"] = file.filename

            dfs.append(df)

            upload_id = str(uuid.uuid4())
            file_metas.append({
                "id": upload_id,
                "filename": file.filename,
                "row_count": len(df),
                "columns": list(df.columns)
            })

            # Save upload metadata to DB
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO uploads (id, filename, file_type, row_count) VALUES (?, ?, ?, ?)",
                (upload_id, file.filename, file_ext, len(df))
            )
            conn.commit()
            conn.close()

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading file {file.filename}: {str(e)}")

    if len(dfs) >= 2:
        # Run resolution across uploaded files
        count = process_and_store_datasets(dfs[0], dfs[1])
    elif len(dfs) == 1:
        # Split single file in half to demonstrate cross-record auditing or compare within itself
        df_split1 = dfs[0].iloc[:len(dfs[0])//2].copy()
        df_split2 = dfs[0].iloc[len(dfs[0])//2:].copy()
        count = process_and_store_datasets(df_split1, df_split2)
    else:
        count = 0

    return {
        "status": "success",
        "message": f"Processed {len(files)} files successfully.",
        "files": file_metas,
        "processed_entities": count
    }
