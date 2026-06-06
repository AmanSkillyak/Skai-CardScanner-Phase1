import { ApiErrorCode, ApiErrorResponse } from '../types';

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const createError = (
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
): ApiError => new ApiError(status, code, message, details);

export const errorResponse = (code: string, message: string, details?: unknown): ApiErrorResponse => ({
  error: details === undefined ? { code, message } : { code, message, details },
});
