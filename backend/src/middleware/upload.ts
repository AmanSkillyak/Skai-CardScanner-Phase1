import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  UPLOAD_ALLOWED_EXTENSIONS,
  UPLOAD_ALLOWED_MIME_TYPES,
  UPLOAD_DIR,
  UPLOAD_MAX_BYTES,
} from '../constants';

const ensureUploadDir = (): void => {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const token = crypto.randomBytes(16).toString('hex');
    cb(null, `card_${Date.now()}_${token}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const valid =
    UPLOAD_ALLOWED_EXTENSIONS.includes(extension as (typeof UPLOAD_ALLOWED_EXTENSIONS)[number]) &&
    UPLOAD_ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof UPLOAD_ALLOWED_MIME_TYPES)[number]);
  valid ? cb(null, true) : cb(new Error('Only JPG, JPEG, PNG, WEBP, PDF files are allowed'));
};

export default multer({ storage, fileFilter, limits: { fileSize: UPLOAD_MAX_BYTES } });
