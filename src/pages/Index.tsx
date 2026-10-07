import { Navigate, useLocation } from 'react-router-dom';
import ComingSoonLanding from '@/components/ComingSoonLanding';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const location = useLocation();
  const { loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate replace to={{ pathname: '/listings', search: location.search }} />;
  }

  return <ComingSoonLanding />;
}
