import { format, parseISO } from 'date-fns';

export function joinFirstAndLastName(firstName: string | null | undefined, lastName: string | null | undefined) {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

export function formatDateOrValue(value: string, dateFormat: string) {
  // parseISO reads date-only values such as dateOfBirth as local dates; new Date() reads them as UTC.
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? value : format(date, dateFormat);
}
