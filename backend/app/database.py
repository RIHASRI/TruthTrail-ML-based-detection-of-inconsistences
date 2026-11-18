import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "truthtrail.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Uploads table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS uploads (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        file_type TEXT,
        row_count INTEGER,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Entities table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        unified_entity_id TEXT UNIQUE NOT NULL,
        primary_name TEXT,
        national_id TEXT,
        record_count INTEGER DEFAULT 0,
        inconsistency_score INTEGER DEFAULT 0,
        severity TEXT DEFAULT 'Clean',
        investigation_status TEXT DEFAULT 'PENDING',
        evidence_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Records table (Preserves original source records)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        unified_entity_id TEXT NOT NULL,
        source_name TEXT NOT NULL,
        full_name TEXT,
        national_id TEXT,
        dob TEXT,
        email TEXT,
        address TEXT,
        account_balance REAL,
        credit_score INTEGER,
        status TEXT,
        registration_date TEXT,
        verification_date TEXT,
        raw_data_json TEXT,
        FOREIGN KEY (unified_entity_id) REFERENCES entities (unified_entity_id)
    );
    """)

    # Audit / Investigation logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS investigation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unified_entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        notes TEXT,
        updated_by TEXT DEFAULT 'Auditor',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("SQLite Database initialized at:", DB_PATH)
