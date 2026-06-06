# PROJECT: Visiting Card Scanner Portal

## Stack: MERN + TypeScript + JavaScript

---

## 1. PROJECT OVERVIEW

### Goal
Build a web portal that allows users to scan visiting/business cards and automatically extract, enrich, and categorize contact information.

### Scan Options
1. Upload Image (JPG, JPEG, PNG, WebP)
2. Upload PDF (multi-page supported)
3. Open Camera and Capture Photo

### System Functionality
- Extract text from card using OCR (Tesseract.js)
- Parse structured fields: Name, Designation, Email, Phone, Company, Website, Address, Social Links, GSTIN
- Enrich company info using keyword analysis and Groq AI
- Suggest industry category with confidence score and reason
- Allow user to review and edit all fields before saving
- Save final data to MongoDB
- Export as CSV / XLSX / vCard

### Authentication
- No login required for Phase 1

---

## 2. TECH STACK

### Frontend
- React.js + Vite
- TypeScript (.tsx / .ts)
- Tailwind CSS
- Axios
- React Webcam
- React Router DOM

### Backend
- Node.js + Express.js
- TypeScript (.ts) for controllers, services, models, routes
- JavaScript (.js) for config scripts and utility helpers
- ts-node (dev), tsc → dist/ (production)

### Database
- MongoDB + Mongoose
- TypeScript interfaces for all models

### OCR
- Tesseract.js (default)
- pdf-to-img (PDF → image conversion before OCR)
- Pluggable: Google Vision API / AWS Textract (future)

### AI / Category Detection
- Groq API — llama-3.1-8b-instant (primary)
- Keyword rule engine (fallback, no API needed)

### Export
- json2csv (CSV)
- exceljs (XLSX)

### Deployment
- Ubuntu VPS, Nginx, PM2

---

## 3. COMPLETE USER FLOW

```
User Opens Website
        ↓
Choose: Upload Image/PDF  OR  Camera Capture
        ↓
File Validation (type, size, page count)
        ↓
Image Pre-processing (de-skew, contrast, rotate)
        ↓
OCR Processing (Tesseract.js)
        ↓
Raw Text Extraction
        ↓
Parse Structured Fields
(Name, Designation, Email, Phone, Company, Website, Address, Social Links)
        ↓
Company Enrichment + Category Detection (Groq AI + keyword rules)
        ↓
Show Editable Review Form (with confidence indicators)
        ↓
User Reviews / Edits Data
        ↓
Save to MongoDB
        ↓
Export CSV / XLSX / vCard  OR  Scan Another Card
```

---

## 4. FRONTEND SCREENS

### Screen 1: Landing / Scan Card
- Upload Image/PDF button (drag-and-drop)
- Open Camera button
- Privacy note
- Supported formats notice

### Screen 2: Processing
- Progress steps: Uploading → OCR → Extracting Fields → Enriching → Categorizing

### Screen 3: Review Extracted Data
- Editable fields: Name, Designation, Email, Phone, Company, Website, Address, Social Links, GSTIN
- Confidence indicators per field
- Raw OCR text toggle
- Category suggestion with confidence + reason + manual dropdown

### Screen 4: Result / Export
- Final card preview
- Export CSV / XLSX / vCard buttons
- Save to records button
- Scan another card button

### Screen 5: Saved Records
- Table: Name | Company | Category | Email | Phone | Date
- Search / filter
- View / Edit / Delete actions
- Bulk export

---

## 5. DATABASE SCHEMA

### Collection: scans
```ts
{
  _id: ObjectId,
  user_id: ObjectId | null,         // nullable for SaaS future
  workspace_id: ObjectId | null,    // nullable for SaaS future
  input_type: 'camera' | 'image' | 'pdf',
  file_path: string,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  error_message: string,
  createdAt: Date,
  processedAt: Date
}
```

