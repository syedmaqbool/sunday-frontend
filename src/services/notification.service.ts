import type { Notification, NotificationReadStatus } from '@/types/notification.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listNotifications(page = 1, size = 20, status?: NotificationReadStatus) {
  return authInstance
    .get('/api/v1/me/notifications', { searchParams: { page, size, ...(status && { status }) } })
    .json<PaginatedResponse<Notification>>();
}

export function markNotificationRead(notificationId: string) {
  return authInstance
    .post(`/api/v1/me/notifications/${notificationId}/read`, { json: {} })
    .json<Response<Notification>>();
}

export function markAllNotificationsRead() {
  return authInstance
    .post('/api/v1/me/notifications/read', { json: {} })
    .json<Response>();
}
