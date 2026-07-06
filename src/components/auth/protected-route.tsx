import { AppLoader } from '@/components/app-loader';
import { bootAllData } from '@/lib/boot-data';
import { useAuthStore } from '@/store/slices/auth.store';
import { useBootStore } from '@/store/slices/boot.store';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isInitialized = useAuthStore(s => s.isInitialized);
  const isBooted = useBootStore(s => s.isBooted);
  const isBooting = useBootStore(s => s.isBooting);
  const location = useLocation();

  // Trigger boot once auth is ready
  useEffect(() => {
    if (isAuthenticated && isInitialized && !isBooted && !isBooting) {
      bootAllData();
    }
  }, [isAuthenticated, isInitialized, isBooted, isBooting]);

  if (!isInitialized) return <AppLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/ats/login" state={{ from: location }} replace />;
  }

  // Show full-screen spinner while booting data. Once booted, the entire
  // app renders instantly — no page ever shows a loading skeleton again.
  if (!isBooted) {
    return <AppLoader />;
  }

  return <Outlet />;
}
