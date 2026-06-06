# Application Flow Document

## Version
v1.1 — MERN stack (React + Vite + TypeScript / Node + Express / MongoDB)

> Source of truth: `visiting_card_scanner_developer_spec.html`. This document describes the
> Phase 1 runtime flows. Asynchronous queue/worker processing is **Future Scope (SaaS)**;
> Phase 1 OCR runs synchronously inside `POST /api/scans` (see TRD §Processing Model).

---

## Primary User Flow

```
User Opens Application (React SPA)
        ↓
Landing Page
        ↓
Choose Input Method
   ├── Upload Image/PDF
   └── Camera Capture
        ↓
File Validation (type, size, page count, corruption check)
        ↓
Image Pre-processing (de-skew, rotate, contrast, grayscale — see note)
        ↓
OCR Processing (Tesseract.js)
        ↓
Raw Text Extraction
        ↓
Parse Structured Fields
(Name, Designation, Email, Phone, Company, Website, Address, Social Links, GSTIN)
        ↓
Company Enrichment (keyword analysis + Groq AI when configured)
        ↓
Category Detection (rule-based → Groq AI fallback → confidence + reason)
        ↓
Show Editable Review Form
        ↓
User Reviews / Edits Fields
        ↓
Save to MongoDB
        ↓
Export CSV / XLSX / vCard  OR  View Records  OR  Scan Another
```

> **Pre-processing note:** The spec requires crop, de-skew, rotate, contrast, grayscale, and
> noise reduction. Phase 1 scope: client-side crop/rotate (during camera capture) plus
> Tesseract.js's built-in grayscale/threshold handling. Server-side perspective correction and
> denoise (e.g., via an image library) are **Future Scope** and should be recorded as such if
> not implemented.

---

## Upload Flow

```
User selects file (drag-drop or file picker)
        ↓
Frontend validates: type (JPG/PNG/WebP/PDF), size (≤10MB)
        ↓
POST /api/scans (multipart/form-data, field "file")
        ↓
Backend (Multer) stores file in uploads/
        ↓
If PDF → pdf-to-img converts FIRST page to PNG (multi-page = Future Scope)
        ↓
OCR Service processes image (synchronous in Phase 1)
        ↓
Parser + Category suggestion run
        ↓
Response: { scan_id, status: "completed" }  (or status "failed")
        ↓
Frontend may poll GET /api/scans/:id/status (contract preserved for SaaS async)
        ↓
GET /api/scans/:id/result → structured ExtractedCard
        ↓
Show Review Form
```

---

## Camera Flow

```
User clicks "Open Camera"
        ↓
Browser requests camera permission
        ↓
If denied → show message + fallback to upload
        ↓
Camera preview opens (react-webcam)
        ↓
User captures image → Preview → Retake or Use Photo
        ↓
Convert screenshot to Blob/File
        ↓
Same as Upload Flow from POST /api/scans
```

---

## Category Detection Flow

```
Extracted company name + card keywords
        ↓
Step 1: Keyword rule engine (match against category dictionary)
        ↓
Match found?
   ├── YES → return category + confidence + reason (source: "rule")
   └── NO  → Step 2: Groq AI (if GROQ_API_KEY configured)
                ↓
             Send company name + keywords to Groq
                ↓
             Parse AI response
                ↓
             confidence ≥ threshold (default 0.5)?
                ├── YES → return suggested category (source: "ai")
                └── NO  → "Uncategorized" + needs_review: true
        ↓
   (If Groq not configured and no rule match → "Uncategorized" + needs_review: true)
```

---

## Save Flow

```
User clicks Save
        ↓
Frontend validates required field (Name)
        ↓
POST /api/contacts (all fields + category)
        ↓
Backend checks duplicate (email OR phone — lookup, non-unique)
        ↓
Duplicate found?
   ├── YES → warn user → merge or keep both (see Merge note)
   └── NO  → insert into MongoDB
        ↓
Return saved contact
        ↓
Redirect to Export screen or Records
```

> **Merge note:** "Keep both" must remain possible, so emails/phones are **not** uniquely
> constrained at the DB level (see DATABASE_SCHEMA.md). Field-level merge precedence is a
> documented behavior (newest non-empty value wins unless the user picks otherwise); detailed
> merge UI is Phase 2.

---

## Export Flow

```
User clicks Export (CSV / XLSX / vCard)
        ↓
POST /api/exports { format, contact_ids? }
        ↓
Backend generates file (json2csv / exceljs / vCard)
        ↓
Return file (download response or served path under /uploads or /exports)
        ↓
Frontend triggers download
```

---

## Records Flow

```
User opens Saved Records
        ↓
GET /api/contacts?search=&category=&page=&limit=
        ↓
Render table (Name | Company | Category | Email | Phone | Date)
        ↓
Row actions: View (modal) | Edit (PUT) | Delete (DELETE)
        ↓
Bulk select → Export Selected (POST /api/exports with contact_ids)
```

---

## Error Flows

| Scenario | Handling |
|---|---|
| Invalid file type | Show inline error, do not upload |
| File too large | Show inline error (max 10MB) |
| No camera available | Show message + switch to upload |
| Camera permission denied | Explain how to allow + show upload |
| OCR fails / low confidence | Show retry option + allow manual entry; store failure reason |
| Poor image quality | "Please upload a clearer image" |
| Multi-page PDF | Process first page (Phase 1); page selector = Future Scope |
| Duplicate contact | Warn user, offer merge or keep both |
| Category confidence low | Show manual dropdown, mark Uncategorized |
| Network error | Show retry button |
| Server/processing error | Standard error envelope (see API_DOCUMENTATION.md) |
