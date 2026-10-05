import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adminUserAuditHistoryQueryKey,
  adminUsersQueryKey,
  getAdminUserAuditHistoryQueryOptions,
  useUpdateAdminUserProfileMutation,
} from '@/queries/adminUsers.query';

const userService = vi.hoisted(() => ({
  getAdminUserById: vi.fn(),
  createAdminUser: vi.fn(),
  getAdminUserAuditHistory: vi.fn(),
  listAdminUsers: vi.fn(),
  updateAdminUserProfile: vi.fn(),
  updateUserRole: vi.fn(),
}));

vi.mock('@/services/user.service', () => userService);

const auditResponse = {
  data: [{
    id: 'audit-id',
    actor: { id: 'admin-id', email: 'admin@example.com', firstName: 'Noor', lastName: 'Khan' },
    changedFields: ['firstName'],
    eventType: 'PROFILE_EDITED',
    reason: null,
    resultingStatus: null,
    createdAt: '2026-09-12T14:30:00.000Z',
  }],
  message: 'Audit history loaded',
  pagination: { currentPage: 2, lastPage: 2, nextPage: null, perPage: 10, prevPage: 1, total: 11 },
  statusCode: 200,
};

function MutationHarness({ onReady }: { onReady: (mutation: ReturnType<typeof useUpdateAdminUserProfileMutation>) => void }) {
  const mutation = useUpdateAdminUserProfileMutation();

  useEffect(() => onReady(mutation), [mutation, onReady]);
  return null;
}

describe('admin user audit history query', () => {
  beforeEach(() => {
    userService.getAdminUserAuditHistory.mockReset().mockResolvedValue(auditResponse);
    userService.updateAdminUserProfile.mockReset().mockResolvedValue({ data: { id: 'user-id' } });
  });

  it('uses a paginated audit-history key and preserves the raw response', async () => {
    const parameters = { page: 2, size: 10 };
    const options = getAdminUserAuditHistoryQueryOptions('user-id', parameters);

    expect(options.queryKey).toEqual(adminUserAuditHistoryQueryKey.list('user-id', parameters));
    await expect(new QueryClient().fetchQuery(options)).resolves.toBe(auditResponse);
    expect(userService.getAdminUserAuditHistory).toHaveBeenCalledWith('user-id', parameters);
  });

  it('refreshes user details, lists, and audit history after a profile edit', async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
    let mutation: ReturnType<typeof useUpdateAdminUserProfileMutation> | undefined;

    render(
      <QueryClientProvider client={queryClient}>
        <MutationHarness onReady={(value) => { mutation = value; }} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mutation).toBeDefined());
    const response = { data: { id: 'user-id', firstName: 'Amina Noor' } };
    userService.updateAdminUserProfile.mockResolvedValue(response);
    await expect(mutation!.mutateAsync({
      userId: 'user-id',
      payload: { firstName: 'Amina Noor' },
    })).resolves.toBe(response);

    expect(userService.updateAdminUserProfile).toHaveBeenCalledWith('user-id', { firstName: 'Amina Noor' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: adminUsersQueryKey.all() });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: adminUserAuditHistoryQueryKey.all() });
  });
});
