"""
static_analyzer.py

Lightweight, zero-dependency static issue detection.
Works entirely from CodeChunk.content — no disk access required.

Public API:
    run_static_analysis(chunks: List[CodeChunk]) -> List[Dict]

Each returned dict matches the raw-issue shape that analysis_engine._parse_chunk_issues
produces, so it slots directly into all_raw_issues without any schema changes:

    {
        "category":    "security" | "code_quality" | "maintainability" | "testing",
        "severity":    "critical" | "high" | "medium" | "low" | "info",
        "title":       str,
        "description": str,
        "line_start":  int | None,
        "line_end":    int | None,
        "file_path":   str,   # relative_path from the chunk
    }

Detectors
---------
1. Hardcoded secrets      — security / critical
2. eval() usage           — security / high
3. TODO / FIXME comments  — maintainability / low
4. Long Python functions  — code_quality / low
5. Missing test files     — testing / medium  (project-level, one issue max)
"""

import re
from typing import Dict, List

from backend.analyzer.code_chunker import CodeChunk

# ---------------------------------------------------------------------------
# Path-based filtering — skip generated / vendor / build directories
# ---------------------------------------------------------------------------
# These path segments indicate that a file is not project-authored code.
_SKIP_PATH_SEGMENTS = re.compile(
    r"(?:^|[/\\])"
    r"(?:node_modules|\.git|dist|build|target|vendor|__pycache__|"
    r"\.venv|venv|env|coverage|\.next|\.nuxt|\.cache|"
    r"site-packages|egg-info|migrations)"
    r"(?:[/\\]|$)",
    re.IGNORECASE,
)

# Generated Python files by suffix/prefix pattern
_GENERATED_PY_RE = re.compile(
    r"(?:_pb2\.py|_pb2_grpc\.py|setup\.cfg)$"
    r"|(?:^|[/\\])conftest\.py$",
    re.IGNORECASE,
)


def _is_generated_path(path: str) -> bool:
    """Return True if *path* looks like a generated/vendor/build artifact."""
    return bool(_SKIP_PATH_SEGMENTS.search(path))


# ---------------------------------------------------------------------------
# Detector 1 — Hardcoded secrets
# ---------------------------------------------------------------------------
_SECRET_RE = re.compile(
    r"""(?ix)                               # case-insensitive, verbose
    (?:
        password | passwd | secret | api_key | apikey |
        access_token | auth_token | private_key | token
    )
    \s* [=:] \s*                            # assignment or dict-style colon
    (?P<q>["'])                             # opening quote
    (?P<val>[^"'\s]{4,})                    # at least 4 non-whitespace chars
    (?P=q)                                  # matching closing quote
    """,
)

# Values that are never real credentials — common placeholders, defaults, demo values.
_SECRET_PLACEHOLDERS: frozenset = frozenset({
    # original set
    "your_key_here", "changeme", "placeholder", "example",
    "xxxx", "****", "todo", "secret",
    # added: single-word dictionary values that signal documentation/defaults
    "password", "passwd", "token", "apikey", "api_key",
    "admin", "root", "test", "demo", "null", "none",
    "true", "false", "default", "foobar", "qwerty",
    "abc123", "letmein", "welcome", "login", "guest",
    "user", "username", "mypassword", "mytoken", "mysecret",
    "testpassword", "testtoken", "samplesecret",
    "enter_your_key", "insert_key_here", "replace_me",
    "add_your_key", "put_your_key_here",
})

# Template/env-var interpolation patterns — already using a secret manager
_TEMPLATE_RE = re.compile(
    r"""(?x)
    ^ (?:
        \$\{[^}]+\}     |   # ${VAR}  shell / JS template
        %[A-Z_]+%       |   # %VAR%   Windows env
        \{\{[^}]+\}\}   |   # {{var}} Jinja / Helm
        <[^>]+>         |   # <PLACEHOLDER>
        \[[^\]]+\]          # [PLACEHOLDER]
    ) $
    """,
)

