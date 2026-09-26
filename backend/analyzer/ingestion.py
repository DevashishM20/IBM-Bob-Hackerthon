"""
ingestion.py

Owns the two ingestion workflows:
  - ingest_github_url : shallow-clone a GitHub repo, walk + chunk it
  - ingest_zip        : extract a ZIP archive, walk + chunk it
  - cleanup           : remove the session temp dir

Both functions return (project_name, List[CodeChunk]).
Phase 3 will consume the chunks and call IBM Bob.
"""

import os
import re
import shutil
import zipfile
from typing import List, Tuple

import git  # gitpython

from backend.analyzer.file_walker import walk_project
from backend.analyzer.code_chunker import CodeChunk, chunk_file

# Root temp directory (relative to cwd when uvicorn is started)
TEMP_ROOT = os.path.join(os.getcwd(), "tmp")

# Safety caps for the MVP
MAX_FILES = 200
MAX_CHUNKS = 500


def _session_dir(session_id: str) -> str:
    return os.path.join(TEMP_ROOT, session_id)


def _ensure_temp_root() -> None:
    os.makedirs(TEMP_ROOT, exist_ok=True)


def _collect_chunks(project_dir: str) -> List[CodeChunk]:
    """Walk *project_dir*, chunk every source file, and return all chunks."""
    file_paths = walk_project(project_dir)[:MAX_FILES]
    chunks: List[CodeChunk] = []
    for fp in file_paths:
        chunks.extend(chunk_file(fp, project_dir))
        if len(chunks) >= MAX_CHUNKS:
            break
    return chunks[:MAX_CHUNKS]


def _project_name_from_url(url: str) -> str:
    """Extract a human-readable project name from a GitHub URL."""
    match = re.search(r"/([^/]+?)(?:\.git)?$", url.rstrip("/"))
    return match.group(1) if match else "Project"


# ── Public API ────────────────────────────────────────────────────────────────

def ingest_github_url(url: str, session_id: str) -> Tuple[str, List[CodeChunk]]:
    """
    Shallow-clone *url* into tmp/<session_id>/, walk and chunk all source
    files, then remove the clone from disk.

    Returns (project_name, chunks).
    Raises ValueError if *url* doesn't look like a Git URL.
    Raises git.GitCommandError on clone failure.
    """
    if not re.match(r"https?://", url):
        raise ValueError(f"Invalid URL: {url!r}. Must start with http:// or https://")

    _ensure_temp_root()
    target = _session_dir(session_id)

    try:
        git.Repo.clone_from(url, target, depth=1, single_branch=True)
        chunks = _collect_chunks(target)
        project_name = _project_name_from_url(url)
        return project_name, chunks
    finally:
        # Remove clone from disk regardless of success/failure — chunks are
        # already in memory and the raw source is no longer needed.
        cleanup(session_id)


def ingest_zip(zip_bytes: bytes, session_id: str) -> Tuple[str, List[CodeChunk]]:
    """
    Write *zip_bytes* to disk, extract into tmp/<session_id>/, walk and
    chunk all source files, then remove the extracted tree.

    Returns (project_name, chunks).
    Raises zipfile.BadZipFile if the bytes are not a valid ZIP.
    """
    _ensure_temp_root()
    target = _session_dir(session_id)
    zip_path = target + ".zip"

    try:
        with open(zip_path, "wb") as fh:
            fh.write(zip_bytes)

        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(target)

        # ZIPs often have a single top-level folder — use it as the project name
        top_level = [
            e for e in os.listdir(target)
            if os.path.isdir(os.path.join(target, e))
        ]
        project_name = top_level[0] if len(top_level) == 1 else "Project"
        chunks = _collect_chunks(target)
        return project_name, chunks
    finally:
        # Clean up both the ZIP and the extracted tree
        if os.path.exists(zip_path):
            os.remove(zip_path)
        cleanup(session_id)


def cleanup(session_id: str) -> None:
    """Remove the temp directory for *session_id* if it exists."""
    target = _session_dir(session_id)
    if os.path.exists(target):
        shutil.rmtree(target, ignore_errors=True)
