<p align="center">
  <img src="static/images/planpass-logo.svg" alt="PlanPass" width="120">
</p>

<h1 align="center">PlanPass</h1>

<p align="center">
  <strong>AI-assisted building code compliance checking for IFC/BIM models</strong><br>
  Upload your building model and Texas zip code — get a door-compliance score and a verifiable report in seconds.
</p>

<p align="center">
  <a href="#overview">Overview</a> ·
  <a href="#features">Features</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#getting-started">Getting started</a> ·
  <a href="#testing">Testing</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#api">API</a>
</p>

---

## Overview

PlanPass checks IFC (Industry Foundation Classes) building models against Texas building
code requirements. A building designer uploads an IFC model and a Texas zip code; PlanPass:

1. Parses the IFC model and extracts every door (width, height, level, type).
2. Resolves the applicable building code for the jurisdiction of that zip code
   (e.g. City of Houston, City of Austin, or state defaults) — IBC Section 1010.1.1
   egress door widths, Texas Accessibility Standards, and local amendments.
3. Scores each door against the minimum required width (32" default) and produces:
   - a compliance score with pass/fail per door,
   - a visual 2D floor-plan viewer colored by compliance,
   - a non-compliant door table with required vs. actual width,
   - a SHA-256 hash-verified PDF report.

PlanPass was built for architects, builders, and plan reviewers who want to catch
egress-width violations before the plan review stage — not after.

## Features

- **IFC / BIM model parsing** — extracts doors, dimensions, levels, and types via IfcOpenShell.
- **Zip-code jurisdiction mapping** — a Texas zip-code database resolves the right jurisdiction
  (Houston, Dallas, Austin, San Antonio, Fort Worth, El Paso, and state-wide defaults).
- **AI code extraction (optional)** — with an `ANTHROPIC_API_KEY`, Claude parses building-code
  PDFs and extracts door-width requirements (falls back to built-in defaults without a key).
- **Compliance engine** — unit-correct (meters → inches), handles missing width data,
  configurable minimums, and boundary cases.
- **2D floor-plan viewer** — doors rendered as an SVG floor plan, colored green/red by
  compliance, with click-to-inspect, filtering, and focus-from-report.
- **Hash-verified reports** — every report carries a SHA-256 fingerprint anchored to its
  generation timestamp, with a downloadable PDF (jsPDF) and print styles.
- **One-click demo** — "Try Sample Model" runs the full pipeline on a bundled sample IFC
  (5 doors, Houston, 40% score) without preparing any files.
- **Dark mode** — full light/dark theme with preference persistence.

## How it works

```
┌─────────────┐   ┌──────────────┐   ┌──────────────────┐
│ IFC model   │──▶│ ifc_processor│──▶│ check_door_      │
│ upload      │   │ (IfcOpenShell)│  │ compliance       │
└─────────────┘   └──────────────┘   └────────┬─────────┘
┌─────────────┐   ┌──────────────┐            │
│ Texas zip   │──▶│ texas_building│            │
│ code        │   │ _codes       │───────────▶│
└─────────────┘   └──────────────┘            ▼
┌─────────────┐   ┌──────────────┐   ┌──────────────────┐
│ code PDF    │──▶│ ai_analyzer  │   │ compliance report│
│ (optional)  │   │ (Claude)     │   │ + 2D viewer      │
└─────────────┘   └──────────────┘   └──────────────────┘
```

| Module | Responsibility |
|---|---|
| `app.py` | Flask routes: upload, zip validation, report hash session |
| `ifc_processor.py` | IFC parsing + compliance scoring (meters → inches) |
| `texas_building_codes.py` | Zip → jurisdiction → code requirements database |
| `ai_analyzer.py` | Optional Claude-based extraction from code PDFs |
| `utils.py` | File validation, SHA-256 report hashing, score formatting |
| `static/js/viewer.js` | 2D SVG floor-plan viewer + highlighting |
| `static/js/report.js` | Report rendering + jsPDF generation |
| `templates/` | `layout.html` shell, `index.html` page |

### Unit correctness

IFC files store lengths in **meters** (e.g. `0.9144`), while building codes are written in
**inches** (32"). PlanPass converts on extraction (`meters_to_inches`, `×39.3701`) so
comparisons are always apples-to-apples — this was the single biggest correctness fix in
the project's history.

## Getting started

### Prerequisites

- Python 3.11+
- (Optional) [Playwright](https://playwright.dev) browsers for E2E tests
- (Optional) `ANTHROPIC_API_KEY` for AI PDF code extraction

### Local setup

```bash
git clone https://github.com/msourial/PlanPass.git
cd PlanPass

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
# or: gunicorn main:app --bind 0.0.0.0:5000
```

Open http://localhost:5000 — you'll see the PlanPass dashboard.

### Try it in 10 seconds

1. Click **Try Sample Model** (no files needed) — it loads the bundled
   `static/sample_building.ifc` (5 doors) and zip `77001` (Houston).
2. Watch the floor plan render, then scroll to the report: **40% compliance**,
   2 compliant / 3 non-compliant doors.
3. Click **View Issues in Model** to flash the non-compliant doors, or
   **Download PDF Report** for the hash-verified report.

Or use your own files: upload an `.ifc` model, enter a 5-digit Texas zip code
(e.g. `78701` for Austin), and click **Check Compliance**.

## Testing

```bash
# Unit + integration tests (47 tests)
pip install pytest pytest-cov
pytest tests/ --cov=ifc_processor --cov=texas_building_codes --cov=utils --cov=app

# End-to-end browser tests (4 tests, requires the server running on :5000)
pip install playwright pytest-playwright
python -m playwright install chromium
pytest tests/e2e -q
```

Full suite: **51 tests passing** (~81% line coverage on core modules).
See `docs/tdd/planpass-fix.tdd.md` for the RED/GREEN evidence report.

## Deployment

### Option A — Render (recommended, free)

Render is the easiest free host for Flask: it deploys straight from this GitHub repo,
auto-deploys on every push, and the free tier needs no credit card.

**One-click (Blueprint):**

1. Push this repo to GitHub (already done — `github.com/msourial/PlanPass`).
2. Go to [render.com](https://render.com) → **New +** → **Blueprint**.
3. Paste the repo URL `https://github.com/msourial/PlanPass` → **Apply**.
   - `render.yaml` in the repo root defines the `planpass` web service:
     - Build: `pip install -r requirements.txt`
     - Start: `gunicorn main:app --bind 0.0.0.0:$PORT --workers 2`
     - Health check on `/`
4. Wait ~3–5 minutes for the first build; you get a `https://planpass.onrender.com` URL.

**Manual (if you prefer the dashboard):**

1. Render → **New +** → **Web Service** → connect the `PlanPass` repo.
2. Runtime: **Python**, Build command: `pip install -r requirements.txt`,
   Start command: `gunicorn main:app --bind 0.0.0.0:$PORT --workers 2`.
3. Add the environment variable `SESSION_SECRET` (any long random string).

> Free-tier note: Render free web services sleep after ~15 minutes of inactivity;
> the first request after a sleep takes ~30–60s to wake. Fine for demos and reviews.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | No* | Flask session signing key. *Set a random value in production. |
| `ANTHROPIC_API_KEY` | No | Enables Claude-based building-code extraction from PDFs. Falls back to built-in defaults when absent. |

### Option B — Any Python host

The app is a standard Flask app with no database and no external services. It runs on any
host that can run `gunicorn main:app` — Railway, Fly.io, PythonAnywhere, a VPS, or a Docker
container. There is no database setup step.

## API

| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/` | GET | — | Index page |
| `/validate-zip` | POST | `{"zip_code": "77001"}` | `{"success": true, "zip_info": {city, county, jurisdiction, valid}}` |
| `/upload` | POST | multipart: `ifc_file` (.ifc), `zip_code` | `{success, ifc_data, compliance_results, report_hash}` |
| `/generate-report` | POST | (uses session) | `{success, report, verification_hash, timestamp}` |

`/upload` returns a `compliance_results` object:

```json
{
  "project_name": "Sample Building Project",
  "total_doors": 5,
  "compliant_doors": 2,
  "non_compliant_doors": 3,
  "compliance_score": 40.0,
  "doors": {
    "compliant": [{"id": 7, "name": "Door 1", "width_in": 36.0, "...": "..."}],
    "non_compliant": [{"id": 8, "name": "Door 2", "width_in": 28.0, "...": "..."}]
  },
  "building_code": {
    "source": "Texas Building Code - City of Houston",
    "min_door_width": 32.0,
    "requirements": ["..."]
  }
}
```

## Security notes

- Uploads are limited to **50 MB**, extension-whitelisted (`.ifc`), and scrubbed with
  `secure_filename`; files are processed in a temp dir and deleted immediately after.
- All model-derived strings (door names, project names) are HTML-escaped before being
  rendered in the report (`escapeHtml`), preventing stored-XSS via crafted IFC files.
- Every report is signed with a **SHA-256 hash** anchored to its generation timestamp,
  giving reviewers a way to detect tampering.

## Roadmap

- [ ] Multi-state code coverage (beyond Texas)
- [ ] Window, stair, and egress-path checks
- [ ] Server-side PDF generation (FPDF) for offline/capture-proof reports
- [ ] Auth + report history (currently stateless via signed session)

## License

© 2026 PlanPass. Built as a demo product — use at your own risk for informal
pre-review checks; always confirm against the official adopted code of your jurisdiction.