# Project Summary

This project is a Visiting Card Scanner built to reduce manual data entry from business cards. A user can upload an image/PDF or capture a card with the browser camera, run OCR, review extracted contact details, save the contact, search saved records, and export data as CSV or XLSX.

The stack is MERN with TypeScript: React + Vite on the frontend, Node.js + Express on the backend, MongoDB with Mongoose for persistence, Tesseract.js for OCR, and optional Groq-based category detection when `GROQ_API_KEY` is configured.

The main workflow is simple: user selects or captures a card, frontend sends it as `multipart/form-data` to `/api/scans`, backend stores the file, runs OCR, parses fields like name/email/phone/company, suggests a category, returns structured data, and the user reviews and saves it as a contact.

# Features Implemented

Feature: OCR scanning
Why it exists: To convert visiting card images/PDFs into editable contact data.
How it works: The backend accepts uploads through Multer, uses Tesseract.js as the default OCR provider, converts the first page of PDFs using `pdf-to-img`, parses raw text, and returns structured fields.

Feature: Contact management
Why it exists: Users need to save, view, edit, and delete extracted contacts.
How it works: Contacts are stored in MongoDB with fields for name, designation, company, phones, emails, website, address, category, keywords, and raw OCR text. The frontend Records page calls contact CRUD APIs.

Feature: Category detection
Why it exists: Business cards should become useful leads, not just raw contact data.
How it works: The backend extracts keywords from company name, OCR text, and email domain. If `GROQ_API_KEY` exists, Groq suggests one category from a fixed category list. Otherwise it falls back to an empty/needs-review result.

Feature: Export functionality
Why it exists: Users need to use saved contacts outside the app.
How it works: `/api/exports` reads selected or all contacts and returns CSV using `json2csv` or XLSX using `exceljs`.

Feature: Camera capture
Why it exists: Users should be able to scan physical cards directly from the browser.
How it works: The frontend uses `react-webcam`, captures a JPEG screenshot, converts it into a `File`, and sends it through the same scan flow as uploaded files.

Feature: Search/filter
Why it exists: Saved records need to be easy to find.
How it works: The Records page debounces search input and calls `GET /api/contacts?search=...`. Backend searches name, company, and emails with a case-insensitive regex.

Feature: Editable review form
Why it exists: OCR is not always perfect, so users need manual correction before saving.
How it works: The CardForm displays extracted fields, lets the user edit name, designation, company, website, GSTIN, emails, phones, and category, then posts the corrected contact.

# Security Improvements Added

What: Rate Limiting
Why: Scan and export endpoints are expensive and unauthenticated.
Benefit: Limits abuse per IP and returns a standard `429 RATE_LIMITED` error.

What: CORS configuration
Why: The frontend and backend run on different origins in development.
Benefit: Backend only allows configured origins like `http://localhost:5173`, reducing unwanted browser access.

What: Input Validation
Why: Bad request bodies can break logic or store invalid data.
Benefit: Contacts, exports, and category suggestions are checked before controllers run.

What: Request Sanitization
Why: MongoDB queries can be attacked with `$` operators or dotted keys.
Benefit: Requests containing unsafe keys are rejected before reaching controllers.

What: NoSQL Injection Protection
Why: User-controlled objects should not become MongoDB operators.
Benefit: Recursive sanitizer blocks `$` and `.` keys in body/query objects.

What: Randomized Upload Filenames
Why: Predictable filenames can leak or overwrite uploaded files.
Benefit: Uploaded files use timestamp plus random crypto token names.

What: Upload File Restrictions
Why: OCR should only process expected file formats and reasonable file sizes.
Benefit: Backend allows JPG, JPEG, PNG, WebP, and PDF only, with a 10 MB Multer limit.

What: Error Handling Standardization
Why: Frontend needs predictable errors for display and tests.
Benefit: Backend returns `{ error: { code, message, details } }` for validation, upload, rate limit, and server errors.

What: Scan Retention TTL
Why: Uploaded cards contain personal/business data.
Benefit: Scan records include `expires_at`, and MongoDB TTL index removes expired scan records after the configured retention window.

What: Type Safety
Why: OCR, API payloads, and MongoDB models are easy places for shape mismatches.
Benefit: TypeScript interfaces, typed request bodies, safer query parsing, and removal of `any` reduce runtime surprises.

# Refactoring Work Completed

