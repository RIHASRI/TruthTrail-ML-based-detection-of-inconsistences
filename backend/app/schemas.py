from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class EntitySummary(BaseModel):
    unified_entity_id: str
    primary_name: str
    national_id: Optional[str] = None
    record_count: int
    inconsistency_score: int
    severity: str
    investigation_status: str
    created_at: Optional[str] = None

class EvidenceItem(BaseModel):
    type: str
    severity: str
    description: str

class RecordDetail(BaseModel):
    id: str
    unified_entity_id: str
    source_name: str
    full_name: Optional[str] = None
    national_id: Optional[str] = None
    dob: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    account_balance: Optional[float] = None
    credit_score: Optional[int] = None
    status: Optional[str] = None
    registration_date: Optional[str] = None
    verification_date: Optional[str] = None

class EntityDetailResponse(BaseModel):
    entity: EntitySummary
    evidence: List[EvidenceItem]
    records: List[RecordDetail]

class InvestigationUpdate(BaseModel):
    status: str  # PENDING, UNDER_REVIEW, RESOLVED, FALSE_POSITIVE
    notes: Optional[str] = ""

class AnalysisSummaryResponse(BaseModel):
    total_entities: int
    flagged_entities: int
    clean_entities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    average_score: float
    error_breakdown: Dict[str, int]