# Entropy heuristic: a genuine credential usually has at least one digit OR
# special character OR mixed case OR is longer than 16 chars.
_SPECIAL_CHARS_RE = re.compile(r"[^a-zA-Z0-9]")
_HAS_DIGIT_RE = re.compile(r"\d")


def _looks_like_credential(val: str) -> bool:
    """Return True when *val* has characteristics of a real secret."""
    if len(val) >= 16:
        return True
    if _HAS_DIGIT_RE.search(val) and len(val) >= 8:
        return True
    if _SPECIAL_CHARS_RE.search(val):
        return True
    # Mixed case with reasonable length
    if val != val.lower() and val != val.upper() and len(val) >= 8:
        return True
    return False


_SECRET_DESCRIPTION = (
    "A secret value (password, token, or API key) appears to be hardcoded directly "
    "in the source code. Anyone who can read this file — including in version control "
    "history — can steal it. Use environment variables or a secrets manager instead."
)

_SECRET_FIX = (
    "Move the secret to an environment variable: remove the hardcoded value from the "
    "source file, add the variable to a .env file (and add .env to .gitignore), then "
    "read it at runtime with os.getenv('MY_SECRET') in Python or process.env.MY_SECRET "
    "in Node.js. Never commit real credentials to version control."
)


def _detect_secrets(chunk: CodeChunk) -> List[Dict]:
    if _is_generated_path(chunk.relative_path):
        return []

    issues: List[Dict] = []
    for lineno, line in enumerate(chunk.content.splitlines(), start=1):
        # Skip comment lines
        stripped = line.strip()
        if stripped.startswith(("#", "//", "*", "<!--")):
            continue
        m = _SECRET_RE.search(line)
        if not m:
            continue
        val = m.group("val")
        val_lower = val.lower()

        # Skip known placeholder values (exact match, case-insensitive)
        if val_lower in _SECRET_PLACEHOLDERS:
            continue
        # Skip template/env-var references like ${DB_PASS}, <PASSWORD>, [key]
        if _TEMPLATE_RE.match(val):
            continue
        # Skip values that lack any entropy signal
        if not _looks_like_credential(val):
            continue

        issues.append({
            "category": "security",
            "severity": "critical",
            "title": "Hardcoded secret detected",
            "description": _SECRET_DESCRIPTION,
            "suggested_fix": _SECRET_FIX,
            "line_start": lineno,
            "line_end": lineno,
            "file_path": chunk.relative_path,
        })
    return issues


# ---------------------------------------------------------------------------
# Detector 2 — eval() usage
# ---------------------------------------------------------------------------
_EVAL_RE = re.compile(r"\beval\s*\(")
_EVAL_EXTENSIONS = {".py", ".js", ".ts", ".tsx", ".jsx"}

# Detect Python docstring boundaries (triple-quoted strings)
_TRIPLE_QUOTE_RE = re.compile(r'("""|\'\'\').*?(\1)', re.DOTALL)

_EVAL_DESCRIPTION = (
    "The eval() function executes arbitrary code from a string at runtime. "
    "If the string contains user-controlled input, an attacker can run any code "
    "they like inside your application. Replace eval() with a safer alternative "
    "such as JSON.parse(), ast.literal_eval(), or a dedicated parser."
)

_EVAL_FIX = (
    "Replace eval() with a purpose-built alternative: use JSON.parse() for JSON data, "
    "ast.literal_eval() for Python literals, or a proper parser/templating library for "
    "anything more complex. If the input comes from a user, validate and sanitise it "
    "strictly before processing."
)


