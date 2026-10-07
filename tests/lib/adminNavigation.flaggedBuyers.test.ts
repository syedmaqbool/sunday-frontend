import type { AuthUser } from '@/types/auth.type';
import { describe, expect, it } from 'vitest';
import { canAccessNavItem, findAdminNavItem, getVisibleAdminSections } from '@/lib/adminNavigation';

describe('flagged buyers navigation access', () => {
  it('shows the route to users with complaints read permission only', () => {
    const complaintsReader = {
      permissions: [{ name: 'COMPLAINTS_READ' }],
      roleName: 'STAFF',
    } as AuthUser;
    const otherStaff = {
      permissions: [{ name: 'ORDERS_READ' }],
      roleName: 'STAFF',
    } as AuthUser;
    const item = findAdminNavItem('/admin/flagged-buyers');

    expect(item?.label).toBe('Flagged Buyers');
    expect(item?.permission).toBe('COMPLAINTS_READ');
    expect(canAccessNavItem(item!, complaintsReader)).toBe(true);
    expect(canAccessNavItem(item!, otherStaff)).toBe(false);
    expect(getVisibleAdminSections(complaintsReader).flatMap(section => section.items)).toContainEqual(item);
    expect(getVisibleAdminSections(otherStaff).flatMap(section => section.items)).not.toContainEqual(item);
  });
});
