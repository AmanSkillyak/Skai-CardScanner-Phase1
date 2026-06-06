# UI/UX Design Brief

## Project
Visiting Card Scanner

## Version
v1.1

## Stack
React + Vite + TypeScript + Tailwind CSS (MERN front-end). Next.js is **not** used.

> Source of truth: `visiting_card_scanner_developer_spec.html`. SaaS-only screens are marked
> **Future Scope**.

---

## Design Goals
- Clean, professional UI
- Minimal clicks to complete a scan
- Mobile-friendly (works on phone browsers)
- Fast workflow with clear progress feedback
- Future-compatible with Android app design patterns

---

## Primary Colors

| Role | Color |
|---|---|
| Primary | `#2563EB` (Blue) |
| Success | `#16A34A` (Green) |
| Warning | `#D97706` (Amber) |
| Error | `#DC2626` (Red) |
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Text Primary | `#1E293B` |
| Text Muted | `#64748B` |

---

## Typography
- Font: **Inter**
- Headings: Bold (700)
- Body: Regular (400)
- Labels: Medium (500)

---

## Screens

### 1. Landing / Scan Card Screen
- App title + tagline
- Privacy note ("Your card data is processed securely; see retention policy")
- Supported formats notice (JPG, PNG, WebP, PDF — max 10MB)
- **Upload Image/PDF** button (drag-and-drop area)
- **Open Camera** button
- Link to Saved Records

---

### 2. Processing Screen
- Progress steps with status icons:
  1. Uploading
  2. OCR Processing
  3. Extracting Fields
  4. Enriching Company
  5. Detecting Category
- Animated spinner per active step
- Cancel button
- Clear loading states (never a blank screen)

---

### 3. Review Extracted Data Screen
- Editable fields:
  - Name *
  - Designation
  - Email (multiple)
  - Phone (multiple)
  - Company
  - Website
  - Address
  - Social Links
  - GSTIN (optional)
- Confidence indicator per field (color-coded green/amber/red), backed by
  `field_confidence` where available, otherwise the overall `extraction_confidence`
- Raw OCR text toggle (collapsible)
- Category section:
  - Suggested category badge
  - Confidence score (e.g., "87% — Matched: software, cloud, IT")
  - Reason text (avoid black-box decisions)
  - Manual category dropdown (always available; required when confidence < 50%)
- **Save** button
- **← Scan Another** button

---

### 4. Result / Export Screen
- Final card summary
- Export buttons: **Download CSV** | **Download XLSX** | **Download vCard**
- **Save to Records** button
- **Scan Another Card** button

---

### 5. Saved Records Screen
- Search bar
- Filter by category dropdown
- Table columns: Name | Company | Category | Email | Phone | Date
- Row actions: **View** | **Edit** | **Delete**
- Bulk select + **Export Selected** button
- Pagination
- Duplicate warning UI on save (merge / keep both)

---

### 6. Record Details Modal
- All contact fields displayed
- Original card image (served via controlled URL — see SECURITY_REQUIREMENTS.md)
- Category with confidence + reason
- Edit / Delete / Export buttons

---

### 7. Admin Settings Screen — **Phase 2 (Future Scope)**
> Restored from spec §11. Not built in Phase 1 (Phase 1 uses seeded categories).
- Category master list (add / edit / deactivate)
- Keyword mapping per category
- Failed-scan and low-confidence logs review

---

## Responsive Design

| Breakpoint | Width |
|---|---|
| Desktop | ≥ 1024px |
| Tablet | 768px – 1023px |
| Mobile | ≤ 767px |

Mobile-specific:
- Camera button prominent on mobile
- Upload area full-width
- Table replaced with card list on mobile

---

## Accessibility
- Color is not the only signal for confidence/validation (pair color with icon/label)
- All interactive controls keyboard-reachable with visible focus states
- Form fields have associated labels; errors announced inline
- Sufficient contrast for text on primary/surface colors

---

## UX Principles
- One primary action per screen
- Large upload area with drag-and-drop
- Clear validation messages inline
- Loading indicators during OCR (never blank screen)
- Confidence indicators help users know which fields to verify
- Manual category override always available
- Never block the user — all fields editable before save
