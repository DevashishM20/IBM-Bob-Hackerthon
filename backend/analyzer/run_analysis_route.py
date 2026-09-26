"""
run_analysis_route.py

FastAPI router for the POST /run/{session_id} endpoint.

Kept separate from main.py to avoid bloating the entry point.
main.py registers this router with: app.include_router(run_router)
"""

import logging

from fastapi import APIRouter, HTTPException

from backend.analyzer.analysis_engine import run_analysis
from backend.models.schemas import AnalysisReport, AnalysisStatus
import backend.session_store as store

log = logging.getLogger(__name__)

run_router = APIRouter()


@run_router.post(
    "/run/{session_id}",
    response_model=AnalysisReport,
    summary="Run static analysis on an ingested session",
    description=(
        "Retrieves the stored code chunks for *session_id*, runs static analysis, "
        "assembles an AnalysisReport, persists it in the session store, "
        "and returns it. The session must already have been created via POST /analyze "
        "or POST /analyze/upload."
    ),
)
async def run_analysis_endpoint(session_id: str):
    # Guard: session must have chunks (created by Phase 2)
    chunks = store.get_chunks(session_id)
    if chunks is None:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found. "
                   "Submit a project first via POST /analyze or POST /analyze/upload.",
        )

    # Guard: don't re-run if a report already exists
    existing = store.get(session_id)
    if existing is not None:
        log.info("Returning cached report for session %s", session_id)
        return existing

    # Retrieve the project_name stored alongside the chunks.
    # We use the first chunk's relative_path top-level directory as a fallback.
    project_name = store.get_project_name(session_id) or "Project"

    try:
        report = await run_analysis(session_id, project_name)
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        log.error("Analysis failed for session %s: %s", session_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")

    store.save(session_id, report)
    return report
