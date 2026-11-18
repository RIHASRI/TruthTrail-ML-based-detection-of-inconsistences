# TruthTrail — ML-Based Detection of Inconsistencies Across Real-World Records

**TruthTrail** is an enterprise-grade machine learning platform designed to audit, match, and evaluate data integrity across disparate, multi-source records belonging to the same underlying entity. It automatically identifies attribute conflicts, date sequence inversions, missing critical fields, duplicate entries, and multivariate statistical anomalies.

---

## 🏛 System Architecture

```
                                  +---------------------------------------+
                                  |         TruthTrail Frontend           |
                                  |     (React 18, Vite, Tailwind CSS,    |
                                  |        Recharts, Lucide Icons)        |
                                  +-------------------+-------------------+
                                                      |
                                             REST API | HTTP / JSON
                                                      v
                                  +-------------------+-------------------+
                                  |         FastAPI Backend Engine        |
                                  +-------------------+-------------------+
                                                      |
            +-----------------------------------------+-----------------------------------------+
            |                                         |                                         |
            v                                         v                                         v
+-----------------------+                 +-----------------------+                 +-----------------------+
|  Entity Resolution    |                 |   Anomaly Detection   |                 | PDF & CSV Report      |
|  Engine               |                 |   Engine              |                 | Generator             |
|                       |                 |                       |                 |                       |
| - RapidFuzz Matcher   |                 | - Rule-Based Validator|                 | - ReportLab PDF       |
| - TF-IDF Vectorizer   |                 | - Isolation Forest ML |                 | - Pandas CSV          |
| - Cosine Similarity   |                 | - 0-100 Scoring Engine|                 | - Side-by-side Diff   |
+-----------------------+                 +-----------------------+                 +-----------------------+
                                                      |
                                                      v
                                          +-----------------------+
                                          | SQLite Database Layer |
                                          | (Uploads, Entities,   |
                                          | Inconsistencies, Logs)|
                                          +-----------------------+
```

---

## ⚙️ Core Features & Capabilities

1. **Multi-Source Dataset Upload & Sample Loader**: Upload custom CSV/Excel files or instantly load pre-packaged synthetic datasets (Healthcare, Financial KYC, HR Master Data).
2. **Hybrid Entity Resolution**: Group records belonging to the same entity using RapidFuzz (Token Sort Ratio) and TF-IDF Cosine Similarity.
3. **Hybrid Inconsistency & Anomaly Detection**:
   - **Attribute Conflicts**: Detect conflicting credit scores, addresses, statuses across records.
   - **Date Inconsistencies**: Detect logical chronological inversions (e.g. Verification pre-dating Registration).
   - **Missing Fields**: Flag missing national identifiers or emails.
   - **Isolation Forest ML Anomalies**: Detect multivariate statistical outliers in numerical financial distributions.
4. **0–100 Inconsistency Scoring & Evidence Engine**: Every entity receives a composite score with evidence explanations.
5. **Interactive React Analytics Dashboard**: Real-time Recharts visual breakdown of severity levels, error categories, and top flagged entities.
6. **Side-by-Side Record Comparison Matrix**: Highlight field-level matches vs conflicts and export individual PDF audit packages.
7. **ML Benchmark & Model Evaluation Harness**: Evaluate Precision, Recall, F1-Score, Confusion Matrix, and ROC curves against synthetic ground truth annotations.
8. **Audit Export Center**: Bulk export findings to CSV and formatted PDF reports.

---

## 🛠 Technology Stack

* **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios
* **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLite
* **Machine Learning & NLP**: Scikit-Learn (Isolation Forest), RapidFuzz, Pandas, NumPy
* **Export Utilities**: ReportLab (PDF Generation), OpenPyXL, CSV

---

## 🚀 Setup & Running Instructions (Windows PowerShell)

### Prerequisites
- Python 3.10 or higher
- Node.js v18 or higher (with npm)

---

### Step 1: Start the Backend FastAPI Server

Open Windows PowerShell and navigate to the backend directory:

```powershell
# Navigate to backend directory
cd e:\TruthTrail\backend

# (Optional) Create a Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install required Python packages
pip install -r requirements.txt

# Launch the FastAPI server
python run.py
```

The FastAPI backend will initialize the SQLite database (`truthtrail.db`), load initial synthetic sample datasets, and run at:
👉 **`http://127.0.0.1:8000`** (API Docs available at `http://127.0.0.1:8000/docs`)

---

### Step 2: Start the Frontend React Development Server

Open a second Windows PowerShell tab/window:

```powershell
# Navigate to frontend directory
cd e:\TruthTrail\frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```

The React frontend will launch at:
👉 **`http://localhost:3000`**

---

## 📡 Key REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend status check |
| `POST` | `/api/sample/load` | Generate & load synthetic sample dataset |
| `POST` | `/api/upload/files` | Upload custom CSV / Excel datasets |
| `GET` | `/api/analysis/summary` | Get dashboard KPIs and error type breakdown |
| `GET` | `/api/analysis/entities` | List & filter entities (by severity, search, status) |
| `GET` | `/api/entities/{id}` | Get side-by-side records & evidence for an entity |
| `POST` | `/api/entities/{id}/investigate` | Update investigation status & auditor notes |
| `GET` | `/api/evaluation/run` | Execute ML synthetic benchmark & compute F1-score |
| `GET` | `/api/reports/export/csv` | Download bulk CSV report |
| `GET` | `/api/reports/export/pdf/{id}` | Download formatted PDF audit report |

---

## 📜 Disclaimer & Ethical Guidelines

* **Verification Requirement**: Detected inconsistencies are flagged as potential data issues requiring human auditor verification. They do not constitute automatic proof of fraud.
* **Original Record Integrity**: Original source records are strictly preserved without unauthorized mutation.