def _detect_eval(chunk: CodeChunk) -> List[Dict]:
    ext = "." + chunk.relative_path.rsplit(".", 1)[-1].lower() if "." in chunk.relative_path else ""
    if ext not in _EVAL_EXTENSIONS:
        return []
    if _is_generated_path(chunk.relative_path):
        return []

    # Build a set of line numbers that are inside triple-quoted strings
    # (Python docstrings / multiline strings) to suppress false positives.
    docstring_lines: set = set()
    if ext == ".py":
        content = chunk.content
        for m in _TRIPLE_QUOTE_RE.finditer(content):
            start_line = content[: m.start()].count("\n") + 1
            end_line = content[: m.end()].count("\n") + 1
            for ln in range(start_line, end_line + 1):
                docstring_lines.add(ln)

    issues: List[Dict] = []
    for lineno, line in enumerate(chunk.content.splitlines(), start=1):
        if lineno in docstring_lines:
            continue
        stripped = line.strip()
        if stripped.startswith(("#", "//", "*")):
            continue
        # Skip lines where eval only appears inside a string literal.
        # A simple heuristic: if the whole line contains a string that wraps eval.
        # We check whether the match is inside quotes by looking at the context.
        if not _EVAL_RE.search(line):
            continue
        # If the word only appears after a quote character on the same line,
        # it's likely inside a string — skip it.
        # e.g.: msg = "never use eval() here"
        line_before_match = line[: _EVAL_RE.search(line).start()]  # type: ignore[union-attr]
        open_quotes = line_before_match.count('"') + line_before_match.count("'")
        if open_quotes % 2 == 1:
            # Odd number of open quotes → we're inside a string literal
            continue

        issues.append({
            "category": "security",
            "severity": "high",
            "title": "Use of eval() detected",
            "description": _EVAL_DESCRIPTION,
            "suggested_fix": _EVAL_FIX,
            "line_start": lineno,
            "line_end": lineno,
            "file_path": chunk.relative_path,
        })
    return issues


# ---------------------------------------------------------------------------
# Detector 3 — TODO / FIXME comments
# ---------------------------------------------------------------------------
_TODO_RE = re.compile(r"(?:#|//|/\*)\s*(TODO|FIXME|HACK|XXX)\b", re.IGNORECASE)

_TODO_DESCRIPTION = (
    "A {tag} comment was found in the code. These comments usually mark incomplete "
    "work, known bugs, or temporary workarounds. Before shipping, review each one "
    "and either fix the underlying issue or create a tracked ticket for it."
)

_TODO_FIX = (
    "Review this {tag} comment and take one of these actions: (1) fix the underlying "
    "issue now if it is small, (2) create a ticket in your issue tracker and replace "
    "the comment with the ticket reference (e.g. '# See issue #42'), or (3) delete "
    "the comment if it is no longer relevant."
)


def _detect_todos(chunk: CodeChunk) -> List[Dict]:
    if _is_generated_path(chunk.relative_path):
        return []

    issues: List[Dict] = []
    for lineno, line in enumerate(chunk.content.splitlines(), start=1):
        m = _TODO_RE.search(line)
        if m:
            tag = m.group(1).upper()
            issues.append({
                "category": "maintainability",
                "severity": "low",
                "title": f"{tag} comment left in code",
                "description": _TODO_DESCRIPTION.format(tag=tag),
                "suggested_fix": _TODO_FIX.format(tag=tag),
                "line_start": lineno,
                "line_end": lineno,
                "file_path": chunk.relative_path,
            })
    return issues


# ---------------------------------------------------------------------------
# Detector 4 — Long Python functions
# ---------------------------------------------------------------------------
_LONG_FUNC_THRESHOLD = 50
_DEF_RE = re.compile(r"^(\s*)def\s+(\w+)\s*\(")

_LONG_FUNC_DESCRIPTION = (
    "The function '{name}' is {length} lines long. Long functions are hard to read, "
    "test, and maintain. Consider breaking it into smaller helper functions, each "
    "responsible for a single clear task."
)

_LONG_FUNC_FIX = (
    "Refactor '{name}' by extracting logical sub-steps into separate, well-named "
    "helper functions. Aim for each function to do one thing. A good target is under "
    "20–30 lines per function. Look for natural seams: loops, conditional blocks, or "
    "steps with their own clear purpose are good candidates to extract."
)


