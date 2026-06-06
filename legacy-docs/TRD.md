# Technical Requirements Document (TRD)

## Version
v1.1

## Source of Truth
`visiting_card_scanner_developer_spec.html` is primary. This TRD selects concrete
technologies for the **MERN stack** and records decisions where the spec left options open.

## Stack Decision: MERN only
- **M**ongoDB · **E**xpress.js · **R**eact (Vite + TypeScript) · **N**ode.js
- **Next.js is not used.** The HTML spec listed React+Vite, Next.js, Vue, and SvelteKit as
  front-end options and Node, Python/FastAPI, and PHP/Laravel as backend options. The
  selected stack is **React + Vite + TypeScript** (front-end) and **Node + Express + TypeScript**
  (backend). The spec's Python/FastAPI suggestion for OCR-heavy work is **not adopted** for
  Phase 1; rationale below.

### Rationale for Node + Tesseract.js over Python/FastAPI
- Single language (TypeScript) across front-end and backend reduces team overhead for an MVP.
- Tesseract.js runs OCR in-process on a no-GPU VPS, matching the resource constraints.
- The OCR layer is provider-abstracted, so a Python/cloud OCR microservice can be added later
  (Future Scope) without changing controllers.
- **SaaS implication:** CPU-bound OCR in the Node process does not scale horizontally well.
  A queue + worker (and optionally a Python/cloud OCR service) is the documented scaling path
  (see BACKEND_ARCHITECTURE.md and DEPLOYMENT_ARCHITECTURE.md).

---

## Technology Stack

### Frontend
- React.js + Vite
- TypeScript (`.tsx` / `.ts`)
- Tailwind CSS
- Axios
- React Webcam
- React Router DOM

### Backend
- Node.js
- Express.js
- TypeScript (`.ts`) for controllers/services/models/routes; JavaScript (`.js`) allowed for
  config/utility scripts
- ts-node (development), `tsc` → `dist/` (production build)

### Database
- MongoDB
- Mongoose (with TypeScript interfaces)

### File Upload
- Multer

### OCR Engine
- Primary: Tesseract.js
- Future Scope (provider-abstracted): Google Vision API, AWS Textract

### PDF Processing
- pdf-to-img (converts PDF page to image for OCR). Phase 1 processes the **first page**.

### AI / Category Detection
- Primary: Groq API (`llama-3.1-8b-instant`) when `GROQ_API_KEY` is configured
- Fallback: keyword-based rule engine (no API key required)
- **Note:** Gemini is **not used** in Phase 1. `GEMINI_API_KEY` is removed from the required
  env set below to avoid an orphan variable.

### Export
- json2csv (CSV)
- exceljs (XLSX)
- vCard (optional; vCard 3.0, field mapping in API_DOCUMENTATION.md)

---

## Architecture (MERN)

```
React + Vite + TypeScript (SPA)
        |  Axios (REST, JSON)
        v
Express API (Node.js + TypeScript)
        v
OCR Service Layer (Tesseract default | Vision/Textract = Future Scope)
        v
Parser Service (Name / Email / Phone / Company / Address / Website / Designation)
        v
Enrichment Service (keyword analysis; domain/web fetch = Future Scope)
        v
Category Engine (Rule-based primary + Groq AI fallback)
        v
MongoDB (Mongoose + TypeScript interfaces)
```

Detailed module/layer responsibilities: see **BACKEND_ARCHITECTURE.md**.

---

## Processing Model (Decision — resolves sync/async ambiguity)
Phase 1 OCR runs **synchronously** inside `POST /api/scans`: the request stores the file,
runs OCR + parsing + category suggestion, and returns the `scan_id` with `status: completed`
(or `failed`). The `status` enum (`queued | processing | completed | failed`) and the
`GET /api/scans/:id/status` and `GET /api/scans/:id/result` endpoints are **retained** so the
client polling contract and the data model already match the asynchronous **queue + worker**
model planned for SaaS (**Future Scope**). This keeps the API stable across phases.

---

