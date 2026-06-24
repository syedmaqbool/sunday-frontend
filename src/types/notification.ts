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
