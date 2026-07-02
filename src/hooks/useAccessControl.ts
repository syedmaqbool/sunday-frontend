import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  canAccessAdminPortal,
  canUser,
  hasPermission,
  hasPermissions,
  isAdminUser,
} from '@/lib/adminAccess';

export function useAccessControl() {
  const { user } = useAuth();

  return useMemo(
    () => ({
      can: (permission: string | string[]) => canUser(user, permission),
      canAccessAdminPortal: canAccessAdminPortal(user),
      hasPermission: (name: string) => hasPermission(user, name),
      hasPermissions: (names: string[]) => hasPermissions(user, names),
      isAdmin: isAdminUser(user),
      user,
    }),
    [user],
  );
}
