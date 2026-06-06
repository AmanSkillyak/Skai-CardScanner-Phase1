# Security, Privacy & Compliance Requirements

## Version
v1.0

## Scope
Phase 1 is a **public, unauthenticated** MERN web app that processes **PII** (names, phones,
emails, addresses, GSTIN). This document makes the spec's security section concrete and adds
the gaps identified in the documentation audit. SaaS-only controls are marked **Future Scope**.

> Source of truth: `visiting_card_scanner_developer_spec.html` §14.

---

## 1. Data Privacy & Retention (Phase 1 Decision Required)
Cards contain personal/business contact data. The product **must** decide and display one of:

| Option | Description |
|---|---|
| A. Delete after processing | Files (and optionally contact records) removed once the result/export is delivered |
| B. Temporary retention (recommended) | Files/records retained for a configurable TTL (`SCAN_RETENTION_TTL_HOURS`), then auto-deleted |
| C. Retain | Kept until manually deleted (highest privacy risk for a public tool) |

Requirements:
- Show a **clear privacy note** on the landing and review screens.
- If Option B: implement a TTL (e.g., MongoDB TTL index on `scans.expires_at`) and a matching
  cleanup of files under `uploads/`.
- Provide a **delete** capability for stored scans/contacts (user-facing delete in Phase 1 via
  `DELETE /api/contacts/:id`; scan/file deletion endpoint is Phase 2).
- **Compliance note:** because the tool targets Indian business cards (GSTIN), align retention,
  consent, and deletion with the **DPDP Act** (and GDPR if used in the EU). Formal compliance
  review is **Future Scope** but the privacy note and deletion path are Phase 1.

---

## 2. Public-Access Exposure (Audit Gap)
With no login and no `user_id` in Phase 1, `GET /api/contacts` would expose **all** stored
contacts to any visitor. Mitigations (choose per product decision):
- Prefer **stateless/ephemeral** Phase 1: do not persist a global public contact list; keep
  records scoped to the session/export, or
- If records persist, restrict listing/management endpoints (e.g., admin-only token) and treat
  the public surface as scan→review→export only.
- This decision must be recorded in PRD.md and reflected in the deployed configuration.

---

## 3. File Upload Security
- Enforce **type allow-list**: JPG, JPEG, PNG, WebP, PDF (validate MIME + extension).
- Enforce **size limit**: 10 MB (Multer limit + Nginx `client_max_body_size`).
- Reject corrupted, password-protected, or unreadable files with a clear error.
- Perform **basic content/safety validation** (spec's "malware/basic safety checks"): verify
  magic bytes match the declared type; constrain PDF processing to the first page in Phase 1.
- Store uploads outside the web root or behind controlled serving (see §4).

---

## 4. File Serving & Access Control
- Card images are stored under `uploads/` and served at `/uploads`. **Do not expose a
  directory listing.**
- Do not expose uploaded file URLs publicly without **signed/temporary** access for any
  sensitive deployment (spec requirement). Phase 1 minimum: non-guessable filenames
  (timestamp/UUID), no listing, and controlled access in production via Nginx.
- Signed/temporary URL generation is recommended and becomes mandatory in SaaS (**Future Scope**).

---

## 5. Input Sanitization & Injection Protection
- Sanitize all OCR text and user input before storing or rendering.
- Protect against **NoSQL/operator injection** (reject/strip `$`/`.` operator keys in request
  objects; use strict schemas / validation).
- Validate request bodies against expected shapes; reject unknown/oversized payloads.
- The React client must render extracted text safely (no `dangerouslySetInnerHTML`).

---

## 6. Rate Limiting & Abuse Prevention
Because Phase 1 has no login, abuse protection is essential.
- Apply rate limiting on `POST /api/scans` and `POST /api/exports` (most expensive).
- Recommended defaults (configurable via env):
  - `RATE_LIMIT_WINDOW_MS=60000` (1 minute)
  - `RATE_LIMIT_MAX=20` requests/IP/window for scan/export
- Return `429 Too Many Requests` with the standard error envelope.
- Consider a stricter daily cap per IP for scans.

---

## 7. Secrets & Keys
- API keys for OCR/AI providers (e.g., `GROQ_API_KEY`) live **only on the backend**, in env
  vars, never shipped to the React client or committed to source control.
- `.env` must be git-ignored; provide `.env.example` without secrets.
- No Gemini key is required in Phase 1 (`GEMINI_API_KEY` removed).

---

## 8. Transport Security
- **HTTPS/TLS mandatory in production** (Nginx + Let's Encrypt).
- Redirect HTTP → HTTPS.
- Set security headers via Nginx (HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options`,
  a reasonable `Content-Security-Policy`).

---

## 9. CORS
- Restrict CORS to the deployed front-end origin via `CORS_ORIGIN` (avoid `*` in production).
- Phase 1 dev may use a permissive policy; production must be locked down.

---

## 10. Logging & Auditing
- Log scan failures and processing errors with enough context for the operator (no secrets, no
  full PII in logs where avoidable).
- **Audit logs** of user/admin actions are required for the **SaaS** version (**Future Scope**;
  `audit_logs` collection documented in DATABASE_SCHEMA.md).

---

## 11. Future Scope (SaaS) Security
- Authentication (password hashing with bcrypt/argon2), session/JWT handling.
- Authorization & **multi-tenant isolation**: every query scoped by `user_id`/`workspace_id`.
- API-key issuance, scoping, rotation, and per-key rate limits.
- Per-plan usage limits and billing-state enforcement.
- Object-storage signed URLs; encryption at rest; backup encryption.

---

## Security Checklist (Phase 1)

- [ ] Privacy note shown; retention option chosen and configured
- [ ] File type allow-list + 10MB limit (Multer + Nginx)
- [ ] Magic-byte/content validation; first-page-only PDF
- [ ] No directory listing on `/uploads`; non-guessable filenames
- [ ] Input sanitization + Mongo operator-injection protection
- [ ] Rate limiting on scans/exports (429 envelope)
- [ ] Provider API keys backend-only; `.env` git-ignored
- [ ] HTTPS/TLS + security headers in production
- [ ] CORS restricted to front-end origin
- [ ] Failure logging without leaking secrets/PII
