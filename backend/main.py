"""
main.py — CodeGuardian FastAPI application entry point.

Routes defined here:
  POST /analyze          → accept GitHub URL, clone + ingest, store chunks
  POST /analyze/upload   → accept ZIP, extract + ingest, store chunks
  GET  /results/{id}     → return the full AnalysisReport for a session
  GET  /health           → liveness probe
"""

import sys
import os

# Ensure the project root is on sys.path so that `backend.*` imports resolve
# whether uvicorn is started as:
#   uvicorn backend.main:app          (from project root)  — already works
#   uvicorn main:app    --app-dir backend  (from backend/) — needs this shim
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

import uuid
import git
import zipfile as _zipfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    AnalysisStatus,
    AnalysisReport,
)
from backend.analyzer.ingestion import ingest_github_url, ingest_zip
from backend.analyzer.run_analysis_route import run_router
import backend.session_store as store

app = FastAPI(
    title="CodeGuardian API",
    description="Static code analysis for your projects",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Allow the Vite dev server to call this API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(run_router)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "CodeGuardian"}


# ── Analysis ──────────────────────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_url(request: AnalysisRequest):
    """
    Shallow-clone the GitHub URL, walk + chunk all source files, and store
    the chunks in the session store.
    """
    if not request.github_url:
        raise HTTPException(status_code=422, detail="github_url is required")

    session_id = str(uuid.uuid4())
    try:
        project_name, chunks = ingest_github_url(request.github_url, session_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except git.GitCommandError as exc:
        raise HTTPException(status_code=400, detail=f"Git clone failed: {exc}")

    # Use the user-supplied name if provided, otherwise fall back to repo name
    project_name = request.project_name or project_name
    store.save_chunks(session_id, chunks)
    store.save_project_name(session_id, project_name)

    # Count unique files represented in the chunks
    file_count = len({c.file_path for c in chunks})

    return AnalysisResponse(
        session_id=session_id,
        status=AnalysisStatus.ready_for_analysis,
        project_name=project_name,
        file_count=file_count,
        chunk_count=len(chunks),
    )


@app.post("/analyze/upload", response_model=AnalysisResponse)
async def analyze_upload(file: UploadFile = File(...)):
    """
    Extract the uploaded ZIP, walk + chunk all source files, and store
    the chunks in the session store.
    """
    session_id = str(uuid.uuid4())
    zip_bytes = await file.read()

    try:
        project_name, chunks = ingest_zip(zip_bytes, session_id)
    except _zipfile.BadZipFile:
        raise HTTPException(status_code=422, detail="Uploaded file is not a valid ZIP archive")

    store.save_chunks(session_id, chunks)
    store.save_project_name(session_id, project_name)
    file_count = len({c.file_path for c in chunks})

    return AnalysisResponse(
        session_id=session_id,
        status=AnalysisStatus.ready_for_analysis,
        project_name=project_name,
        file_count=file_count,
        chunk_count=len(chunks),
    )


# ── Results ───────────────────────────────────────────────────────────────────

@app.get("/results/{session_id}", response_model=AnalysisReport)
async def get_results(session_id: str):
    report = store.get(session_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return report
