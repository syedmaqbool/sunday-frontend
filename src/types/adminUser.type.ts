export interface AdminUserImage {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

export type AdminUserStatus = 'ACTIVE' | 'INACTIVE';

export interface AdminUser {
  id: string;
  roleId: string | null;
  address: string;
  email: string;
  firstName: string;
  image: AdminUserImage | null;
  lastName: string;
  phone: string;
  roleName: string | null;
  status: AdminUserStatus;
  username: string;
  createdAt: string;
  updatedAt: string;
}
