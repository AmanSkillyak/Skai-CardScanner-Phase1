import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ApiError, errorResponse } from '../utils/apiError';

interface AppError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err.message);

  if (err instanceof ApiError) {
    res.status(err.status).json(errorResponse(err.code, err.message, err.details));
    return;
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file is too large' : err.message;
    res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json(errorResponse('UPLOAD_ERROR', message));
    return;
  }

  if (err.message === 'Only JPG, JPEG, PNG, WEBP, PDF files are allowed') {
    res.status(415).json(errorResponse('UPLOAD_ERROR', err.message));
    return;
  }

  res.status(err.status || 500).json(errorResponse(err.code || 'INTERNAL_ERROR', err.message || 'Server error', err.details));
};
