# Product Requirements Document (PRD)

## Project Name
Visiting Card Scanner

> Canonical product name across all docs. (The HTML developer specification uses
> "Visiting Card Scanner"; earlier drafts used "...Portal". This document standardizes
> on **Visiting Card Scanner**.)

## Version
v1.1

## Source of Truth
`visiting_card_scanner_developer_spec.html` is the primary source of truth. This PRD
restates and refines it for the **MERN stack** implementation and does not override it.

## Stack Decision
This project is built on the **MERN stack only**:
**MongoDB, Express.js, React (Vite + TypeScript), Node.js.**
Next.js, Vue, SvelteKit, FastAPI, and Laravel are explicitly **not used**. The HTML spec
lists those as evaluated options; React + Vite + TypeScript is the selected front-end and
Node + Express + TypeScript is the selected backend.

---

## Purpose
A web-based application that allows users to scan or upload visiting/business cards,
automatically extract structured contact data, enrich company information, and categorize
leads for reporting and export.

---

## Problem Statement
Manually entering contact information from visiting cards is time-consuming and error-prone.
Businesses receive numerous cards during meetings, conferences, and networking events.
Managing these manually leads to inefficiency and data loss.

---

## Objectives

| Objective | Description |
|---|---|
| Fast capture | Scan via camera or upload image/PDF |
| Accurate extraction | Extract name, phone, email, company, designation, address, website, social links |
| Company enrichment | Infer business type/category from company name, website, email domain, card keywords |
| Simple public use | Phase 1 works without login |
| Future-ready architecture | APIs, DB, and modules designed so SaaS, Android app, and team features can be added later |
| Export and reporting | View, filter, download, and analyze extracted cards |

---

## Target Users

| User Type | Phase | Permissions |
|---|---|---|
| Guest User | Phase 1 | Scan/upload, review, download, optionally save |
| Admin/Operator | Phase 1 (optional) | View logs, review failed scans, manage categories |
| Registered User | **Future Scope (SaaS)** | Save cards, manage contacts, export, history |
| Team Admin | **Future Scope (SaaS)** | Manage users, billing, workspace, permissions |
| Developer/API User | **Future Scope (SaaS)** | API keys, scan via API, retrieve JSON |

---

## Phases

| Phase | Scope | Notes |
|---|---|---|
| Phase 1 — Web MVP | Public web app. Camera scan. Image/PDF upload. OCR. Manual edit. Category suggestion. CSV/XLSX export. | No mandatory login. MERN stack. |
| Phase 2 — Android + AI (**Future Scope**) | Android app using the same backend APIs. Better OCR, batch scan, duplicate detection, image cropping, lead notes. | Backend must remain API-first from Phase 1. |
| Phase 3 — SaaS (**Future Scope**) | Login, teams, workspaces, subscriptions, CRM integrations, admin dashboard, saved contacts, API keys. | DB already includes nullable `user_id`/`workspace_id`. |

---

## Core Features (Phase 1)

### Card Scanning
- Upload Image (JPG, JPEG, PNG, WebP)
- Upload PDF (Phase 1: **first page processed**; multi-page page-selector is **Future Scope**)
- Camera Capture (with crop/rotate)

### OCR Extraction
- Person Name
- Designation
- Company Name
- Mobile / Phone (multiple, normalized with country code)
- Email (multiple)
- Website
- Address (city, state, postal code, country)
- Social Links (LinkedIn, Instagram, Facebook, YouTube)
- GSTIN / Tax ID (optional)
- Other Notes (unclassified text)

### Company Enrichment
- Keyword dictionary matching against company name, card text, email domain
- AI-based enrichment (Groq API) when configured
- Confidence score + reason stored
- Website/domain meta fetch and search-snippet enrichment are described in the spec and are
  treated as **Future Scope** unless explicitly enabled (see TRD §Enrichment).

### Category Engine
- Rule-based keyword matching (primary, no API needed)
- AI-based suggestion with confidence score and reason (Groq) when configured
- Manual override dropdown
- Mark as "Uncategorized" when confidence is below threshold

