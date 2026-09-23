import { AppLoader } from '@/components/app-loader';
import { Button } from '@/components/ui/button';
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
  const bootError = useBootStore(s => s.error);
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

  // A boot that fetched nothing at all is a total outage, not an empty
  // workspace. Show an explicit failure rather than letting the user into a
  // fully empty-looking app, which reads as "all our data is gone".
  // `bootError` is only set when EVERY required store failed, so a partial
  // success or a genuinely empty workspace still falls through to the app.
  if (bootError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-lg font-semibold">Couldn&apos;t load your data</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          We couldn&apos;t reach the server, so nothing could be loaded. Your
          data is safe — this is a connection problem, not lost data.
        </p>
        <p className="max-w-md text-xs text-muted-foreground">{bootError}</p>
        <Button
          variant="outline"
          onClick={() => {
            useBootStore.getState().reset();
            void bootAllData();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  // Show full-screen spinner while booting data. Once booted, the entire
  // app renders instantly — no page ever shows a loading skeleton again.
  if (!isBooted) {
    return <AppLoader />;
  }

  return <Outlet />;
}
