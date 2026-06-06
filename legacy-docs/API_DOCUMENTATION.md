# API Documentation

## Version
v1.0 (Phase 1)

## Base
- Backend: Node.js + Express (MERN). Default port `5000`.
- Base path: `/api`
- Content type: `application/json` (except `POST /api/scans`, which is `multipart/form-data`)
- Auth: **none in Phase 1** (public). Auth + API keys are **Future Scope (SaaS)**.

> Source of truth: `visiting_card_scanner_developer_spec.html` §12. This document adds concrete
> request/response contracts so the APIs are reusable by a future Android app (acceptance
> criterion). Versioning note: Phase 1 uses `/api`; a `/api/v1` prefix is recommended before
> the Android/SaaS phase (**Future Scope**).

---

## Standard Error Envelope
All error responses use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": {}
  }
}
```

Common HTTP status codes: `200` OK, `201` Created, `400` Bad Request,
`404` Not Found, `413` Payload Too Large, `415` Unsupported Media Type,
`429` Too Many Requests, `500` Internal Server Error.

---

## 1. Health

### `GET /api/health`
Health check for monitoring.

**200**
```json
{ "status": "ok" }
```

---

## 2. Scans

### `POST /api/scans`
Upload an image/PDF or a captured image; runs OCR (synchronous in Phase 1).

- Content-Type: `multipart/form-data`
- Field: `file` (JPG, JPEG, PNG, WebP, or PDF; ≤ 10 MB)

**201**
```json
{
  "scan_id": "665f0c2a1b...",
  "status": "completed"
}
```
`status` is one of `queued | processing | completed | failed` (Phase 1 returns
`completed`/`failed`; enum preserved for future async).

**Errors:** `415` unsupported type, `413` too large, `400` corrupt/unreadable, `500` OCR failure.

---

### `GET /api/scans/:id/status`
Poll processing status (contract preserved for the SaaS async model).

**200**
```json
{ "scan_id": "665f0c2a1b...", "status": "completed" }
```
**404** if the scan id is unknown.

---

### `GET /api/scans/:id/result`
Return the OCR + structured extraction result.

**200**
```json
{
  "scan_id": "665f0c2a1b...",
  "status": "completed",
  "result": {
    "person_name": "Asha Verma",
    "designation": "Sales Manager",
    "company_name": "ABC Cables Pvt Ltd",
    "phones": [{ "type": "mobile", "value": "9876543210", "country_code": "+91" }],
    "emails": ["asha@abccables.com"],
    "website": "abccables.com",
    "address": {
      "full_address": "12 MG Road, Pune, Maharashtra 411001, India",
      "city": "Pune", "state": "Maharashtra", "postal_code": "411001", "country": "India"
    },
    "social_links": [],
    "gstin_or_tax_id": "",
    "raw_ocr_text": "...",
    "extraction_confidence": 0.82,
    "category": {
      "suggested_category": "Electrical Wires Supplier",
      "confidence": 0.91,
      "reason": "Matched keywords: cables, wires",
      "needs_review": false
    },
    "enrichment": {
      "source": "keyword",
      "company_keywords": ["cables", "wires"],
      "company_summary": ""
    }
  }
}
```
**404** if unknown; result may be absent if `status` is `failed` (see `error_message`).

---

## 3. Contacts

### `POST /api/contacts`
Save a reviewed/corrected contact.

**Request**
```json
{
  "scan_id": "665f0c2a1b...",
  "person_name": "Asha Verma",
  "designation": "Sales Manager",
  "company_name": "ABC Cables Pvt Ltd",
  "website": "abccables.com",
  "address": { "full_address": "...", "city": "Pune", "state": "Maharashtra", "postal_code": "411001", "country": "India" },
  "phones": [{ "type": "mobile", "value": "9876543210", "country_code": "+91" }],
  "emails": ["asha@abccables.com"],
  "social_links": [],
  "gstin_or_tax_id": "",
  "category": { "category_id": "...", "confidence": 0.91, "reason": "Matched: cables", "source": "rule", "is_user_confirmed": true, "needs_review": false }
}
```
`person_name` is required.

**201** → saved contact (with `_id`).
**200 with duplicate flag** (when email/phone matches an existing contact):
```json
{
  "duplicate": true,
  "matches": [{ "_id": "...", "person_name": "Asha Verma", "matched_on": "email" }],
  "message": "Possible duplicate. Choose merge or keep both."
}
```
The client then re-submits with a resolution hint (`keep_both` or `merge_into: <id>`).

---

### `GET /api/contacts`
List saved contacts with search, filter, and pagination.

**Query params:** `search` (name/company/email/phone), `category` (id or name),
`page` (default 1), `limit` (default 20).

**200**
```json
{
  "data": [ { "_id": "...", "person_name": "...", "company_name": "...", "category": "IT Services and Software", "primary_email": "...", "primary_phone": "...", "createdAt": "..." } ],
  "page": 1, "limit": 20, "total": 134
}
```

---

### `GET /api/contacts/:id`
Get a single contact (full detail, including phones, emails, category, `cardImage`).
**200** contact object · **404** if not found.

### `PUT /api/contacts/:id`
Update a contact (any editable field). **200** updated contact · **404** if not found.

### `DELETE /api/contacts/:id`
Delete a contact. **200** `{ "deleted": true }` · **404** if not found.

---

## 4. Categories

### `GET /api/categories`
List active categories (for the manual dropdown).

**200**
```json
[ { "_id": "...", "name": "IT Services and Software", "keywords": ["software","cloud","erp"], "is_active": true } ]
```

### `POST /api/categories/suggest`
Suggest a category from extracted/enriched data.

**Request**
```json
{ "company_name": "ABC Cables Pvt Ltd", "keywords": ["cables","wires"], "raw_ocr_text": "..." }
```
**200**
```json
{
  "suggested_category": "Electrical Wires Supplier",
  "confidence": 0.91,
  "reason": "Matched keywords: cables, wires",
  "needs_review": false,
  "ranked": [ { "category": "Electrical Wires Supplier", "confidence": 0.91 } ]
}
```

---

## 5. Exports

### `POST /api/exports`
Export contacts to a file.

**Request**
```json
{ "format": "csv", "contact_ids": ["...", "..."] }
```
`format`: `csv | xlsx | vcard`. If `contact_ids` is omitted, exports all (subject to limits).

**200** — either a direct file download (`Content-Disposition: attachment`) or:
```json
{ "format": "csv", "file_path": "/uploads/exports/contacts_1780....csv", "record_count": 12 }
```
The frontend triggers the download from the returned path.

---

## Future Scope Endpoints (not Phase 1)

> Documented for forward-compatibility. Marked **Future Scope**.

| Method | Endpoint | Purpose | Phase |
|---|---|---|---|
| POST | `/api/categories` | Create category | Phase 2 (Admin) |
| PUT | `/api/categories/:id` | Update category/keywords | Phase 2 (Admin) |
| DELETE | `/api/categories/:id` | Deactivate/delete category | Phase 2 (Admin) |
| GET | `/api/reports/categories` | Count of cards by category | Phase 2 |
| GET | `/api/reports/regions` | Count by city/state | Phase 2 |
| GET | `/api/reports/scan-quality` | Failed/low-confidence/missing fields | Phase 2 |
| GET | `/api/reports/duplicates` | Duplicate contacts | Phase 2 |
| GET | `/api/exports/:id` | Download a previously generated export | Phase 2 |
| DELETE | `/api/scans/:id` | Delete a scan + file (retention) | Phase 2 |
| POST | `/api/auth/*`, `/api/keys/*` | Auth & API keys | SaaS |

---

## Notes for Android Reuse
- All responses are JSON; the `multipart/form-data` upload field is `file`.
- The scan status/result split lets a mobile client poll without holding a long request.
- No web-only assumptions (no cookies/session required in Phase 1).
- Recommend adopting `/api/v1` before the mobile client ships to allow non-breaking evolution.
