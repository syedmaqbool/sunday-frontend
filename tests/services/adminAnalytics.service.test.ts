import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exportAdminMarketingLeads,
  getAdminAnalytics,
  listAdminMarketingLeads,
} from '@/services/adminAnalytics.service';

const getMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/ky.instance', () => ({
  authInstance: {
    get: getMock,
  },
}));

describe('admin analytics service', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('requests the CSV export with only the active filters and returns the raw response', () => {
    const response = new Response('email,name\n');
    getMock.mockReturnValue(response);

    expect(exportAdminMarketingLeads({
      endTime: '2026-04-07T23:59:59.999Z',
      leadStatus: 'ENGAGED',
      search: 'ali',
      startTime: '2026-04-01T00:00:00.000Z',
    })).toBe(response);
    expect(getMock).toHaveBeenCalledWith(
      '/api/v1/admin/analytics/marketing-leads/export',
      { searchParams: {
        endTime: '2026-04-07T23:59:59.999Z',
        leadStatus: 'ENGAGED',
        search: 'ali',
        startTime: '2026-04-01T00:00:00.000Z',
      } },
    );
  });

  it('passes the date range to analytics and lead list requests', () => {
    const response = { json: vi.fn() };
    getMock.mockReturnValue(response);
    const dateRange = {
      endTime: '2026-04-07T23:59:59.999Z',
      startTime: '2026-04-01T00:00:00.000Z',
    };

    getAdminAnalytics(dateRange);
    expect(getMock).toHaveBeenNthCalledWith(1, '/api/v1/admin/analytics', {
      searchParams: dateRange,
    });

    listAdminMarketingLeads({ ...dateRange, page: 1, size: 50 });
    expect(getMock).toHaveBeenNthCalledWith(2, '/api/v1/admin/analytics/marketing-leads', {
      searchParams: { ...dateRange, page: 1, size: 50 },
    });
  });

  it('omits unset filters from the export request', () => {
    exportAdminMarketingLeads({ leadStatus: '', search: '' });

    expect(getMock).toHaveBeenCalledWith(
      '/api/v1/admin/analytics/marketing-leads/export',
      { searchParams: {} },
    );
  });
});
