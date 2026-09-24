import { HTTPError } from 'ky';
import { toast as sonnerToast } from 'sonner';

export function getErrorToastOptions(error: unknown, fallback = 'Something went wrong.') {
  return {
    description: error instanceof Error && error.message ? error.message : fallback,
    title: error instanceof HTTPError ? `Error ${error.response.status}` : 'Error',
    variant: 'destructive' as const,
  };
}

export function showErrorToast(error: unknown, fallback = 'Something went wrong.') {
  const { description, title } = getErrorToastOptions(error, fallback);
  sonnerToast.error(title, { description });
}
