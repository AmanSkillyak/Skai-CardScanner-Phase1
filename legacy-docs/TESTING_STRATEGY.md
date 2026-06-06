# Testing Strategy

## Version
v1.0

## Scope
Phase 1 MERN application (React + Vite + TypeScript front-end; Node + Express + TypeScript
backend; MongoDB). This document fills the testing gap identified in the documentation audit
(the spec lists acceptance criteria but no test plan). SaaS-specific testing is **Future Scope**.

> Source of truth: `visiting_card_scanner_developer_spec.html` §18 (Acceptance Criteria) and
> Appendix A (User Stories).

---

## Test Levels & Tools

| Level | Target | Tools (recommended) |
|---|---|---|
| Unit | Parser regexes, normalizer, category rule engine, utils | Jest (backend), Vitest (frontend) |
| Integration | Express routes + services + MongoDB | Jest + Supertest + mongodb-memory-server |
| Component | React components (forms, upload, camera, records) | Vitest + React Testing Library |
| End-to-end | Full user flows in a browser | Playwright or Cypress |
| Performance | OCR latency, rate limits | autocannon / k6 (lightweight) |

> Tooling is a recommendation consistent with the MERN stack; the team may standardize on Jest
> across both sides. No tool choice contradicts the spec.

---

## Unit Tests (backend)

- **Parser service**
  - Email: single/multiple, lowercased, valid formats; ignores non-emails
  - Phone: `+91` and bare 10-digit, multiple numbers, country-code normalization
  - Website: with/without scheme/`www`; derive from email domain when missing
  - Company: keyword match (Ltd/Pvt/Inc/LLP) → email-domain fallback
  - Name: first clean line, OCR-noise prefixes stripped
  - Designation: known title keywords
  - Address: city/state/PIN/country patterns
- **Normalizer**: phone formatting, email lowercase, duplicate phone/email cleanup, address cleanup
- **Category rule engine**: keyword → category mapping, ranking, threshold (default 0.5),
  "Uncategorized" + `needs_review` when below threshold

These are deterministic and form the regression backbone for the brittle regex logic.

---

## Integration Tests (backend)

Use an in-memory MongoDB so tests are isolated and fast.

- `GET /api/health` → `{ status: "ok" }`
- `POST /api/scans` with a sample image → `201` + `scan_id` + `status`
- `GET /api/scans/:id/status` and `/result` → structured `ExtractedCard`
- `POST /api/contacts` → `201`; duplicate email/phone → duplicate-warning response
- `GET /api/contacts?search=&category=&page=&limit=` → paginated shape
- `GET/PUT/DELETE /api/contacts/:id` → success + `404` paths
- `GET /api/categories` → seeded list; `POST /api/categories/suggest` → ranked result
- `POST /api/exports` (csv/xlsx) → file/record_count
- Error envelope shape for `400/404/413/415/429/500`

Mock external providers (Groq, and any Future-Scope OCR cloud) so tests are offline and
deterministic.

---

## Component Tests (frontend)

- UploadCard: accepts allowed types, rejects bad type/oversize with inline error
- CameraCapture: permission-denied fallback to upload; capture → preview → retake
- ProcessingSteps: renders staged progress
- CardForm: all fields editable; required-name validation; confidence indicators render
- CategorySelector: shows suggestion + reason; manual override; forces choice when low confidence
- Records: search/filter/pagination; row actions; bulk select → export

---

## End-to-End Scenarios

1. Upload image → review → edit a field → save → see in records → export CSV.
2. Camera capture (mocked stream) → review → save.
3. Upload unsupported file → inline error, no upload.
4. Upload multi-page PDF → first page processed (Phase 1).
5. Low-confidence category → Uncategorized + manual dropdown required.
6. Duplicate on save → warning → keep both → two records exist.

---

## Acceptance Criteria Traceability Matrix

| # | Acceptance Criterion (Spec §18) | Test(s) |
|---|---|---|
| 1 | Scan via camera on supported devices | E2E #2; CameraCapture component |
| 2 | Upload image and PDF | E2E #1, #4; UploadCard component |
| 3 | Extract name/phone/email/company/address when visible | Parser unit; scan integration |
| 4 | Edit every field before save/export | CardForm component; E2E #1 |
| 5 | Category suggested with confidence + reason | Category unit; suggest integration |
| 6 | Low confidence → Uncategorized / prompt | Category unit; E2E #5 |
| 7 | Export CSV and XLSX | Export integration; E2E #1 |
| 8 | Handle no-camera/poor-image/bad-file/OCR-fail/multi-page | E2E #3, #4; error-path integration |
| 9 | APIs documented & Android-reusable | API contract tests vs API_DOCUMENTATION.md |
| 10 | Modular code (OCR/parser/enrichment/category/export/storage) | Unit tests per module |

User stories (Appendix A) map onto E2E #1–#6 and the category tests.

---

## Test Data
- A small **golden dataset** of sample cards (clear, noisy, multi-language, missing-company,
  multi-phone/email) stored as fixtures.
- Expected-extraction JSON per fixture to assert parser output and catch regressions.
- OCR accuracy is measured against this set; set an initial **target field-accuracy bar**
  (e.g., ≥ 80% on the clear-card subset) and track over time.

---

## Performance Testing
- Validate the **< 10s per single-page card** target after worker warm-up on the reference VPS.
- Validate rate limiting returns `429` beyond `RATE_LIMIT_MAX`.
- Record cold-start time separately (excluded from the target).

---

## CI Recommendation
- Run unit + integration + component tests on every push/PR.
- Block merge on failing tests and TypeScript build (`tsc --noEmit`).
- E2E and performance runs on a nightly or pre-release schedule.
- See DEPLOYMENT_ARCHITECTURE.md for the CI/CD outline.

---

## Future Scope Testing
- Auth, multi-tenant isolation, API-key scoping, plan/usage-limit enforcement.
- Async queue/worker OCR correctness and retry behavior.
- Cloud OCR providers (Vision/Textract) contract tests.