* Removed all TypeScript `any` types.
* Added interfaces for API payloads, models, contact filters, export rows, and scan results.
* Extracted constants for API paths, scan statuses, upload limits, MIME types, CORS origins, and rate limits.
* Improved Express request typing for contact, export, and category suggestion bodies.
* Added reusable utilities for API errors, normalization, sanitization, and safer query parsing.
* Improved error handling with a consistent backend envelope and frontend extractor.
* Added validation middleware for contacts, exports, and category suggestions.
* Added rate limiting for scan and export routes.
* Added tests for API safety, CORS, validation errors, frontend API error parsing, upload UI, and processing steps.

# Testing Added

Backend:

* Number of tests: 8.
* Covered: health check, CORS allowlist for `localhost:5173`, missing upload file, invalid upload type, empty export IDs, empty contact IDs, missing category suggestion inputs, and empty contact body.

Frontend:

* Number of tests: 5.
* Covered: old error shape parsing, new nested error envelope parsing, fallback error handling, upload UI rendering, and processing steps rendering.

How to run:

* Backend: `cd backend && npm test`
* Frontend: `cd frontend && npm test`
* Backend build/typecheck: `cd backend && npm run build`
* Frontend build/typecheck: `cd frontend && npm run build`

# Questions Team Lead May Ask

1. Why TypeScript?

TypeScript helps us lock down request/response shapes, model fields, and frontend props. It is useful here because OCR output and API payloads can be inconsistent.

2. Why MongoDB?

The extracted card data is semi-structured: some cards have multiple phones, optional address fields, social links, and OCR metadata. MongoDB lets us store this flexible document shape without forcing a rigid relational schema too early.

3. Why Rate Limiting?

Scanning and exporting are expensive operations, and Phase 1 has no login. Rate limiting protects the backend from accidental spam and basic abuse.

4. Why CORS?

CORS controls which browser origins can call the backend. We allow the local frontend origin, currently `http://localhost:5173`, and can configure production origins through `CORS_ORIGIN`.

5. Why Validation?

Validation stops bad data before it reaches database logic. It also gives the frontend predictable error messages for empty bodies, invalid emails/phones, and invalid export requests.

6. Why Sanitization?

Sanitization blocks request keys like `$where` or dotted paths that could become MongoDB operators. This reduces NoSQL injection risk.

7. Why Randomized Filenames?

Randomized filenames prevent users from guessing upload paths or overwriting files with the same original name. The backend uses a timestamp plus random crypto bytes.

8. Why TTL Index?

Card scans contain personal/business data, so they should not stay forever by default. The `expires_at` TTL index gives us automatic cleanup of scan records after the retention period.

9. Why Remove any?

`any` hides type problems and weakens the value of TypeScript. Removing it forces safer handling of unknown errors, API payloads, and Express request data.

10. How would you scale this project?

I would move OCR to a queue/worker system, store uploads in S3 or similar object storage, add authentication and tenant scoping, add Redis-backed rate limits, and replace local in-memory limits with shared infrastructure.

# 30 Second Project Pitch

This is a MERN-based Visiting Card Scanner. A user uploads or captures a business card, the backend runs OCR with Tesseract.js, extracts fields like name, phone, email, company, and website, suggests a category, and lets the user review and save the contact. Saved contacts can be searched, edited, deleted, and exported as CSV or XLSX. I also added security and maintainability improvements like validation, sanitization, CORS allowlisting, rate limiting, randomized upload filenames, TTL retention, type safety, and tests.

# 2 Minute Technical Explanation

This project is a full-stack Visiting Card Scanner built with React, Vite, TypeScript, Node.js, Express, MongoDB, and Mongoose. The frontend has two main screens: scanning and saved records. On the scanning screen, a user can upload a JPG, PNG, WebP, PDF, or capture a photo using the browser camera. The file is sent to the backend through `/api/scans`.

On the backend, Multer validates the file type and size, stores it with a randomized filename, and the scan controller starts processing. If the file is a PDF, only the first page is converted to an image. Tesseract.js extracts raw text, then the parser uses regex and normalization utilities to extract emails, phone numbers, website, company name, designation, address, social links, and GSTIN. Keywords are extracted from the OCR text and company/email information, and category detection runs through the Groq integration when configured.

After OCR, the frontend shows an editable review form. This is important because OCR is never perfect, so the user can correct fields before saving. Saved contacts go into MongoDB and can be searched, edited, deleted, or exported. Export supports CSV through `json2csv` and XLSX through `exceljs`.

The cleanup work focused on production-readiness basics: no `any` types, typed Express request bodies, safer query parsing, reusable validation and sanitization, NoSQL injection protection, standardized error responses, CORS allowlisting, rate limiting, upload restrictions, randomized filenames, and TTL retention for scans. The current test suite covers backend API safety and frontend utility/component behavior, and both backend and frontend builds pass.
