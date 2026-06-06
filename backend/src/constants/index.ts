export const API_PATHS = {
  health: '/api/health',
  scans: '/api/scans',
  contacts: '/api/contacts',
  categories: '/api/categories',
  exports: '/api/exports',
} as const;

export const SCAN_STATUS = {
  pending: 'pending',
  processing: 'processing',
  completed: 'completed',
  failed: 'failed',
} as const;

export const SCAN_STATUSES = Object.values(SCAN_STATUS);

const SCAN_RETENTION_HOURS = 72;

export const SCAN_RETENTION_MS = SCAN_RETENTION_HOURS * 60 * 60 * 1000;

export const UPLOAD_DIR = 'uploads/';

export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export const UPLOAD_ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.webp', '.pdf'] as const;

export const UPLOAD_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);

export const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 60);

export const LOCAL_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
] as const;
