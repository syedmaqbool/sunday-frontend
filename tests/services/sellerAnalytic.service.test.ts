import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSellerAnalytics } from '@/services/selleranalytic.service';

const getMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/ky.instance', () => ({
  authInstance: {
    get: getMock,
  },
}));

describe('seller analytics service', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('passes the requested date range to seller analytics', () => {
    const response = { json: vi.fn() };
    getMock.mockReturnValue(response);
    const dateRange = {
      endTime: '2026-04-07T23:59:59.999Z',
      startTime: '2026-04-01T00:00:00.000Z',
    };

    getSellerAnalytics(dateRange);

    expect(getMock).toHaveBeenCalledWith('/api/v1/me/seller-analytics', {
      searchParams: dateRange,
    });
  });
});
