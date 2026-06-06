# User Flow Document

## Version
v1.0

## Stack
MERN (React + Vite + TypeScript front-end). Next.js is **not** used.

> Source of truth: `visiting_card_scanner_developer_spec.html` §4 (Core User Flow) and
> Appendix A (User Stories). This document focuses on the **user's perspective** (decisions,
> screens, outcomes). For system/data flows see APPLICATION_FLOW.md.

---

## Personas (Phase 1)

| Persona | Description | Goal |
|---|---|---|
| Guest User | Public visitor, no login | Convert a card into structured, exportable contact data quickly |
| Admin/Operator (optional) | Internal maintainer | Review failed scans, maintain categories (Phase 2 UI) |

SaaS personas (Registered User, Team Admin, Developer/API User) are **Future Scope**.

---

## End-to-End Journey (Guest User)

```
Landing Page
   │
   ├─ "Scan via Camera"  ─────────────┐
   │                                   │
   └─ "Upload Image/PDF" ──────────┐   │
                                    ▼   ▼
                          File selected / photo captured
                                    │
                                    ▼
                         Validation feedback (inline)
                                    │
                          valid? ──no──► fix & retry
                                    │ yes
                                    ▼
                            Processing screen
                  (Uploading → OCR → Extract → Enrich → Categorize)
                                    │
                                    ▼
                          Review Extracted Data
                  (edit any field, see confidence + category reason)
                                    │
                       ┌────────────┼─────────────┐
                       ▼            ▼              ▼
                    Save        Export now     Scan Another
                       │            │
                       ▼            ▼
              Duplicate check   CSV / XLSX / vCard download
              (warn → merge /
               keep both)
                       │
                       ▼
                Saved Records (view / edit / delete / export)
```

---

## Step-by-Step

### 1. Choose input method
- User lands on the home screen and picks **Camera** or **Upload**.
- If camera is unavailable or permission is denied, the UI explains and offers upload.

### 2. Provide the card
- **Camera:** preview → capture → retake or use photo → optional crop/rotate.
- **Upload:** drag-and-drop or file picker. Supported: JPG, JPEG, PNG, WebP, PDF (≤10MB).
- Invalid type/size → inline error, no upload.

### 3. Processing
- The user sees staged progress (Uploading → OCR → Extracting → Enriching → Categorizing).
- On failure, the user can retry or switch to manual entry.

### 4. Review & correct
- All extracted fields are editable.
- Per-field confidence indicators highlight what to double-check.
- The suggested category is shown with confidence and a human-readable reason.
- The user can override the category at any time; low confidence prompts a manual choice.

### 5. Save or export
- **Save:** Name is required. On duplicate (email or phone), the user is warned and chooses
  **merge** or **keep both**.
- **Export:** CSV, XLSX, or vCard — available before or after saving.
- **Scan Another:** returns to the input step.

### 6. Manage records
- In Saved Records the user can search, filter by category, paginate, view details (with the
  original card image), edit inline, delete, and bulk-export selected contacts.

---

## User Stories → Acceptance (from Spec Appendix A)

| User Story | Acceptance |
|---|---|
| As a guest, I scan a card with my camera to extract details quickly. | Camera opens, capture works, image is processed. |
| As a guest, I upload a PDF/image to process cards on my device. | Upload validates and processes supported files. |
| As a user, I correct extracted info before export. | Editable review form is available; all fields editable. |
| As a user, I get a suggested business category. | Category suggestion appears with confidence + reason. |
| As an admin, I manage categories and keywords. | Category management exists (Phase 2 UI; seeded in Phase 1). |
| As a future SaaS user, I keep saved scan history. | Architecture supports user/workspace ownership (**Future Scope**). |

---

## Decision Points & Outcomes

| Decision | Yes | No |
|---|---|---|
| Camera available & permitted? | Open camera | Show upload fallback + message |
| File valid (type/size)? | Continue to processing | Inline error, retry |
| OCR succeeded? | Show review form | Retry or manual entry |
| Category confidence ≥ threshold? | Show suggested category | Mark Uncategorized + manual dropdown |
| Duplicate on save? | Warn → merge / keep both | Insert new record |

---

## Future Scope Journeys
- Login, saved personal/team history, workspace switching (SaaS).
- Batch scanning and multi-page-PDF-as-multiple-cards.
- Scanning via API with an API key (Developer/API User).
- Android app journey using the same backend APIs.
