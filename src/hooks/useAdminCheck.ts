import { useAuth } from '@/contexts/AuthContext';
import { isAdminUser } from '@/lib/adminAccess';

export function useAdminCheck() {
  const { user } = useAuth();

  const isAdmin = isAdminUser(user);

  return { data: isAdmin };
}
