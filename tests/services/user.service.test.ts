import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminUserAuditHistory, updateAdminUserProfile } from '@/services/user.service';

const { getMock, patchMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  patchMock: vi.fn(),
}));

vi.mock('@/services/ky.instance', () => ({
  authInstance: {
    get: getMock,
    patch: patchMock,
  },
}));

describe('admin user service', () => {
  beforeEach(() => {
    getMock.mockReset();
    patchMock.mockReset();
  });

  it('requests paginated profile audit history and returns the raw response', async () => {
    const response = { data: [{ id: 'audit-id' }], pagination: { currentPage: 2 } };
    const json = vi.fn().mockResolvedValue(response);
    getMock.mockReturnValue({ json });

    await expect(getAdminUserAuditHistory('user-id', { page: 2, size: 10 })).resolves.toBe(response);
    expect(getMock).toHaveBeenCalledWith('/api/v1/admin/users/user-id/audit-history', {
      searchParams: { page: 2, size: 10 },
    });
  });

  it('patches only the supplied profile fields and returns the raw response', async () => {
    const response = { data: { id: 'user-id', firstName: 'Amina Noor' } };
    const json = vi.fn().mockResolvedValue(response);
    patchMock.mockReturnValue({ json });

    await expect(updateAdminUserProfile('user-id', { firstName: 'Amina Noor' })).resolves.toBe(response);
    expect(patchMock).toHaveBeenCalledWith('/api/v1/admin/users/user-id', {
      json: { firstName: 'Amina Noor' },
    });
  });
});