### Editable Review Form
- All extracted fields editable before save/export
- Confidence indicators (overall extraction confidence; per-field indicators per UI_UX)
- Raw OCR text toggle

### Export
- CSV export
- XLSX export
- vCard export (optional)

### Record Management
- Save, view, edit, delete records
- Duplicate detection by email/phone (warn → merge or keep both)
- Search and filter

### Category Management (Admin — Phase 1 Decision)
Admins can manage the category master and keyword mappings. For Phase 1 this is satisfied by
**seeded categories** (loaded on first server start) plus read APIs. Full admin **category CRUD
endpoints and an Admin Settings UI are a documented Phase 2 item** (see TRD and
API_DOCUMENTATION). This makes the spec requirement explicit instead of silently dropped.

---

## Privacy & Data Retention (Phase 1 Decision)
Because Phase 1 is public and unauthenticated and cards contain PII:
- A clear privacy note is shown to users.
- **Decision required and to be recorded here:** whether uploaded files and contact records
  are (a) deleted after processing, (b) retained temporarily with TTL expiry, or (c) retained.
  The recommended default is **temporary retention with a configurable TTL**. See
  SECURITY_REQUIREMENTS.md for the full policy and implications.

---

## Suggested Categories (Configurable)

| Category | Example Keywords |
|---|---|
| Electrical Wires Supplier | wires, cables, electricals, copper, switches, MCB, LED |
| Corporate Gifts Supplier | gifts, promotional, branding, trophies, hampers |
| Printing and Packaging | printing, box, packaging, offset, label, carton |
| IT Services and Software | software, website, app, ERP, CRM, cloud, IT services |
| Digital Marketing Agency | SEO, social media, ads, branding, marketing |
| Real Estate and Construction | builders, construction, architect, interior, contractor |
| Logistics and Transport | logistics, courier, transport, freight, cargo |
| Manufacturing | manufacturer, factory, production, OEM, machinery |
| Wholesale Trader / Distributor | dealer, distributor, wholesaler, trading |
| Finance and Accounting | CA, accountant, tax, GST, finance, loan, insurance |
| Healthcare and Medical | clinic, hospital, pharma, medical, doctor |
| Education and Training | school, institute, academy, coaching, training |
| Food and Hospitality | restaurant, catering, hotel, bakery, food |
| Textile and Garments | textile, garments, fabric, apparel, clothing |
| Security Services | security, CCTV, guard, surveillance |
| Uncategorized | Fallback when confidence is low |

---

## Success Criteria (from Spec §18 Acceptance Criteria)
- User can scan a card via camera from supported browsers/devices.
- User can upload image files and PDF files.
- OCR extracts at least name, phone, email, company, and address when visible.
- User can review and manually edit every extracted field before save/export.
- Category suggested with confidence score and reason.
- Low category confidence → marked "Uncategorized" or user prompted to choose.
- CSV and XLSX export working.
- Camera-missing, poor image, unsupported file, OCR failure, and multi-page PDF handled gracefully.
- Backend APIs documented and reusable by a future Android app (see API_DOCUMENTATION.md).
- Code is modular: OCR, parser, enrichment, category, export, storage as separate modules.

---

## Out of Scope (Phase 1) — marked Future Scope
- Mandatory login / authentication — **Future Scope**
- Multi-user / team workspaces — **Future Scope**
- CRM integrations — **Future Scope**
- Subscriptions / billing — **Future Scope**
- Android app — **Future Scope**
- Role management — **Future Scope**
- Admin category-CRUD UI + endpoints — **Phase 2** (Phase 1 uses seeded categories)
- Multi-page PDF page selector / all-pages-as-cards — **Future Scope** (Phase 1 = first page)
- Website/web-search enrichment fetch — **Future Scope** (Phase 1 = keyword + Groq)

---

## Related Documents
TRD.md · APPLICATION_FLOW.md · USER_FLOW.md · DATABASE_SCHEMA.md ·
BACKEND_ARCHITECTURE.md · API_DOCUMENTATION.md · SECURITY_REQUIREMENTS.md ·
TESTING_STRATEGY.md · DEPLOYMENT_ARCHITECTURE.md · UI_UX.md · IMPLEMENTATION_PLAN.md
