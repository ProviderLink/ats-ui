import { Button } from '@/components/ui/button';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.';

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">Error</h1>
      <p className="text-lg font-medium">Something went wrong</p>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild>
        <Link to="/ats/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
