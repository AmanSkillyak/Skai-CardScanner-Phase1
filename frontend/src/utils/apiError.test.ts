import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { extractApiErrorMessage } from './apiError';

const axiosErrorWithData = (data: unknown) => {
  const error = new AxiosError('Request failed');
  error.response = {
    data,
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
};

describe('extractApiErrorMessage', () => {
  it('extracts old error shape', () => {
    const error = axiosErrorWithData({ error: 'Old shape failed' });

    expect(extractApiErrorMessage(error)).toBe('Old shape failed');
  });

  it('extracts new error envelope shape', () => {
    const error = axiosErrorWithData({
      error: { code: 'VALIDATION_ERROR', message: 'New shape failed' },
    });

    expect(extractApiErrorMessage(error)).toBe('New shape failed');
  });

  it('falls back for unknown errors', () => {
    expect(extractApiErrorMessage('nope', 'Fallback message')).toBe('Fallback message');
  });
});
