# Implementation Plan

## Version
v1.1

## Stack: MERN + TypeScript
**MongoDB · Express.js · React (Vite + TypeScript) · Node.js.** Next.js is **not** used.

> Source of truth: `visiting_card_scanner_developer_spec.html`. Timeline is indicative.
> SaaS items are **Future Scope**.

## Timeline: 7 Days (indicative)

---

## PHASE 1 — Project Setup (Day 1)

### Backend
- Initialize Node.js + TypeScript project (`tsconfig.json`, `ts-node`)
- Setup Express app (`src/app.ts`) with CORS + JSON body parsing
- Connect MongoDB (`src/config/db.ts`)
- Configure Multer middleware (`src/middleware/upload.ts`)
- Setup error handler middleware (`src/middleware/errorHandler.ts`) with standard error envelope
- Create TypeScript interfaces (`src/types/index.ts`)
- Configure `.env` (PORT, MONGODB_URI, OCR_PROVIDER, GROQ_API_KEY, CORS_ORIGIN, retention/rate-limit)
- Health check endpoint `GET /api/health`
- Static serving for `/uploads`

### Frontend
- Initialize React + Vite + TypeScript project
- Install: Tailwind CSS, Axios, React Router DOM, React Webcam
- Setup `vite.config.ts` with API proxy
- Setup base layout, Navbar, routing (`App.tsx`)
- Create TypeScript types (`src/types/index.ts`)

**Milestone:** App runs locally, health check passes, DB connects.

---

## PHASE 2 — OCR Pipeline (Day 2)

### Backend
- Build OCR provider layer (`src/services/ocr/index.ts`) selected by `OCR_PROVIDER`
- Implement Tesseract.js provider (`src/services/ocr/tesseract.ts`)
  - Handle images directly
  - Handle PDF: convert **first page** via `pdf-to-img` → temp PNG → OCR → cleanup
- Stub Google Vision + AWS Textract providers (**Future Scope**)
- Create Scan model (`src/models/Scan.ts`)
- Implement scan controller + routes:
  - `POST /api/scans` — upload, store file, run OCR (synchronous Phase 1), return scan_id + status
  - `GET /api/scans/:id/status` — poll status (contract preserved for SaaS async)
  - `GET /api/scans/:id/result` — return raw OCR text + structured result

**Milestone:** Upload a card image/PDF → raw OCR text returned.

---

## PHASE 3 — Data Parsing (Day 3)

### Backend
- Build parser service (`src/services/parser.service.ts`):
  - Email extraction (regex, multiple, lowercase)
  - Phone extraction (regex, normalize country code, multiple)
  - Company extraction (keyword match Ltd/Pvt/Inc/LLP → email-domain fallback)
  - Name extraction (first clean line, strip OCR noise prefixes)
  - Website extraction (regex; derive from email domain if missing)
  - Designation extraction (title keyword matching)
  - Address extraction (city/state/PIN/country patterns)
- Build normalizer utility (`src/utils/normalizer.ts`) — phone format, email lowercase,
  duplicate phone/email cleanup, address cleanup (rules listed in TRD/API doc)
- Return structured `ExtractedCard` TypeScript object

**Milestone:** Raw OCR text → structured JSON with all fields populated.

---

## PHASE 4 — Enrichment + Category Detection (Day 4)

### Backend
- Build enrichment service (`src/services/enrichment.service.ts`):
  - Extract keywords from company name, card text, email domain (Phase 1 sources: `keyword`, `ai`)
  - Domain/web fetch = **Future Scope**
- Build category service (`src/services/category.service.ts`):
  - Rule-based keyword match (primary, instant)
  - Groq AI fallback (`llama-3.1-8b-instant`) when `GROQ_API_KEY` set and no rule match
  - Return: `suggested_category`, `confidence`, `reason`, `needs_review`
  - Threshold default 0.5 → below = "Uncategorized"
- Create Category model + seed default categories on first start
- Implement category routes:
  - `GET /api/categories`
  - `POST /api/categories/suggest`

**Milestone:** Company name → category with confidence score and reason.

---

## PHASE 5 — Frontend: Scan + Review (Day 5)

