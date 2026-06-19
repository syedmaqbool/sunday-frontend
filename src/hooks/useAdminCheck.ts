import { useAuth } from "@/contexts/AuthContext";

export const useAdminCheck = () => {
  const { user } = useAuth();

  
  const isAdmin = user?.roleName === "ADMIN";

  
  return { data: isAdmin };
};