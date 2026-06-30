import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@/lib/tokenStorage';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notification.service';

export const notificationsQueryKey = {
  all: () => ['notifications'] as const,
};

export function getNotificationsOptions() {
  return queryOptions({
    enabled: !!tokenStorage.getAccess(),
    queryFn: async () => {
      const response = await listNotifications();
      return response;
    },
    queryKey: notificationsQueryKey.all(),
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationsQueryKey.all(),
      });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationsQueryKey.all(),
      });
    },
  });
}
