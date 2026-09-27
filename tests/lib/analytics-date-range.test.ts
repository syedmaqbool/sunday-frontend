import { describe, expect, it } from 'vitest';
import { getAnalyticsDateRange } from '@/lib/analyticsDateRange';

describe('getAnalyticsDateRange', () => {
  const referenceDate = new Date(2026, 8, 27, 14, 35, 42, 123);

  it('omits both timestamps for all time', () => {
    expect(getAnalyticsDateRange('all', referenceDate)).toEqual({});
  });

  it('returns the local start and end of today', () => {
    expect(getAnalyticsDateRange('today', referenceDate)).toEqual({
      endTime: new Date(2026, 8, 27, 23, 59, 59, 999).toISOString(),
      startTime: new Date(2026, 8, 27, 0, 0, 0, 0).toISOString(),
    });
  });

  it('includes today and the prior six calendar days for the last seven days', () => {
    expect(getAnalyticsDateRange('7d', referenceDate)).toEqual({
      endTime: new Date(2026, 8, 27, 23, 59, 59, 999).toISOString(),
      startTime: new Date(2026, 8, 21, 0, 0, 0, 0).toISOString(),
    });
  });

  it('starts this month on the first local day and ends at the end of today', () => {
    expect(getAnalyticsDateRange('month', referenceDate)).toEqual({
      endTime: new Date(2026, 8, 27, 23, 59, 59, 999).toISOString(),
      startTime: new Date(2026, 8, 1, 0, 0, 0, 0).toISOString(),
    });
  });
});
