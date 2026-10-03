import type { NotificationReadStatus } from '@/types/notification.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@/lib/tokenStorage';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notification.service';

export const notificationsQueryKey = {
  all: () => ['notifications'] as const,
  list: (status?: NotificationReadStatus) => [...notificationsQueryKey.all(), 'list', status ?? 'ALL'] as const,
};

export function getNotificationsOptions(status?: NotificationReadStatus) {
  return queryOptions({
    enabled: !!tokenStorage.getAccess(),
    queryFn: async () => {
      const response = await listNotifications(1, 20, status);
      return response;
    },
    queryKey: notificationsQueryKey.list(status),
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
