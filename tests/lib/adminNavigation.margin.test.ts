import type { AuthUser } from '@/types/auth.type';
import { describe, expect, it } from 'vitest';
import { ADMIN_SHELL_PERMISSIONS } from '@/lib/adminAccess';
import {
  canAccessNavItem,
  findAdminNavItem,
  getVisibleAdminSections,
} from '@/lib/adminNavigation';

describe('admin margin report navigation access', () => {
  const financeUser = {
    permissions: [{ name: 'FINANCE_DASHBOARD_READ' }],
    roleName: 'STAFF',
  } as AuthUser;
  const ordersUser = {
    permissions: [{ name: 'ORDERS_READ' }],
    roleName: 'STAFF',
  } as AuthUser;

  it('shows the route only to users with finance dashboard read access', () => {
    const item = findAdminNavItem('/admin/margins');

    expect(item?.label).toBe('Margin & Financials');
    expect(item?.permission).toBe('FINANCE_DASHBOARD_READ');
    expect(canAccessNavItem(item!, financeUser)).toBe(true);
    expect(canAccessNavItem(item!, ordersUser)).toBe(false);
    const financeItems = getVisibleAdminSections(financeUser)
      .flatMap(section => section.items);
    const orderItems = getVisibleAdminSections(ordersUser)
      .flatMap(section => section.items);

    expect(financeItems).toContainEqual(item);
    expect(orderItems).not.toContainEqual(item);
    expect(ADMIN_SHELL_PERMISSIONS).toContain('FINANCE_DASHBOARD_READ');
  });
});
