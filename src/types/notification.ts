export interface Notification {
  id: string;
  entityId: string | null;
  userId: string;
  audience: 'ADMIN' | 'USER';
  body: string;
  entityType: string | null;
  metadata: Record<string, unknown>;
  title: string;
  type: string;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}
