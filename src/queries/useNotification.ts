import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service";
import { tokenStorage } from "@/lib/tokenStorage";

export const notificationsQueryKey = {
  all: () => ["notifications"] as const,
};

export const getNotificationsOptions = () =>
  queryOptions({
    queryKey: notificationsQueryKey.all(),
    queryFn: async () => {
      const res = await listNotifications();
      return res;
    },
    enabled: !!tokenStorage.getAccess(),
  });

export const useNotifications = () => useQuery(getNotificationsOptions());

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationsQueryKey.all(),
      });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationsQueryKey.all(),
      });
    },
  });
};
