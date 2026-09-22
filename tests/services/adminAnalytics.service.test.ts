import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportAdminMarketingLeads } from '@/services/adminAnalytics.service';

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

    expect(exportAdminMarketingLeads({ leadStatus: 'ENGAGED', search: 'ali' })).toBe(response);
    expect(getMock).toHaveBeenCalledWith(
      '/api/v1/admin/analytics/marketing-leads/export',
      { searchParams: { leadStatus: 'ENGAGED', search: 'ali' } },
    );
  });

  it('omits unset filters from the export request', () => {
    exportAdminMarketingLeads({ leadStatus: '', search: '' });

    expect(getMock).toHaveBeenCalledWith(
      '/api/v1/admin/analytics/marketing-leads/export',
      { searchParams: {} },
    );
  });
});
