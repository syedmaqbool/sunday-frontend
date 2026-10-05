import type {
  AdminUserAuditHistoryParameters,
  CreateAdminUserInput,
  UpdateAdminUserProfileInput,
  UpdateAdminUserStatusInput,
} from '@/types/adminUser.type';
import type { ApiRequestQuery } from '@/types/api.type';
import type { GetAdminUsersData } from '@/types/generated-api';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAdminUser,
  getAdminUserAuditHistory,
  getAdminUserById,
  listAdminUsers,
  updateAdminUserProfile,
  updateAdminUserStatus,
  updateUserRole,
} from '@/services/user.service';

export const adminUsersQueryKey = {
  all: () => ['admin-users'] as const,
  detail: (userId: string) => [...adminUsersQueryKey.all(), 'detail', userId] as const,
  list: (parameters: AdminUsersParams = {}) =>
    [...adminUsersQueryKey.all(), 'list', parameters] as const,
};

export const adminUserAuditHistoryQueryKey = {
  all: () => [...adminUsersQueryKey.all(), 'audit-history'] as const,
  list: (userId: string, parameters: AdminUserAuditHistoryParameters = {}) =>
    [...adminUserAuditHistoryQueryKey.all(), 'list', userId, parameters] as const,
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

export function getAdminUserAuditHistoryQueryOptions(
  userId: string | null,
  parameters: AdminUserAuditHistoryParameters = {},
) {
  return queryOptions({
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId)
        throw new Error('A user must be selected before loading audit history.');

      return getAdminUserAuditHistory(userId, parameters);
    },
    queryKey: adminUserAuditHistoryQueryKey.list(userId ?? '', parameters),
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

export function useUpdateAdminUserProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateAdminUserProfileInput }) =>
      updateAdminUserProfile(userId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminUsersQueryKey.all() }),
        queryClient.invalidateQueries({ queryKey: adminUserAuditHistoryQueryKey.all() }),
      ]);
    },
  });
}

export function useUpdateAdminUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateAdminUserStatusInput }) =>
      updateAdminUserStatus(userId, payload),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: adminUsersQueryKey.all() });
    },
  });
}