### Collection: contacts
```ts
{
  _id: ObjectId,
  scan_id: ObjectId,
  person_name: string,
  designation: string,
  company_name: string,
  website: string,
  address: {
    full_address: string,
    city: string,
    state: string,
    postal_code: string,
    country: string
  },
  social_links: string[],
  gstin_or_tax_id: string,
  raw_ocr_text: string,
  extraction_confidence: number,
  cardImage: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: contact_phones
```ts
{ _id, contact_id, type, number, country_code }
```

### Collection: contact_emails
```ts
{ _id, contact_id, email }
```

### Collection: categories
```ts
{ _id, name, parent_id, keywords: string[], is_active: boolean }
```

### Collection: contact_categories
```ts
{ _id, contact_id, category_id, confidence, reason, source, is_user_confirmed }
```

### Collection: enrichment_logs
```ts
{ _id, contact_id, source_type, source_url, summary, keywords: string[], createdAt }
```

### Collection: exports
```ts
{ _id, user_id | null, format, file_path, record_count, createdAt }
```

---

## 6. BACKEND FOLDER STRUCTURE

```
backend/
├── src/
│   ├── controllers/
│   │   ├── scan.controller.ts
│   │   ├── contact.controller.ts
│   │   ├── category.controller.ts
│   │   └── export.controller.ts
│   ├── routes/
│   │   ├── scan.routes.ts
│   │   ├── contact.routes.ts
│   │   ├── category.routes.ts
│   │   └── export.routes.ts
│   ├── models/
│   │   ├── Scan.ts
│   │   ├── Contact.ts
│   │   ├── Category.ts
│   │   └── Export.ts
│   ├── services/
│   │   ├── ocr/
│   │   │   ├── index.ts
│   │   │   ├── tesseract.ts
│   │   │   ├── googleVision.ts
│   │   │   └── awsTextract.ts
│   │   ├── parser.service.ts
│   │   ├── enrichment.service.ts
│   │   └── category.service.ts
│   ├── middleware/
│   │   ├── upload.ts
│   │   └── errorHandler.ts
│   ├── utils/
│   │   └── normalizer.ts
│   ├── config/
│   │   └── db.ts
│   ├── types/
│   │   └── index.ts
│   └── app.ts
├── uploads/
├── dist/
├── .env
├── tsconfig.json
└── package.json
```

---

## 7. FRONTEND FOLDER STRUCTURE

```
frontend/
├── src/
│   ├── pages/
│   │   ├── ScanCard.tsx
│   │   ├── Records.tsx
│   │   └── Export.tsx
│   ├── components/
│   │   ├── UploadCard.tsx
│   │   ├── CameraCapture.tsx
│   │   ├── CardForm.tsx
│   │   ├── CategorySelector.tsx
│   │   ├── ProcessingSteps.tsx
│   │   └── RecordDetailsModal.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 8. API DESIGN

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/scans` | Upload file → start OCR pipeline → return scan_id |
| GET | `/api/scans/:id/status` | Poll processing status |
| GET | `/api/scans/:id/result` | Get structured extraction result |
| POST | `/api/contacts` | Save reviewed contact |
| GET | `/api/contacts` | List all contacts |
| GET | `/api/contacts/:id` | Get single contact |
| PUT | `/api/contacts/:id` | Update contact |
| DELETE | `/api/contacts/:id` | Delete contact |
| GET | `/api/categories` | List active categories |
| POST | `/api/categories/suggest` | Suggest category from data |
| POST | `/api/exports` | Export CSV / XLSX / vCard |
| GET | `/api/health` | Health check |

---

## 9. OCR PROVIDER ARCHITECTURE

```
OCR_PROVIDER=tesseract  (env var)

scan.controller.ts
        ↓
services/ocr/index.ts  (provider router)
        ├── tesseract.ts    ← active default
        ├── googleVision.ts ← future
        └── awsTextract.ts  ← future
```

Switching providers = change one env var, zero controller changes.

---

## 10. CATEGORY DETECTION LOGIC

1. Extract keywords from OCR text, company name, email domain
2. Match against category keyword dictionary (rule-based, instant)
3. If no match → send to Groq AI with company name + card keywords
4. Return: `suggested_category`, `confidence` (0–1), `reason`, `needs_review`
5. If confidence < 0.5 → mark as "Uncategorized", show manual dropdown

---

## 11. DATA EXTRACTION LOGIC

| Field | Method |
|---|---|
| Email | Regex: `/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g` |
| Phone | Regex: `/(\+91)?[\s-]?[6-9]\d{9}/g` + normalize country code |
| Company | Keyword match (Ltd/Pvt/Inc/LLP) → fallback: email domain |
| Name | First non-email/non-phone/non-company line, strip OCR noise prefixes |
| Website | Regex: `/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/` |
| Address | Lines containing city/state/PIN/country patterns |
| Designation | Lines matching known title keywords (CEO, Manager, Director, etc.) |

---

## 12. EDGE CASES

| Case | Handling |
|---|---|
| Company missing | Derive from email domain |
| Multiple phones | Store all, normalize country code |
| Multiple emails | Store all |
| Low quality image | Return error: "Please upload a clearer image" |
| Fancy card design | Allow full manual editing |
| Duplicate card | Warn user (match by email OR phone), allow merge or keep both |
| Multi-page PDF | Process first page; future: allow page selection |
| No camera | Show upload option with message |
| Category confidence low | Show manual dropdown, mark as Uncategorized |

---

## 13. PERFORMANCE & RESOURCE OPTIMIZATION

- Process OCR only on demand
- Max upload: 10 MB
- PDF converted to image at scale 3 before OCR
- PM2 for process management on VPS
- No GPU dependency

---

## 14. DEPLOYMENT

```
Ubuntu VPS
├── Nginx (reverse proxy → port 5000)
├── PM2 (node process manager)
├── MongoDB (local or Atlas)
└── Node.js backend (dist/)
```

Environment Variables:
```
PORT=5000
MONGODB_URI=
OCR_PROVIDER=tesseract
GROQ_API_KEY=
GEMINI_API_KEY=
```
