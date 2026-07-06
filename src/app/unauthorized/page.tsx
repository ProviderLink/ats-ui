import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/slices/auth.store';
import { ShieldOffIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const userRoles = useAuthStore(s => s.user?.roles);

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center gap-6 bg-background p-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldOffIcon className="size-8 text-destructive" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-base font-semibold text-foreground">
          Access denied
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          You don't have permission to view this page.
          {userRoles && userRoles.length > 0 && (
            <>
              {' '}
              Your current permissions do not grant access to this page. (Role
              {userRoles.length > 1 ? 's' : ''}: {userRoles.join(', ')})
            </>
          )}
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button onClick={() => navigate('/ats/dashboard', { replace: true })}>
          Dashboard
        </Button>
      </div>
    </div>
  );
}
