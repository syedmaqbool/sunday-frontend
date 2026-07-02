import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BarChart3,
  Filter,
  Flag,
  FolderTree,
  Headphones,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  MessageSquareWarning,
  Package,
  Percent,
  Percent as PercentIcon,
  Rocket,
  ShieldCheck,
  Tag,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import type { PermissionRequirement } from '@/lib/adminAccess';
import { canUser } from '@/lib/adminAccess';
import type { AuthUser } from '@/types/auth.type';

export interface AdminNavItem {
  adminOnly?: boolean;
  icon: LucideIcon;
  label: string;
  path: string;
  permission?: PermissionRequirement;
}

export interface AdminNavSection {
  items: AdminNavItem[];
  label: string;
}

export const adminNavSections: AdminNavSection[] = [
  {
    items: [
      { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', permission: 'ANALYTICS_READ' },
      { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', permission: 'ANALYTICS_READ' },
      { path: '/admin/site-settings', icon: ImageIcon, label: 'Site Settings', permission: 'SETTINGS_READ' },
    ],
    label: 'Overview',
  },
  {
    items: [
      { path: '/admin/listings', icon: ShieldCheck, label: 'Listings', permission: 'LISTINGS_READ' },
      { path: '/admin/orders', icon: Package, label: 'Orders', permission: 'ORDERS_READ' },
      { path: '/admin/categories', icon: FolderTree, label: 'Categories', permission: 'CATALOG_READ' },
      { path: '/admin/brands', icon: Tag, label: 'Brands', permission: 'BRANDS_READ' },
      { path: '/admin/discounts', icon: Tag, label: 'Discounts', permission: 'SETTINGS_READ' },
      { path: '/admin/seller-coupons', icon: Tag, label: 'Seller Coupons', permission: 'SELLER_COUPONS_READ' },
      { path: '/admin/tax', icon: Percent, label: 'Tax Settings', permission: 'SETTINGS_READ' },
      { path: '/admin/boosts', icon: Rocket, label: 'Boosts', permission: 'BOOSTS_READ' },
      { path: '/admin/payouts', icon: Wallet, label: 'Payouts', permission: 'PAYOUTS_READ' },
      { path: '/admin/commission', icon: PercentIcon, label: 'Commission', adminOnly: true },
    ],
    label: 'Marketplace',
  },
  {
    items: [
      { path: '/admin/complaints', icon: AlertTriangle, label: 'Complaints', permission: 'COMPLAINTS_READ' },
      { path: '/admin/messages', icon: MessageSquareWarning, label: 'Messages', permission: 'MESSAGES_READ' },
      { path: '/admin/flag-keywords', icon: Filter, label: 'Keywords', adminOnly: true },
      { path: '/admin/reports', icon: Flag, label: 'Reports', permission: 'REPORTS_READ' },
    ],
    label: 'Trust & Safety',
  },
  {
    items: [
      { path: '/admin/support', icon: Headphones, label: 'Support', permission: 'SUPPORT_TICKETS_READ' },
      { path: '/admin/help', icon: LifeBuoy, label: 'Help Center', adminOnly: true },
      { path: '/admin/users', icon: Users, label: 'Platform Users', permission: 'USERS_READ' },
      { path: '/admin/email-templates', icon: Mail, label: 'Email Templates', permission: 'SETTINGS_READ' },
    ],
    label: 'Customer',
  },
  {
    items: [
      { path: '/admin/access-control/staff-users', icon: UserCog, label: 'Staff Users', adminOnly: true },
      { path: '/admin/access-control/roles', icon: KeyRound, label: 'Roles & Permissions', adminOnly: true },
    ],
    label: 'Access Control',
  },
];

export const adminNavItems = adminNavSections.flatMap(section => section.items);

export function isNavItemActive(path: string, pathname: string) {
  return path === '/admin'
    ? pathname === '/admin'
    : pathname.startsWith(path);
}

export function canAccessNavItem(
  item: AdminNavItem,
  user: AuthUser | null | undefined,
) {
  if (!user)
    return false;
  if (item.adminOnly)
    return user.roleName === 'ADMIN';
  return canUser(user, item.permission);
}

export function getVisibleAdminSections(user: AuthUser | null | undefined) {
  return adminNavSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => canAccessNavItem(item, user)),
    }))
    .filter(section => section.items.length > 0);
}

export function findAdminNavItem(pathname: string) {
  return adminNavItems.find(item => isNavItemActive(item.path, pathname)) ?? null;
}

export function getFirstAccessibleAdminPath(user: AuthUser | null | undefined) {
  return adminNavItems.find(item => canAccessNavItem(item, user))?.path ?? null;
}
