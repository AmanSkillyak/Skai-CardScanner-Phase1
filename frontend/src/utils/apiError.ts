import axios from 'axios';

interface ApiErrorEnvelope {
  error?: string | {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const hasErrorEnvelope = (value: unknown): value is ApiErrorEnvelope =>
  isRecord(value) && 'error' in value;

const messageFromBody = (body: unknown): string | undefined => {
  if (!hasErrorEnvelope(body)) return undefined;
  const { error } = body;

  if (typeof error === 'string') return error;
  if (isRecord(error) && typeof error.message === 'string') return error.message;

  return undefined;
};

export const extractApiErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  if (axios.isAxiosError(error)) {
    return messageFromBody(error.response?.data) || error.message || fallback;
  }

  if (error instanceof Error) return error.message;

  return fallback;
};