## API Endpoints (Phase 1)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/scans` | Upload image/PDF (or captured image); run OCR; return scan_id + status |
| GET | `/api/scans/:id/status` | Check processing status |
| GET | `/api/scans/:id/result` | Get OCR + structured extraction result |
| POST | `/api/contacts` | Save reviewed/corrected contact |
| GET | `/api/contacts` | List saved contacts (search/filter/pagination — see API doc) |
| GET | `/api/contacts/:id` | Get single contact |
| PUT | `/api/contacts/:id` | Update contact |
| DELETE | `/api/contacts/:id` | Delete contact |
| GET | `/api/categories` | List active categories |
| POST | `/api/categories/suggest` | Suggest category from extracted/enriched data |
| POST | `/api/exports` | Export contacts (CSV / XLSX / vCard) |
| GET | `/api/health` | Health check |
| GET | `/uploads/:file` | Static serving of uploaded card image (see SECURITY note) |

Full request/response contracts and error envelope: **API_DOCUMENTATION.md**.

### Future Scope endpoints (not Phase 1)
`POST/PUT/DELETE /api/categories` (admin category CRUD), reporting endpoints
(category/region/scan-quality/duplicate), export download by id, scan deletion, and
auth/API-key endpoints. Listed in API_DOCUMENTATION.md under Future Scope.

---

## Extraction TypeScript Interface

```ts
interface ExtractedCard {
  person_name: string;
  designation: string;
  company_name: string;
  phones: Array<{ type: string; value: string; country_code: string }>;
  emails: string[];
  website: string;
  address: {
    full_address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  social_links: string[];
  gstin_or_tax_id: string;
  raw_ocr_text: string;
  extraction_confidence: number;
  category: {
    suggested_category: string;
    confidence: number;
    reason: string;
    needs_review: boolean;
  };
  enrichment: {
    source: string;
    company_keywords: string[];
    company_summary: string;
  };
}
```

---

## Enrichment Scope (Decision)
- **Phase 1:** keyword extraction (company name, card text, email domain) + optional Groq AI
  on company name/keywords. `enrichment_logs.source_type` values used in Phase 1: `keyword`, `ai`.
- **Future Scope:** `domain` (homepage meta title/description fetch) and `web` (search-snippet)
  enrichment. If enabled later, it must respect provider terms and robots/policy constraints
  (spec §19).

---

## Performance Requirements
- VPS compatible, no GPU required
- Low memory and CPU utilization
- Max upload size: 10 MB
- Supported formats: JPG, JPEG, PNG, WebP, PDF
- Scan response target: **< 10 seconds per single-page card on the reference VPS**, measured
  after model warm-up (Tesseract.js worker initialized). Cold-start and multi-page are excluded
  from the target.

---

## Security Requirements (summary — full detail in SECURITY_REQUIREMENTS.md)
- File size and type validation (Multer + content checks)
- Input sanitization before DB storage; MongoDB operator-injection protection
- Rate limiting on scan endpoints (quantified in SECURITY_REQUIREMENTS.md)
- API keys for OCR/AI only on backend (never shipped to the client)
- Uploaded files not publicly listable; access controls per SECURITY_REQUIREMENTS.md
- TLS/HTTPS in production (Nginx + Let's Encrypt)
- CORS policy defined for the deployed front-end origin

---

## Deployment (summary — full detail in DEPLOYMENT_ARCHITECTURE.md)
- Ubuntu VPS
- Nginx (reverse proxy + TLS + static front-end)
- PM2 (Node process management)
- MongoDB (local or Atlas)

---

## Environment Variables

```
PORT=5000
MONGODB_URI=
OCR_PROVIDER=tesseract
GROQ_API_KEY=
# Optional Phase 1 config
SCAN_RETENTION_TTL_HOURS=
RATE_LIMIT_WINDOW_MS=
RATE_LIMIT_MAX=
CORS_ORIGIN=
```

> `GEMINI_API_KEY` was removed (no Gemini usage in Phase 1).

---

## TypeScript Configuration

### Backend (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

### Frontend
- Vite handles TypeScript compilation
- Strict mode enabled
- `.tsx` for React components, `.ts` for services/types/utils
