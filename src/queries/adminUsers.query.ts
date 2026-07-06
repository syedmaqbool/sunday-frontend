import type {
  AdminUserRoleType,
  CreateAdminUserInput,
} from '@/types/adminUser.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { createAdminUser, listAdminUsers, updateUserRole } from '@/services/user.service';

export const adminUsersQueryKey = {
  all: () => ['admin-users'] as const,
  list: (parameters: AdminUsersParams = {}) =>
    [...adminUsersQueryKey.all(), 'list', parameters] as const,
};

export interface AdminUsersParams {
  page?: number;
  roleType?: AdminUserRoleType;
  search?: string;
  size?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export function getAdminUsersQueryOptions(parameters: AdminUsersParams = {}) {
  return queryOptions({
    queryFn: async () => {
      return listAdminUsers(parameters);
    },
    queryKey: adminUsersQueryKey.list(parameters),
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
