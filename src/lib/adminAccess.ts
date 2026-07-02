import type { AuthUser } from '@/types/auth.type';

export type AdminPermissionName = string;
export type PermissionRequirement
  = AdminPermissionName
    | AdminPermissionName[]
    | null
    | undefined;

export const ADMIN_SHELL_PERMISSIONS = [
  'ANALYTICS_READ',
  'BOOSTS_READ',
  'BRANDS_READ',
  'CATALOG_READ',
  'COMPLAINTS_READ',
  'LISTINGS_READ',
  'MARKETING_LEADS_READ',
  'MESSAGES_READ',
  'ORDERS_READ',
  'PAYOUTS_READ',
  'REPORTS_READ',
  'SELLER_COUPONS_READ',
  'SETTINGS_READ',
  'SUPPORT_TICKETS_READ',
  'USERS_READ',
] as const;

export function isAdminUser(user: AuthUser | null | undefined) {
  return user?.roleName === 'ADMIN';
}

export function hasPermission(
  user: AuthUser | null | undefined,
  permission: AdminPermissionName,
) {
  return user?.permissions?.some(item => item.name === permission) ?? false;
}

export function hasPermissions(
  user: AuthUser | null | undefined,
  permissions: AdminPermissionName[],
) {
  return permissions.every(permission => hasPermission(user, permission));
}

export function canUser(
  user: AuthUser | null | undefined,
  requirement: PermissionRequirement,
) {
  if (!user)
    return false;
  if (isAdminUser(user))
    return true;
  if (!requirement)
    return true;

  return Array.isArray(requirement)
    ? hasPermissions(user, requirement)
    : hasPermission(user, requirement);
}

export function canAccessAdminPortal(user: AuthUser | null | undefined) {
  if (!user)
    return false;
  if (isAdminUser(user))
    return true;
  return ADMIN_SHELL_PERMISSIONS.some(permission => hasPermission(user, permission));
}
