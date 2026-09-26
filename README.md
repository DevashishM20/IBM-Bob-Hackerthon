# CodeGuardian 🛡️

> AI-powered code analysis backed by **IBM Bob**.  
> Built for the IBM Bob 2.0 Hackathon.

CodeGuardian analyzes a software project and gives developers a full health
report: code quality, security vulnerabilities, test coverage gaps, and
maintainability issues — explained in beginner-friendly language with
IBM-Bob-powered fix suggestions.

---

## Project Structure

```
codeguardian/
├── frontend/          # React + Vite + TypeScript SPA (Tailwind CSS)
├── backend/           # Python FastAPI service
│   ├── analyzer/      # File walker, code chunker, prompt builder
│   ├── bob_client/    # IBM Bob API wrapper
│   └── models/        # Pydantic schemas
├── prompts/           # Prompt templates for IBM Bob (plain Markdown)
├── .env.example       # Environment variable template
└── README.md
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 20+ |
| npm | 10+ |

---

## Getting Started

### 1. Clone & configure environment

```bash
git clone <your-repo-url>
cd codeguardian
cp .env.example .env
# Edit .env and add your BOB_API_KEY
```

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Then, **from the project root** (one level above `backend/`):

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

> **Important:** uvicorn must be run from the project root, not from inside `backend/`.

API available at `http://127.0.0.1:8000`  
Interactive docs at `http://127.0.0.1:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI available at `http://localhost:5173`

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/health` | Liveness probe |
| `POST` | `/analyze` | Submit GitHub URL for analysis |
| `POST` | `/analyze/upload` | Submit ZIP file for analysis |
| `GET`  | `/results/{id}` | Fetch analysis report |
| `POST` | `/fix` | Get IBM Bob fix suggestion for an issue |

---

## How IBM Bob Is Used

1. **Per-chunk analysis** — each source file chunk is sent to Bob with a structured prompt (`prompts/analyze_chunk.md`) to extract categorized issues.
2. **Score aggregation** — Bob reads all raw issues and returns a 0–100 health score per category plus a plain-English project summary (`prompts/score_report.md`).
3. **Fix suggestions** — clicking "Suggest Fix" sends the issue context to Bob and receives a step-by-step explanation plus corrected code (`prompts/suggest_fix.md`).
4. **Dev co-pilot** — IBM Bob was used throughout development to write, review, and improve this codebase.

---

## Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Scaffold — folder structure, config, hello-world wiring | ✅ Done |
| 2 | Ingestion — file walker, chunker, GitHub clone / ZIP upload | ⬜ |
| 3 | Analysis core — prompt builder + Bob client, real JSON responses | ⬜ |
| 4 | Dashboard UI — health scores, issue list, styling | ⬜ |
| 5 | Issue detail + fix suggestions | ⬜ |
| 6 | Polish — error states, loading UX, demo prep | ⬜ |

---

## License

MIT
