export interface Notification {
  id: string;
  entityId: string | null;
  userId: string;
  audience: 'ADMIN' | 'USER';
  body: string;
  entityType: string | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  title: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}
