from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class AnalysisStatus(str, Enum):
    queued              = "queued"
    ingesting           = "ingesting"
    ready_for_analysis  = "ready_for_analysis"
    analyzing           = "analyzing"
    complete            = "complete"
    error               = "error"


class Severity(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    info = "info"


class Category(str, Enum):
    code_quality = "code_quality"
    security = "security"
    testing = "testing"
    maintainability = "maintainability"


class Issue(BaseModel):
    id: str
    category: Category
    severity: Severity
    title: str
    description: str          # beginner-friendly explanation
    file_path: Optional[str] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    suggested_fix: Optional[str] = None


class CategoryScore(BaseModel):
    category: Category
    score: int                # 0–100
    issue_count: int


class AnalysisReport(BaseModel):
    session_id: str
    project_name: str
    scores: List[CategoryScore]
    issues: List[Issue]
    summary: str


class AnalysisRequest(BaseModel):
    github_url: Optional[str] = None
    project_name: Optional[str] = "My Project"


class AnalysisResponse(BaseModel):
    session_id: str
    status: AnalysisStatus
    project_name: str
    file_count: int
    chunk_count: int