### Frontend
- Build `UploadCard.tsx` — drag-and-drop file upload with validation
- Build `CameraCapture.tsx` — webcam modal with capture/retake + client crop/rotate
- Build `ProcessingSteps.tsx` — animated progress steps
- Build `ScanCard.tsx` page — orchestrates upload/camera → processing → review
- Build `CardForm.tsx` — editable review form with all fields + confidence indicators
- Build `CategorySelector.tsx` — suggested category + manual dropdown
- Wire up `api.ts` service (Axios calls to all endpoints)

**Milestone:** Upload/capture card → OCR → editable form with category suggestion.

---

## PHASE 6 — Save, Records, Export (Day 6)

### Backend
- Create Contact, ContactPhone, ContactEmail models (non-unique email/phone indexes)
- Implement contact controller + routes (all CRUD)
- Implement duplicate detection (email OR phone lookup → warn → merge/keep both)
- Add query params to `GET /api/contacts` (search, category, page, limit) + paginated response
- Build export service:
  - CSV via `json2csv`
  - XLSX via `exceljs`
  - vCard (optional, vCard 3.0)
- Implement export route `POST /api/exports`

### Frontend
- Build `Records.tsx` page — table with search, filter by category, pagination
- Build `RecordDetailsModal.tsx` — full contact view with original card image
- Build `Export.tsx` — export buttons (CSV / XLSX / vCard)
- Inline edit in records table
- Duplicate warning UI

**Milestone:** Save card → view in records → export CSV/XLSX.

---

## PHASE 7 — Testing, Hardening, Deployment (Day 7)

### Testing (see TESTING_STRATEGY.md)
- Unit tests: parser regexes, normalizer, category rule engine
- Integration tests: scan → result, contact CRUD, export (Jest + Supertest)
- Acceptance-criteria traceability check
- Frontend component smoke tests (Vitest + React Testing Library)

### Backend hardening (see SECURITY_REQUIREMENTS.md)
- Rate limiting middleware (quantified limits)
- Input sanitization + Mongo operator-injection protection
- Edge cases: invalid file type/size, OCR failure, multi-page PDF (first page),
  missing company name, low category confidence, duplicate contact
- Compile TypeScript to `dist/` (`tsc`)

### Frontend
- Handle all error states with user-friendly messages
- Loading states on all async actions
- Mobile responsiveness check
- Camera permission denied handling

### Deployment (see DEPLOYMENT_ARCHITECTURE.md)
- Ubuntu VPS: Node.js, MongoDB, PM2, Nginx
- Nginx reverse proxy + TLS (Let's Encrypt) + `client_max_body_size` > 10MB + proxy timeouts
- Start backend with PM2 (ecosystem config)
- Build frontend (`npm run build`) → serve via Nginx
- Set all environment variables; configure MongoDB backups

**Milestone:** App live on VPS, all flows tested end-to-end.

---

## Deliverables
- React + TypeScript frontend (Vite)
- Node.js + TypeScript backend (Express)
- MongoDB database with all Phase 1 collections
- OCR pipeline (Tesseract.js + first-page PDF support)
- Parser service (all fields)
- Enrichment + Category engine (rules + Groq AI)
- CRUD APIs (contacts, scans, categories, exports) + documented contracts
- CSV + XLSX export (vCard optional)
- Test suite (unit + integration) and traceability matrix
- VPS deployment (Nginx + PM2 + TLS)
- TypeScript types/interfaces for all models and API responses

---

## Future Scope (not in 7-day Phase 1)
- Admin category CRUD endpoints + Admin Settings UI (Phase 2)
- Reporting endpoints (category/region/scan-quality/duplicate)
- Multi-page PDF page selector / all-pages-as-cards
- Website/search enrichment (`domain`, `web` sources)
- Auth, workspaces, billing, API keys, CRM integrations, Android app (SaaS)
- Async queue + worker OCR; object storage; horizontal scaling

---

## Difficulty

| Area | Difficulty |
|---|---|
| Frontend | Easy |
| Backend | Easy |
| TypeScript setup | Easy |
| OCR Integration | Medium |
| Data Parsing | Medium |
| Category Detection | Easy |
| Export | Easy |
| Testing | Medium |
| Deployment | Easy |
| **Overall** | **6/10** |

**Estimated Time:** 5–7 Days (excluding Future Scope items)
