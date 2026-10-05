import { format } from 'date-fns';

export function joinFirstAndLastName(firstName: string | null | undefined, lastName: string | null | undefined) {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

export function formatDateOrValue(value: string, dateFormat: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : format(date, dateFormat);
}
