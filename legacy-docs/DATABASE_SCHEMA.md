# Database Schema Design

## Version
v1.1

## Database: MongoDB + Mongoose + TypeScript (MERN)

> Source of truth: `visiting_card_scanner_developer_spec.html`. Phase 1 collections are
> active; SaaS collections are marked **Future Scope**. Nullable `user_id` / `workspace_id`
> are included now to avoid a later migration.

---

## Collection: scans
Tracks each uploaded/captured file processing job.

```ts
interface IScan {
  _id: ObjectId;
  user_id?: ObjectId | null;        // nullable — Future Scope (SaaS)
  workspace_id?: ObjectId | null;   // nullable — Future Scope (SaaS)
  input_type: 'camera' | 'image' | 'pdf';
  file_path: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  expires_at?: Date | null;         // optional TTL for retention policy (see SECURITY doc)
  createdAt: Date;
  processedAt?: Date;
}
```

Indexes: `status`, `createdAt`. Optional TTL index on `expires_at` if time-based retention is enabled.

---

## Collection: contacts
Structured extracted visiting card data.

```ts
interface IContact {
  _id: ObjectId;
  scan_id: ObjectId;
  person_name: string;              // required
  designation?: string;
  company_name?: string;
  website?: string;
  address?: {
    full_address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  social_links?: string[];
  gstin_or_tax_id?: string;
  raw_ocr_text?: string;
  extraction_confidence?: number;          // 0.0 – 1.0 (overall)
  field_confidence?: Record<string, number>; // optional per-field confidence (UI indicators)
  cardImage?: string;               // file path to stored card image
  createdAt: Date;
  updatedAt: Date;
}
```

Indexes: `company_name`, `createdAt`.

> **field_confidence** is added so the per-field confidence indicators shown in UI_UX have a
> backing structure. If only an overall score is produced in Phase 1, `field_confidence` may be
> omitted and the UI shows the overall indicator.

---

## Collection: contact_phones
Multiple phone numbers per contact.

```ts
interface IContactPhone {
  _id: ObjectId;
  contact_id: ObjectId;
  type: 'mobile' | 'landline' | 'whatsapp' | 'fax' | 'other';
  number: string;
  country_code: string;             // e.g. "+91"
}
```

Indexes: `contact_id`, `number` (**non-unique** — see Duplicate Detection).

---

## Collection: contact_emails
Multiple emails per contact.

```ts
interface IContactEmail {
  _id: ObjectId;
  contact_id: ObjectId;
  email: string;
}
```

Indexes: `contact_id`, `email` (**non-unique**).

> **Resolved contradiction:** `email` is **not** unique. A unique email index would make the
> required "keep both" duplicate resolution impossible. Duplicate handling is a
> lookup-and-warn behavior, not a DB constraint.

---

## Collection: categories
Business category master list (configurable).

```ts
interface ICategory {
  _id: ObjectId;
  name: string;                     // e.g. "IT Services and Software"
  parent_id?: ObjectId | null;      // for sub-categories
  keywords: string[];               // e.g. ["software", "cloud", "ERP"]
  is_active: boolean;
}
```

> Seeded on first server start in Phase 1. Admin CRUD over categories is **Phase 2**.

---

## Collection: contact_categories
Category assignment per contact.

```ts
interface IContactCategory {
  _id: ObjectId;
  contact_id: ObjectId;
  category_id: ObjectId;
  confidence: number;               // 0.0 – 1.0
  reason: string;                   // e.g. "Matched keywords: software, cloud"
  source: 'rule' | 'ai' | 'user';
  is_user_confirmed: boolean;
  needs_review: boolean;            // true when confidence low or categories conflict
}
```

> `needs_review` is canonical here and in all docs (earlier project-details draft omitted it).

---

## Collection: enrichment_logs
Company enrichment attempts and results.

```ts
interface IEnrichmentLog {
  _id: ObjectId;
  contact_id: ObjectId;
  source_type: 'keyword' | 'ai' | 'domain' | 'web';  // Phase 1 uses: keyword, ai
  source_url?: string;
  summary?: string;
  keywords: string[];
  createdAt: Date;
}
```

> `domain` and `web` source types are **Future Scope** (website/search enrichment).

---

## Collection: exports
Export history.

```ts
interface IExport {
  _id: ObjectId;
  user_id?: ObjectId | null;        // nullable — Future Scope (SaaS)
  format: 'csv' | 'xlsx' | 'vcard';
  file_path: string;
  record_count: number;
  createdAt: Date;
}
```

---

## Future Scope Collections (SaaS)

> Not created in Phase 1. Documented so the data model can evolve without major migration.

### users — **Future Scope**
```ts
{ _id, name, email, password_hash, plan_id, status, createdAt }
```

### workspaces — **Future Scope**
```ts
{ _id, name, owner_user_id, plan_id, createdAt }
```

### plans — **Future Scope**
```ts
{ _id, name, limits: { scans_per_month, seats, exports, api_access }, price, createdAt }
```

### api_keys — **Future Scope**
```ts
{ _id, workspace_id, key_hash, scopes: string[], last_used_at, createdAt, revoked_at }
```

### audit_logs — **Future Scope**
```ts
{ _id, actor_user_id, workspace_id, action, target, metadata, createdAt }
```

---

## Duplicate Detection
Before inserting a new contact, check for an existing match (non-unique lookup):

```ts
ContactPhone.findOne({ number: incomingPhone })
ContactEmail.findOne({ email: incomingEmail })
```

If found → warn user → offer **merge** or **keep both**. Because indexes are non-unique,
"keep both" is always possible.

---

## Indexes Summary

| Collection | Index | Unique? |
|---|---|---|
| scans | `status`, `createdAt` | No |
| scans | `expires_at` (TTL, optional) | No (TTL) |
| contacts | `company_name`, `createdAt` | No |
| contact_phones | `contact_id`, `number` | No |
| contact_emails | `contact_id`, `email` | **No** (changed from unique) |
| contact_categories | `contact_id`, `category_id` | No |
| categories | `name` | Optional |