def _detect_long_functions(chunk: CodeChunk) -> List[Dict]:
    if not chunk.relative_path.endswith(".py"):
        return []
    if _is_generated_path(chunk.relative_path):
        return []
    # Skip obvious generated Python files (protobuf, migrations, etc.)
    if _GENERATED_PY_RE.search(chunk.relative_path):
        return []

    issues: List[Dict] = []
    lines = chunk.content.splitlines()
    n = len(lines)

    i = 0
    while i < n:
        m = _DEF_RE.match(lines[i])
        if m:
            func_indent = len(m.group(1))
            func_name = m.group(2)
            start_lineno = i + 1  # 1-based

            j = i + 1
            while j < n:
                stripped = lines[j].strip()
                if not stripped or stripped.startswith("#"):
                    j += 1
                    continue
                current_indent = len(lines[j]) - len(lines[j].lstrip())
                if current_indent <= func_indent and (
                    re.match(r"\s*(def|class|async def)\s", lines[j])
                    or current_indent < func_indent
                ):
                    break
                j += 1

            body_length = j - i
            if body_length > _LONG_FUNC_THRESHOLD:
                issues.append({
                    "category": "code_quality",
                    "severity": "low",
                    "title": f"Function '{func_name}' is too long ({body_length} lines)",
                    "description": _LONG_FUNC_DESCRIPTION.format(
                        name=func_name, length=body_length
                    ),
                    "suggested_fix": _LONG_FUNC_FIX.format(name=func_name),
                    "line_start": start_lineno,
                    "line_end": start_lineno + body_length - 1,
                    "file_path": chunk.relative_path,
                })
            i = j
        else:
            i += 1

    return issues


# ---------------------------------------------------------------------------
# Detector 5 — Missing test files (project-level, emits at most one issue)
# ---------------------------------------------------------------------------
_SOURCE_EXTS = {".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".go", ".rb"}

_TEST_PATTERNS = re.compile(
    r"(^|[\\/])(test_[^/\\]+|[^/\\]+_test|[^/\\]+\.test\.|[^/\\]+\.spec\.)",
    re.IGNORECASE,
)

_MISSING_TESTS_DESCRIPTION = (
    "No test files were detected in this project. Automated tests are essential for "
    "catching regressions, documenting expected behaviour, and enabling safe refactoring. "
    "Consider adding unit tests using a framework like pytest (Python), Jest (JavaScript), "
    "or the built-in testing package for your language."
)

_MISSING_TESTS_FIX = (
    "Create a tests/ directory and add at least one test file (e.g. test_main.py or "
    "main.test.ts). Start by testing the most critical functions. Use pytest for Python "
    "('pip install pytest', then 'pytest'), Jest for JavaScript/TypeScript "
    "('npm install --save-dev jest', then 'npx jest'), or the equivalent for your language."
)


def _detect_missing_tests(chunks: List[CodeChunk]) -> List[Dict]:
    has_source = False
    has_tests = False

    for chunk in chunks:
        path = chunk.relative_path
        # Ignore vendor/generated paths when deciding if the project has source
        if _is_generated_path(path):
            continue
        ext = "." + path.rsplit(".", 1)[-1].lower() if "." in path else ""
        if ext in _SOURCE_EXTS:
            has_source = True
        if _TEST_PATTERNS.search(path):
            has_tests = True
        if has_source and has_tests:
            break

    if has_source and not has_tests:
        return [{
            "category": "testing",
            "severity": "medium",
            "title": "No test files found in project",
            "description": _MISSING_TESTS_DESCRIPTION,
            "suggested_fix": _MISSING_TESTS_FIX,
            "line_start": None,
            "line_end": None,
            "file_path": None,
        }]
    return []


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_static_analysis(chunks: List[CodeChunk]) -> List[Dict]:
    """
    Run all static detectors over *chunks* and return a flat list of raw
    issue dicts in the same shape as analysis_engine._parse_chunk_issues output.

    Works entirely from CodeChunk.content — no disk access.
    Safe to call even when IBM Bob is unavailable.
    """
    issues: List[Dict] = []

    # Per-chunk detectors
    for chunk in chunks:
        issues.extend(_detect_secrets(chunk))
        issues.extend(_detect_eval(chunk))
        issues.extend(_detect_todos(chunk))
        issues.extend(_detect_long_functions(chunk))

    # Note: _detect_missing_tests is intentionally not called here.
    # "No test files" is an advisory observation, not an actual code defect.

    return issues
