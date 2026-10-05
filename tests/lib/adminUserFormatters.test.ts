import { describe, expect, it } from 'vitest';
import { formatDateOrValue, joinFirstAndLastName } from '@/lib/adminUserFormatters';

describe('joinFirstAndLastName', () => {
  it('joins available first and last names with one space', () => {
    expect(joinFirstAndLastName('Noor', 'Khan')).toBe('Noor Khan');
    expect(joinFirstAndLastName('Noor', '')).toBe('Noor');
    expect(joinFirstAndLastName('', 'Khan')).toBe('Khan');
    expect(joinFirstAndLastName('', '')).toBe('');
  });
});

describe('formatDateOrValue', () => {
  it('formats valid date strings with the requested date pattern', () => {
    expect(formatDateOrValue('2026-01-05T12:30:00', 'MMM d, yyyy h:mm a')).toBe('Jan 5, 2026 12:30 PM');
  });

  it('returns invalid date strings unchanged', () => {
    expect(formatDateOrValue('date unavailable', 'MMM d, yyyy')).toBe('date unavailable');
  });
});
