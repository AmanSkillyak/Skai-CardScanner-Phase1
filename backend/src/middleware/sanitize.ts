import { NextFunction, Request, Response } from 'express';
import { createError } from '../utils/apiError';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const hasUnsafeKey = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(hasUnsafeKey);
  if (!isRecord(value)) return false;

  return Object.entries(value).some(([key, nested]) => (
    key.startsWith('$') || key.includes('.') || hasUnsafeKey(nested)
  ));
};

export const rejectUnsafeKeys = (req: Request, _res: Response, next: NextFunction): void => {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query)) {
    next(createError(400, 'VALIDATION_ERROR', 'Request contains unsupported object keys'));
    return;
  }

  next();
};
