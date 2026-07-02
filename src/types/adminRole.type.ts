export interface AdminPermission {
  createdAt: string;
  id: string;
  name: string;
  updatedAt: string;
}

export interface AdminRole {
  createdAt: string;
  id: string;
  name: string;
  permissions: AdminPermission[];
  updatedAt: string;
}
