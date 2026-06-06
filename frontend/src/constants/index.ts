export const API_BASE_PATH = import.meta.env.VITE_API_BASE_URL || '/api';

export const API_ENDPOINTS = {
  scans: '/scans',
  contacts: '/contacts',
  categories: '/categories',
  categorySuggest: '/categories/suggest',
  exports: '/exports',
} as const;

export const SCAN_STATUS = {
  processing: 'processing',
  completed: 'completed',
} as const;

export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export const UPLOAD_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'] as const;

export const UPLOAD_ACCEPT = UPLOAD_ALLOWED_EXTENSIONS.join(',');

export const CAMERA_CAPTURE_MIME_TYPE = 'image/jpeg';

export const EXPORT_FORMATS = ['csv', 'xlsx'] as const;
