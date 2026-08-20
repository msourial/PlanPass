# PlanPass TDD Evidence Report

Task: Rename BuildSat → PlanPass, fix broken compliance flow, clean up UI, prove functionality.

## User journeys

- As a user, I want to upload an IFC model and a Texas zip code, so that I get a door-compliance report.
- As a user, I want to demo the tool without preparing my own files, so that I can evaluate it quickly.
- As a user, I want to trust the report, so that I can use it to fix non-compliant doors before plan review.

## Bug fixes verified by tests

| # | Guarantee | Test | Type | Result |
|---|-----------|------|------|--------|
| 1 | IFC meter widths are converted to inches before comparison (0.9144m → 36", passes 32" minimum) | `tests/test_ifc_processor.py::TestCheckDoorCompliance::test_meter_widths_are_converted_before_comparison` | unit | PASS |
| 2 | Sample building scores exactly 40% (2/5 doors compliant) end-to-end | `tests/test_app.py::TestUpload::test_upload_sample_ifc_scores_40_percent` | integration | PASS |
| 3 | Missing width → non-compliant with clear message | `test_missing_width_is_non_compliant_with_message` | unit | PASS |
| 4 | 32" boundary is compliant; custom min-width honored | `test_exact_boundary_width_is_compliant`, `test_custom_minimum_width_from_code` | unit | PASS |
| 5 | Texas zip validation (range, format, known cities) | `tests/test_texas_building_codes.py` | unit | PASS |
| 6 | Report hash is SHA-256, anchored to generation time | `tests/test_utils.py::TestGenerateReportHash` | unit | PASS |
| 7 | Building-code source is passed through (default vs jurisdiction) — regression caught during RED | `test_unknown_valid_zip_uses_state_default` | integration | PASS |
| 8 | Browser flow: sample model → report panel with 40% score, 5/2/3 door stats, 3 non-compliant rows, hash | `tests/e2e/test_planpass_flow.py::test_sample_model_flow_produces_report` | e2e | PASS |
| 9 | Viewer controls: filter non-compliant (3), reset (5), focus door from report | `test_door_focus_and_filter_controls` | e2e | PASS |
| 10 | PDF report button enabled after analysis | `test_pdf_download_button_available` | e2e | PASS |

## Validation commands

```bash
.venv/bin/python -m pytest tests/            # 51 passed
.venv/bin/python -m pytest tests/e2e -q     # 4 passed (Playwright, headless Chromium)
.venv/bin/python -m pytest --cov=ifc_processor --cov=texas_building_codes --cov=utils --cov=app  # 81% line coverage
curl -X POST localhost:5000/upload -F ifc_file=@static/sample_building.ifc -F zip_code=77001  # compliance_score 40.0
```

## RED → GREEN notes

- RED (unit): meter-vs-inch comparison failed for sample doors (0.9144m < 32 → all fail). Fixed by `meters_to_inches()` in `ifc_processor.py`.
- RED (unit): building-code `source` was hardcoded as "Texas Building Code", losing default-vs-jurisdiction distinction. Fixed in `check_door_compliance` to pass `building_codes.get("source")`.
- RED (e2e): original app crashed in `viewer.js` (`viewerContainer` ReferenceError) so the report never rendered after upload. Fixed by rewriting `viewer.js` as a 2D SVG viewer with no undeclared globals.

## Known gaps

- `ai_analyzer.py` (Claude PDF extraction) is not unit-tested; it requires an API key and falls back to defaults. Covered implicitly via default-path tests.
- No coverage threshold enforced in CI yet; add `--cov-fail-under=80` when CI is set up.