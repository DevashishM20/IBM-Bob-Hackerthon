"""
analysis_engine.py

Single public coroutine:

    run_analysis(session_id, project_name) -> AnalysisReport

Flow:
  1. Pull CodeChunks from the session store.
  2. Run static analysis across all chunks.
  3. Compute per-category scores deterministically from the issue list.
  4. Assemble and return a complete AnalysisReport.

No external API calls are made. All analysis is performed locally.
"""

import logging
import uuid
from typing import Dict, List

from backend.analyzer.static_analyzer import run_static_analysis
from backend.models.schemas import (
    AnalysisReport,
    Category,
    CategoryScore,
    Issue,
    Severity,
)
import backend.session_store as store

log = logging.getLogger(__name__)

# All four categories, in display order
_ALL_CATEGORIES = [
    Category.code_quality,
    Category.security,
    Category.testing,
    Category.maintainability,
]

# Score penalty per severity level
_DEDUCTIONS = {
    "critical": 25,
    "high": 15,
    "medium": 8,
    "low": 3,
    "info": 1,
}


# ── Issue building ─────────────────────────────────────────────────────────────

def _build_issues(raw_issues: List[Dict]) -> List[Issue]:
    """Convert raw dicts into validated Issue Pydantic models, skipping bad values."""
    issues: List[Issue] = []
    for raw in raw_issues:
        try:
            issues.append(Issue(
                id=str(uuid.uuid4()),
                category=Category(raw["category"]),
                severity=Severity(raw["severity"]),
                title=raw["title"][:200],
                description=raw["description"],
                file_path=raw.get("file_path"),
                line_start=raw.get("line_start"),
                line_end=raw.get("line_end"),
                suggested_fix=raw.get("suggested_fix"),
            ))
        except (ValueError, KeyError) as exc:
            log.warning("Skipping issue with invalid enum value: %s — %s", raw, exc)
    return issues


# ── Score computation ──────────────────────────────────────────────────────────

def _build_scores(raw_issues: List[Dict]) -> List[CategoryScore]:
    """
    Compute a 0–100 health score for each category based purely on the
    severity of issues found. Starts at 100 and deducts per-severity penalties.
    """
    scores: List[CategoryScore] = []
    for cat in _ALL_CATEGORIES:
        issues_in_cat = [i for i in raw_issues if i.get("category") == cat.value]
        penalty = sum(_DEDUCTIONS.get(i.get("severity", "info"), 1) for i in issues_in_cat)
        score = max(0, 100 - penalty)
        scores.append(CategoryScore(category=cat, score=score, issue_count=len(issues_in_cat)))
    return scores


# ── Public API ────────────────────────────────────────────────────────────────

async def run_analysis(session_id: str, project_name: str) -> AnalysisReport:
    """
    Run static analysis for *session_id* and return a complete AnalysisReport.

    Raises:
        KeyError     — session_id not found in the store
        RuntimeError — no chunks stored for this session
    """
    chunks = store.get_chunks(session_id)
    if chunks is None:
        raise KeyError(f"No chunks found for session {session_id!r}")
    if not chunks:
        raise RuntimeError("Session has zero chunks — nothing to analyse")

    log.info("Starting analysis for session %s (%d chunks)", session_id, len(chunks))

    raw_issues: List[Dict] = run_static_analysis(chunks)
    log.info("Static analysis found %d issue(s)", len(raw_issues))

    issues = _build_issues(raw_issues)
    scores = _build_scores(raw_issues)
    summary = (
        f"Static analysis of {project_name} complete. "
        f"{len(issues)} issue(s) found across {len(chunks)} file chunk(s)."
    )

    report = AnalysisReport(
        session_id=session_id,
        project_name=project_name,
        scores=scores,
        issues=issues,
        summary=summary,
    )

    log.info(
        "Analysis complete — %d issues, scores: %s",
        len(issues),
        {s.category.value: s.score for s in scores},
    )
    return report
