import type { Notification } from '@/types/notification.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listNotifications(page = 1, size = 20) {
  return authInstance
    .get('/api/v1/me/notifications', { searchParams: { page, size } })
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
