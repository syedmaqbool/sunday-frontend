export interface AdminUserImage {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

export type AdminUserStatus = 'ACTIVE' | 'INACTIVE';
export type AdminUserRoleType = 'STAFF' | 'USER';

export interface AdminUser {
  id: string;
  roleId: string | null;
  address: string;
  email: string;
  firstName: string;
  image: AdminUserImage | null;
  lastName: string;
  marketingEmailConsent: boolean;
  marketingEmailConsentUpdatedAt?: string | null;
  phone: string;
  roleName: string | null;
  status: AdminUserStatus;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminUserInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  roleId: string;
}
