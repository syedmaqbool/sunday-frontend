import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAdminRole,
  deleteAdminRole,
  listAdminPermissions,
  listAdminRoles,
  updateAdminRole,
  updateAdminRolePermissions,
} from '@/services/adminRole.service';

export const adminRoleQueryKey = {
  all: () => ['admin-role'] as const,
  permissions: () => [...adminRoleQueryKey.all(), 'permissions', 'list'] as const,
  roles: () => [...adminRoleQueryKey.all(), 'roles', 'list'] as const,
};

export function getAdminRolesQueryOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listAdminRoles();
      return response.data;
    },
    queryKey: adminRoleQueryKey.roles(),
  });
}

export function getAdminPermissionsQueryOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listAdminPermissions();
      return response.data;
    },
    queryKey: adminRoleQueryKey.permissions(),
  });
}

export function useCreateAdminRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRoleQueryKey.roles() });
    },
  });
}

export function useDeleteAdminRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRoleQueryKey.roles() });
    },
  });
}

export function useUpdateAdminRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: { name: string } }) =>
      updateAdminRole(roleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRoleQueryKey.roles() });
    },
  });
}

export function useUpdateAdminRolePermissionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      {
        roleId,
        payload,
      }: {
        roleId: string;
        payload: { permissions: string[] };
      },
    ) => updateAdminRolePermissions(roleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRoleQueryKey.roles() });
    },
  });
}
