import { describe, expect, it } from 'vitest';
import { getBoostPurchaseDisplayStatus, isBoostPaidAndWithinActiveWindow } from '@/lib/boostStatus';

describe('boost status', () => {
  const now = Date.parse('2026-10-18T12:00:00.000Z');

  it('counts a boost as active only when paid and inside its start and end times', () => {
    expect(isBoostPaidAndWithinActiveWindow({
      paymentStatus: 'PAID',
      endsAt: '2026-10-20T12:00:00.000Z',
      startsAt: '2026-10-18T11:00:00.000Z',
    }, now)).toBe(true);
    expect(isBoostPaidAndWithinActiveWindow({
      paymentStatus: 'MOCK',
      endsAt: '2026-10-20T12:00:00.000Z',
      startsAt: '2026-10-18T11:00:00.000Z',
    }, now)).toBe(false);
    expect(isBoostPaidAndWithinActiveWindow({
      paymentStatus: 'PAID',
      endsAt: '2026-10-20T12:00:00.000Z',
      startsAt: '2026-10-18T13:00:00.000Z',
    }, now)).toBe(false);
  });

  it('uses one purchase status classification for active and review states', () => {
    const purchase = {
      boosts: [{
        paymentStatus: 'PAID' as const,
        endsAt: '2026-10-20T12:00:00.000Z',
        startsAt: '2026-10-18T11:00:00.000Z',
      }],
      status: 'APPROVED' as const,
    };

    expect(getBoostPurchaseDisplayStatus(purchase, now)).toBe('ACTIVE');
    expect(getBoostPurchaseDisplayStatus({ ...purchase, status: 'REFUNDED' }, now)).toBe('REFUNDED');
  });
});
