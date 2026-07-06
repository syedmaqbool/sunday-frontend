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
  phone: string;
  roleName: string | null;
  status: AdminUserStatus;
  termsVersion?: string | null;
  username: string;
  marketingEmailConsentUpdatedAt?: string | null;
  termsAcceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminUserInput {
  roleId: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
}
