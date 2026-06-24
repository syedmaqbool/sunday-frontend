export interface AdminUserImage {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

export type AdminUserStatus = "ACTIVE" | "INACTIVE";

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phone: string;
  status: AdminUserStatus;
  username: string;
  image: AdminUserImage | null;
  roleId: string | null;
  roleName: string | null;
  createdAt: string;
  updatedAt: string;
}
