import { apiClient } from "@/lib/apiClient";

interface ListResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    lastPage: number;
    nextPage: number | null;
    prevPage: number | null;
    perPage: number;
    total: number;
  };
}

interface ItemResponse<T> {
  data: T;
}

export interface Notification {
  id: string;
  entityId: string | null;
  userId: string;
  body: string;
  audience: "USER" | "ADMIN";
  entityType: string | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  title: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export const notificationService = {
  list: (page = 1, size = 20) =>
    apiClient.get<ListResponse<Notification>>(
      `/api/v1/me/notifications?page=${page}&size=${size}`
    ),

  markRead: (notificationId: string) =>
    apiClient.post<ItemResponse<Notification>>(
      `/api/v1/me/notifications/${notificationId}/read`,
      {}
    ),

  markAllRead: () =>
    apiClient.post(
      `/api/v1/me/notifications/read`,
      {}
    ),
};

