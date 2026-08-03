import type { BeforeErrorState } from 'ky';
import type { ErrorResponse, FieldError } from '@/types/response.type';
import ky, { HTTPError } from 'ky';

export const API_BASE_URL
  = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

interface ApiErrorDetails {
  code?: string;
  fieldErrors?: FieldError[];
}

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
  if (error instanceof HTTPError) {
    let body: ErrorResponse | null = null;
    try {
      body = await error.response.json<ErrorResponse>();
    }
    catch {
      body = null;
    }
    error.message = body?.message ?? `Request failed: ${error.response.status}`;
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
