import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { listAdminUsers, updateUserRole } from '@/services/user.service';

export const adminUsersQueryKey = {
  all: () => ['admin-users'] as const,
  list: (parameters: AdminUsersParams = {}) =>
    [...adminUsersQueryKey.all(), 'list', parameters] as const,
};

export interface AdminUsersParams {
  page?: number;
  search?: string;
  size?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export function getAdminUsersQueryOptions(parameters: AdminUsersParams = {}) {
  return queryOptions({
    queryFn: async () => {
      const response = await listAdminUsers(parameters);
      return response.data;
    },
    queryKey: adminUsersQueryKey.list(parameters),
  });
}

export function useAdminUsers(parameters: AdminUsersParams = {}) {
  return useQuery(getAdminUsersQueryOptions(parameters));
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      updateUserRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersQueryKey.all() });
    },
  });
}
