import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import { tokenStorage } from "@/lib/tokenStorage";

const NOTIFICATION_KEY = ["notifications"];

export const useNotifications = () =>
  useQuery({
    queryKey: NOTIFICATION_KEY,
    queryFn: async () => {
      const res = await notificationService.list();
      return res;
    },
    enabled: !!tokenStorage.getAccess(),
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      notificationService.markRead(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_KEY,
      });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      notificationService.markAllRead(),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_KEY,
      });
    },
  });
};

