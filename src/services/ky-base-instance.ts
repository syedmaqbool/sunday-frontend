import type { BeforeErrorState } from 'ky';
import type { ErrorResponse, FieldError } from '@/types/response.type';
import ky, { HTTPError, isNetworkError } from 'ky';

export const API_BASE_URL
  = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

type ApiErrorDetails = Pick<ErrorResponse, 'code' | 'fieldErrors'>;

export function getApiErrorCode(error: unknown): string | undefined {
  return error instanceof HTTPError
    ? (error as HTTPError & ApiErrorDetails).code
    : undefined;
}

export function getApiFieldErrors(error: unknown): FieldError[] | undefined {
  return error instanceof HTTPError
    ? (error as HTTPError & ApiErrorDetails).fieldErrors
    : undefined;
}

async function normalizeError({ error, options: _options, request: _request }: BeforeErrorState) {
  if (isNetworkError(error)) {
    error.message = 'Request failed. Please check your internet connection.';
  }
  else if (error instanceof HTTPError) {
    let body: ErrorResponse | null = null;
    let responseBody = '';
    const errorData = error.data;

    if (typeof errorData === 'string') {
      responseBody = errorData;
      try {
        const parsedBody = JSON.parse(errorData) as unknown;
        if (parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody)) {
          body = parsedBody as ErrorResponse;
        }
      }
      catch {
        body = null;
      }
    }
    else if (errorData !== undefined && errorData !== null) {
      responseBody = JSON.stringify(errorData) ?? '';
      if (typeof errorData === 'object' && !Array.isArray(errorData)) {
        body = errorData as ErrorResponse;
      }
    }

    const bodyMessage = typeof body?.message === 'string' ? body.message.trim() : '';
    const bodyError = typeof body?.error === 'string' ? body.error.trim() : '';

    error.message = bodyMessage
      || bodyError
      || responseBody.trim()
      || `Request failed: ${error.response.status}`;
    Object.assign(error, {
      code: body?.code,
      fieldErrors: body?.fieldErrors,
    } satisfies ApiErrorDetails);
  }

  return error;
}

const base = ky.create({
  hooks: {
    beforeError: [normalizeError],
  },
  timeout: 90_000,
});

export default base;
