import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";

const USERS_KEY = ["admin-users"];

export const useAdminUsers = (params: { page?: number; size?: number; search?: string; status?: "ACTIVE" | "INACTIVE" } = {}) =>
  useQuery({
    queryKey: [...USERS_KEY, params],
    queryFn: async () => {
      const res = await userService.list(params);
      return res.data;
    },
  });

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      userService.updateRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
};