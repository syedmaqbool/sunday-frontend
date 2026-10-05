import type { CreateAdminUserInput } from '@/types/adminUser.type';
import type { ApiRequestQuery } from '@/types/api.type';
import type { GetAdminUsersData } from '@/types/generated-api';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { createAdminUser, getAdminUserById, listAdminUsers, updateUserRole } from '@/services/user.service';

export const adminUsersQueryKey = {
  all: () => ['admin-users'] as const,
  detail: (userId: string) => [...adminUsersQueryKey.all(), 'detail', userId] as const,
  list: (parameters: AdminUsersParams = {}) =>
    [...adminUsersQueryKey.all(), 'list', parameters] as const,
};

export type AdminUsersParams = Partial<ApiRequestQuery<GetAdminUsersData>>;

export function getAdminUsersQueryOptions(parameters: AdminUsersParams = {}) {
  return queryOptions({
    queryFn: async () => {
      return listAdminUsers(parameters);
    },
    queryKey: adminUsersQueryKey.list(parameters),
  });
}

export function getAdminUserByIdQueryOptions(userId: string | null) {
  return queryOptions({
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId)
        throw new Error('A user must be selected before loading details.');

      return getAdminUserById(userId);
    },
    queryKey: adminUsersQueryKey.detail(userId ?? ''),
  });
}

export function useCreateAdminUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminUserInput) => createAdminUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersQueryKey.all() });
    },
  });
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      updateUserRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersQueryKey.all() });
    },
  });
}
