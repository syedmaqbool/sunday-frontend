export interface AdminPermission {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRole {
  id: string;
  name: string;
  permissions: AdminPermission[];
  createdAt: string;
  updatedAt: string;
}
