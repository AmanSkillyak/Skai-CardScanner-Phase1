import { NextFunction, Request, Response } from 'express';
import { CategorySuggestPayload, ContactWritePayload, ExportRequestBody } from '../types';
import { createError } from '../utils/apiError';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED_RE = /^[+\d\s().-]+$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isEmptyObject = (value: unknown): boolean =>
  isPlainObject(value) && Object.keys(value).length === 0;

const asStringArray = (value: unknown): string[] | null => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  return value.every(item => typeof item === 'string') ? value : null;
};

const hasInvalidEmails = (emails: string[]): boolean =>
  emails.some(email => email.trim() !== '' && !EMAIL_RE.test(email.trim()));

const hasInvalidPhones = (phones: string[]): boolean =>
  phones.some(phone => {
    const trimmed = phone.trim();
    const digits = trimmed.replace(/\D/g, '');
    return trimmed !== '' && (!PHONE_ALLOWED_RE.test(trimmed) || digits.length < 6 || digits.length > 20);
  });

export const validateContactBody = (req: Request<unknown, unknown, ContactWritePayload>, _res: Response, next: NextFunction): void => {
  if (isEmptyObject(req.body)) {
    next(createError(400, 'VALIDATION_ERROR', 'Request body cannot be empty'));
    return;
  }

  const emails = asStringArray(req.body?.emails);
  if (!emails) {
    next(createError(400, 'VALIDATION_ERROR', 'emails must be an array of strings'));
    return;
  }
  if (hasInvalidEmails(emails)) {
    next(createError(400, 'VALIDATION_ERROR', 'One or more emails are invalid'));
    return;
  }

  const phones = asStringArray(req.body?.phones);
  if (!phones) {
    next(createError(400, 'VALIDATION_ERROR', 'phones must be an array of strings'));
    return;
  }
  if (hasInvalidPhones(phones)) {
    next(createError(400, 'VALIDATION_ERROR', 'One or more phone numbers are invalid'));
    return;
  }

  next();
};

export const validateExportBody = (req: Request<unknown, unknown, ExportRequestBody>, _res: Response, next: NextFunction): void => {
  const { ids, contact_ids } = req.body || {};

  if ((Array.isArray(ids) && ids.length === 0) || (Array.isArray(contact_ids) && contact_ids.length === 0)) {
    next(createError(400, 'VALIDATION_ERROR', 'Export ids cannot be an empty array'));
    return;
  }

  next();
};

export const validateCategorySuggestBody = (req: Request<unknown, unknown, CategorySuggestPayload>, _res: Response, next: NextFunction): void => {
  const body = req.body || {};
  const rawText = typeof body.raw_text === 'string' ? body.raw_text.trim() : '';
  const rawOcrText = typeof body.raw_ocr_text === 'string' ? body.raw_ocr_text.trim() : '';
  const keywords = Array.isArray(body.keywords) ? body.keywords.filter((item: unknown) => typeof item === 'string' && item.trim()) : [];

  if (!rawText && !rawOcrText && keywords.length === 0) {
    next(createError(400, 'VALIDATION_ERROR', 'raw_text, raw_ocr_text, or keywords is required'));
    return;
  }

  next();
};
