import { describe, expect, it } from 'vitest';
import { formatEnumLabel } from '@/lib/utilities';

describe('formatEnumLabel', () => {
  it('converts SCREAMING_SNAKE_CASE to Title Case with spaces', () => {
    expect(formatEnumLabel('AWAITING_PAYMENT')).toBe('Awaiting Payment');
    expect(formatEnumLabel('PENDING')).toBe('Pending');
    expect(formatEnumLabel('CONFIRMED')).toBe('Confirmed');
    expect(formatEnumLabel('PARTIALLY_DELIVERED')).toBe('Partially Delivered');
  });

  it('also handles lowercase snake_case values, e.g. listing condition', () => {
    expect(formatEnumLabel('new_with_tags')).toBe('New With Tags');
  });
});
