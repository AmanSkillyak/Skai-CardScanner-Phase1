# Deployment Architecture

## Version
v1.0

## Target
Single Ubuntu VPS (no GPU) running the **MERN** stack. This document expands the spec's
deployment notes with TLS, Nginx specifics, backups, monitoring, and CI/CD identified in the
documentation audit. Multi-instance/object-storage scaling is **Future Scope (SaaS)**.

> Source of truth: `visiting_card_scanner_developer_spec.html` (§9 architecture, §14 security).

---

## Topology (Phase 1)

```
                    Internet (HTTPS)
                          │
                          ▼
                ┌───────────────────┐
                │      Nginx         │  TLS (Let's Encrypt), reverse proxy,
                │  (reverse proxy)   │  static front-end, security headers
                └─────────┬─────────┘
                 /        │         \
        serve static      │ proxy /api → :5000
        React build       ▼
                ┌───────────────────┐
                │  Node + Express    │  managed by PM2
                │  (backend, :5000)  │  Tesseract.js OCR in-process
                └─────────┬─────────┘
                          │
                          ▼
                ┌───────────────────┐
                │     MongoDB        │  local or MongoDB Atlas
                └───────────────────┘

  Outbound (optional): Groq API for AI category (HTTPS)
```

---

## Components

| Component | Role |
|---|---|
| Nginx | TLS termination, HTTP→HTTPS redirect, serve React build, reverse-proxy `/api` and `/uploads` to Node, security headers, `client_max_body_size` |
| Node + Express (PM2) | API + synchronous OCR pipeline; built to `dist/` via `tsc` |
| MongoDB | Persistence (local or Atlas) |
| PM2 | Process manager: restart on crash, log management, optional cluster mode |
| Groq API | External AI category (only if `GROQ_API_KEY` set) |

---

## Build & Release

### Backend
```
cd backend
npm ci
npm run build        # tsc → dist/
pm2 start ecosystem.config.js   # or: pm2 start dist/app.js --name card-scanner-api
```

### Frontend
```
cd frontend
npm ci
npm run build        # Vite → dist/
# Nginx serves frontend/dist as the site root
```

> The frontend is a static SPA built by Vite — **no Node server and no Next.js runtime** is
> deployed for the front-end.

---

## Nginx Essentials

```nginx
server {
  listen 443 ssl;
  server_name example.com;

  # TLS via Let's Encrypt (certbot)
  ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

  # Allow uploads above 10MB app limit to avoid premature 413 at proxy
  client_max_body_size 12m;

  # Security headers
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options SAMEORIGIN;
  add_header Strict-Transport-Security "max-age=31536000" always;

  # React SPA
  root /var/www/card-scanner/frontend/dist;
  index index.html;
  location / { try_files $uri /index.html; }

  # API proxy (long OCR → generous timeouts)
  location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_read_timeout 60s;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # Uploaded card images (no directory listing)
  location /uploads/ {
    proxy_pass http://127.0.0.1:5000;
    autoindex off;
  }
}

server {
  listen 80;
  server_name example.com;
  return 301 https://$host$request_uri;   # force HTTPS
}
```

---

## PM2 (outline)

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'card-scanner-api',
    script: 'dist/app.js',
    instances: 1,            // single instance Phase 1 (in-process OCR)
    autorestart: true,
    max_memory_restart: '500M',
    env: { NODE_ENV: 'production' }
  }]
};
```

> Cluster mode is **not** recommended in Phase 1 because OCR is CPU-bound and in-process; scale
> via queue + workers in SaaS (**Future Scope**).

---

## Environment Variables (production)

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/card_scanner   # or Atlas URI
OCR_PROVIDER=tesseract
GROQ_API_KEY=...                # optional; AI category falls back to rules if absent
CORS_ORIGIN=https://example.com
SCAN_RETENTION_TTL_HOURS=72     # if temporary-retention policy chosen
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=20
```

> `GEMINI_API_KEY` is not used.

---

## Data & Backups
- **MongoDB backups**: scheduled `mongodump` (cron) with off-server copy retention, or Atlas
  automated backups. Document restore steps and test a restore periodically.
- **uploads/ retention**: if temporary-retention is chosen, a scheduled cleanup removes files
  past TTL (aligned with `scans.expires_at`). See SECURITY_REQUIREMENTS.md.

---

## Monitoring & Logging
- Liveness via `GET /api/health` (uptime monitor / Nginx check).
- PM2 logs with rotation (`pm2-logrotate`).
- Capture and review scan-failure logs (no secrets/PII leakage).
- Optional: external error tracking (e.g., Sentry) — recommended, not required for Phase 1.

---

## Environments
- **Development**: local Node + Vite dev server + local MongoDB; permissive CORS allowed.
- **Production**: built artifacts, Nginx + TLS, locked-down CORS, secrets via env only.
- A **staging** environment mirroring production is recommended before SaaS.

---

## CI/CD (recommended)
1. On push/PR: install, `tsc --noEmit`, lint, run unit + integration + component tests.
2. On merge to main: build backend (`dist/`) and frontend (`dist/`).
3. Deploy: copy artifacts to VPS, `pm2 reload`, reload Nginx; run smoke test against `/api/health`.
4. Manual approval gate for production deploys.

---

## Future Scope (SaaS) Deployment
- **Object storage** (S3/GCS) for uploads instead of local `uploads/` (enables multi-instance).
- **Queue + worker** (Redis/BullMQ) for OCR; API and workers scale independently.
- Load balancer across multiple stateless API instances.
- Optional **Docker/Compose or Kubernetes** for reproducible, scalable deploys.
- Separate OCR microservice (the spec's Python/cloud-OCR option) if higher accuracy is needed.
- Managed MongoDB (Atlas) with autoscaling and PITR backups.
