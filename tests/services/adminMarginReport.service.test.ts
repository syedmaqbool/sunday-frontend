import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminMarginReport } from '@/services/adminMarginReport.service';

const getMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/ky.instance', () => ({
  authInstance: { get: getMock },
}));

describe('admin margin report service', () => {
  beforeEach(() => getMock.mockReset());

  it('sends active filters and pagination to the generated report endpoint', async () => {
    const response = { aggregates: {}, data: [], pagination: {} };
    const jsonMock = vi.fn().mockResolvedValue(response);
    getMock.mockReturnValue({ json: jsonMock });
    const parameters = {
      from: '2026-09-22T12:34:56.789Z',
      marginFilter: 'negative' as const,
      page: 2,
      search: 'Ali',
      size: 20,
      to: '2026-09-29T12:34:56.789Z',
    };

    await expect(getAdminMarginReport(parameters)).resolves.toBe(response);

    expect(getMock).toHaveBeenCalledWith('/api/v1/admin/margins', {
      searchParams: parameters,
    });
    expect(jsonMock).toHaveBeenCalledOnce();
  });
});
