import { useAuth } from '@/contexts/AuthContext';

export function useAdminCheck() {
  const { user } = useAuth();

  const isAdmin = user?.roleName === 'ADMIN';

  return { data: isAdmin };
}
