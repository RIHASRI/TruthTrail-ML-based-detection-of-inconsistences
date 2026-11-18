from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, get_db_connection
from app.routes import sample_data, upload, analysis, entities, evaluation, reports
from app.ml.generator import generate_synthetic_records
from app.routes.sample_data import process_and_store_datasets

app = FastAPI(
    title="TruthTrail API",
    description="ML-Based Detection of Inconsistencies Across Real-World Records",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(sample_data.router)
app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(entities.router)
app.include_router(evaluation.router)
app.include_router(reports.router)

@app.on_event("startup")
def startup_event():
    """
    Initializes SQLite DB schema and loads initial sample dataset if DB is empty.
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM entities")
    count = cursor.fetchone()[0]
    conn.close()

    if count == 0:
        print("[Startup] Initializing default synthetic sample dataset for TruthTrail...")
        df_a, df_b, _ = generate_synthetic_records(num_entities=40, inconsistency_rate=0.35, seed=42)
        process_and_store_datasets(df_a, df_b)
        print("[Startup] Sample dataset initialized successfully.")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "TruthTrail API", "version": "1.0.0"}
