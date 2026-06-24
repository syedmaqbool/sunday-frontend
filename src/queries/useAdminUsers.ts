import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { listAdminUsers, updateUserRole } from "@/services/user.service";

export const adminUsersQueryKey = {
  all: () => ["admin-users"] as const,
  list: (params: AdminUsersParams = {}) =>
    [...adminUsersQueryKey.all(), "list", params] as const,
};

export type AdminUsersParams = {
  page?: number;
  size?: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export const getAdminUsersQueryOptions = (params: AdminUsersParams = {}) =>
  queryOptions({
    queryKey: adminUsersQueryKey.list(params),
    queryFn: async () => {
      const res = await listAdminUsers(params);
      return res.data;
    },
  });

export const useAdminUsers = (params: AdminUsersParams = {}) =>
  useQuery(getAdminUsersQueryOptions(params));

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      updateUserRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersQueryKey.all() });
    },
  });
};
