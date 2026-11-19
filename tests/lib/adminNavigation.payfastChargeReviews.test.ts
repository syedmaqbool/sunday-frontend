import type { AuthUser } from '@/types/auth.type';
import { describe, expect, it } from 'vite-plus/test';
import { canAccessNavItem, findAdminNavItem, getVisibleAdminSections } from '@/lib/adminNavigation';

describe('PayFast charge review navigation access', () => {
  it('shows the route to users with payouts read permission only', () => {
    const payoutsReader = {
      permissions: [{ name: 'PAYOUTS_READ' }],
      roleName: 'STAFF',
    } as AuthUser;
    const otherStaff = {
      permissions: [{ name: 'ORDERS_READ' }],
      roleName: 'STAFF',
    } as AuthUser;
    const item = findAdminNavItem('/admin/payfast-charges');

    expect(item?.label).toBe('PayFast Charges');
    expect(item?.permission).toBe('PAYOUTS_READ');
    expect(canAccessNavItem(item!, payoutsReader)).toBe(true);
    expect(canAccessNavItem(item!, otherStaff)).toBe(false);
    expect(getVisibleAdminSections(payoutsReader).flatMap(section => section.items)).toContainEqual(
      item,
    );
    expect(
      getVisibleAdminSections(otherStaff).flatMap(section => section.items),
    ).not.toContainEqual(item);
  });
});
