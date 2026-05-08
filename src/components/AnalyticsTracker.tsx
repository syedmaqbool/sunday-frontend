import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initGA, trackPageView, setUser } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";

export const AnalyticsTracker = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setUser(user?.id ?? null);
  }, [user?.id]);

  return null;
};
