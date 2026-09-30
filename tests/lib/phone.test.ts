import { describe, expect, it } from 'vitest';
import { internationalPhoneSchema } from '@/lib/phone';

describe('internationalPhoneSchema', () => {
  it.each([
    ['+14155552671', '+14155552671'],
    ['+1 (415) 555-2671', '+14155552671'],
    [' +92 300-1234567 ', '+923001234567'],
  ])('normalizes %s to E.164', (input, expected) => {
    expect(internationalPhoneSchema.parse(input)).toBe(expected);
  });

  it.each([
    '0300 1234567',
    '+0123456789',
    '+1234567890123456',
  ])('rejects %s', (input) => {
    expect(internationalPhoneSchema.safeParse(input).success).toBe(false);
  });
});
