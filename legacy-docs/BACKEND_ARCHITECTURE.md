# Backend Architecture

## Version
v1.0

## Stack
Node.js + Express.js + TypeScript + MongoDB (Mongoose). Part of the **MERN** stack.
Next.js / Python-FastAPI / PHP-Laravel are **not** used in Phase 1.

> Source of truth: `visiting_card_scanner_developer_spec.html` §9 (Backend and Architecture).
> The backend is **API-first** so the same APIs serve the web app now and an Android app later
> (Future Scope). OCR, parsing, enrichment, category, export, and storage are **separate modules**.

---

## Layered Architecture

```
                    ┌─────────────────────────────┐
                    │  React + Vite SPA (client)   │
                    └──────────────┬──────────────┘
                                   │ REST / JSON (Axios)
                                   ▼
        ┌───────────────────────────────────────────────────┐
        │                 Express API Layer                  │
        │  routes → controllers → services                   │
        │  middleware: CORS, JSON, Multer, errorHandler,     │
        │              (rate-limit, sanitize — see SECURITY)  │
        └───────┬───────────────────────────────────┬────────┘
                │                                     │
                ▼                                     ▼
   ┌─────────────────────────┐         ┌────────────────────────────┐
   │   Processing Services    │         │     Persistence (Mongoose)  │
   │  • OCR (provider layer)  │         │  scans, contacts,           │
   │  • Parser                │         │  contact_phones/_emails,    │
   │  • Enrichment            │         │  categories,                │
   │  • Category Engine       │         │  contact_categories,        │
   │  • Export                │         │  enrichment_logs, exports   │
   └─────────────────────────┘         └────────────────────────────┘
                │
                ▼
   ┌─────────────────────────┐
   │  External (configurable) │
   │  • Tesseract.js (local)  │
   │  • Groq API (AI category)│
   │  • Vision/Textract — FS  │
   └─────────────────────────┘
```

---

## Folder Structure (actual)

```
backend/
├── src/
│   ├── app.ts                      # Express app, CORS, routes, /uploads static, seeding, boot
│   ├── config/
│   │   └── db.ts                   # MongoDB connection
│   ├── controllers/
│   │   ├── scan.controller.ts
│   │   ├── contact.controller.ts
│   │   ├── category.controller.ts
│   │   └── export.controller.ts
│   ├── routes/
│   │   ├── scan.routes.ts          # POST / ; GET /:id/status ; GET /:id/result
│   │   ├── contact.routes.ts       # POST / GET / GET/:id / PUT/:id / DELETE/:id
│   │   ├── category.routes.ts      # GET / ; POST /suggest
│   │   └── export.routes.ts        # POST /
│   ├── models/
│   │   ├── Scan.ts
│   │   ├── Contact.ts
│   │   ├── Category.ts
│   │   └── Export.ts
│   ├── services/
│   │   ├── ocr/
│   │   │   ├── index.ts            # provider router (OCR_PROVIDER)
│   │   │   ├── tesseract.ts        # active default
│   │   │   ├── googleVision.ts     # Future Scope (stub)
│   │   │   └── awsTextract.ts      # Future Scope (stub)
│   │   ├── parser.service.ts
│   │   ├── enrichment.service.ts
│   │   └── category.service.ts
│   ├── middleware/
│   │   ├── upload.ts               # Multer
│   │   └── errorHandler.ts         # standard error envelope
│   ├── utils/
│   │   └── normalizer.ts
│   └── types/
│       └── index.ts                # ExtractedCard and shared interfaces
├── uploads/                        # stored card files (served at /uploads)
├── dist/                           # tsc build output (production)
├── .env
├── tsconfig.json
└── package.json
```

> Note: the repository also contains a legacy JavaScript backend (e.g. `backend/app.js`,
> `backend/controllers`, `backend/services`). The **canonical Phase 1 backend is the
> TypeScript app under `backend/src/`** described above. (Documentation only — no code change.)

---

## Module Responsibilities

| Module | Responsibility |
|---|---|
| `app.ts` | App wiring, middleware, route mounting, `/uploads` static, health check, category seeding on first boot, server start |
| OCR provider layer | Select provider via `OCR_PROVIDER`; return raw text + confidence. PDF → first-page image via pdf-to-img |
| Parser service | Convert raw OCR text into the `ExtractedCard` structure (name, phones, emails, company, website, designation, address, social, GSTIN) |
| Normalizer | Phone formatting + country code, email lowercase, dedupe of phones/emails, address cleanup |
| Enrichment service | Keyword extraction from company/card/email-domain; log to `enrichment_logs` (Phase 1: `keyword`, `ai`) |
| Category engine | Rule-based keyword match first; Groq AI fallback; output category + confidence + reason + needs_review |
| Contact module | CRUD + duplicate detection (email/phone lookup, non-unique) |
| Export module | CSV (json2csv), XLSX (exceljs), vCard (optional) |

---

## Request Lifecycle: `POST /api/scans` (Phase 1, synchronous)

```
1. Multer stores the uploaded file → uploads/
2. Create Scan { input_type, file_path, status: "processing" }
3. If PDF → pdf-to-img converts FIRST page → temp PNG
4. OCR provider extracts raw text (+confidence)
5. Parser builds ExtractedCard; Normalizer cleans fields
6. Enrichment + Category engine assign category (+confidence, reason, needs_review)
7. Update Scan { status: "completed", processedAt }  (or "failed" + error_message)
8. Respond { scan_id, status }
```

`GET /api/scans/:id/status` and `/result` read this record. The status enum and polling
endpoints are kept so the contract is identical when the **async queue + worker** model is
introduced for SaaS (**Future Scope**).

---

## Provider Abstraction (OCR)

```
OCR_PROVIDER=tesseract        # env var selects the provider

scan.controller → services/ocr/index.ts (router)
                      ├── tesseract.ts     ← active default
                      ├── googleVision.ts  ← Future Scope
                      └── awsTextract.ts   ← Future Scope
```

Switching providers is an env change with zero controller changes.

---

## Cross-Cutting Concerns
- **Error handling:** centralized `errorHandler` returns a standard envelope (see API_DOCUMENTATION.md).
- **Validation/sanitization:** request validation + Mongo operator-injection protection (see SECURITY_REQUIREMENTS.md).
- **Rate limiting:** applied to scan/export endpoints (quantified in SECURITY_REQUIREMENTS.md).
- **Config:** all secrets/keys via environment variables, backend-only.
- **Static files:** card images served from `/uploads`; production access controls in SECURITY_REQUIREMENTS.md.

---

## Scalability Path (Future Scope — SaaS)
- Replace synchronous OCR with a **queue + worker** (e.g., BullMQ/Redis) so the API stays responsive.
- Move file storage from local `uploads/` to **object storage** (S3/GCS) for multi-instance deploys.
- Optionally run OCR as a separate **microservice** (the spec's Python/cloud-OCR suggestion).
- Add **tenant scoping** (`user_id`/`workspace_id`) to every query, plus auth + API keys.
- Add caching (e.g., Redis) for categories/enrichment.
