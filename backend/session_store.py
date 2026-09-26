"""
In-memory session store.

Three dicts keyed by session_id (UUID string):
  _reports      : session_id → AnalysisReport   (written by Phase 3)
  _chunks       : session_id → List[CodeChunk]  (written by Phase 2)
  _project_names: session_id → str              (written alongside chunks)

No persistence between restarts — MVP only.
"""

from typing import Dict, List, Optional
from backend.models.schemas import AnalysisReport
from backend.analyzer.code_chunker import CodeChunk

_reports: Dict[str, AnalysisReport] = {}
_chunks: Dict[str, List[CodeChunk]] = {}
_project_names: Dict[str, str] = {}


# ── Reports ───────────────────────────────────────────────────────────────────

def save(session_id: str, report: AnalysisReport) -> None:
    _reports[session_id] = report


def get(session_id: str) -> Optional[AnalysisReport]:
    return _reports.get(session_id)


def delete(session_id: str) -> None:
    _reports.pop(session_id, None)
    _chunks.pop(session_id, None)
    _project_names.pop(session_id, None)


# ── Chunks ────────────────────────────────────────────────────────────────────

def save_chunks(session_id: str, chunks: List[CodeChunk]) -> None:
    _chunks[session_id] = chunks


def get_chunks(session_id: str) -> Optional[List[CodeChunk]]:
    return _chunks.get(session_id)


# ── Project names ─────────────────────────────────────────────────────────────

def save_project_name(session_id: str, name: str) -> None:
    _project_names[session_id] = name


def get_project_name(session_id: str) -> Optional[str]:
    return _project_names.get(session_id)
