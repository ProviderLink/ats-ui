import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LockIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function JobClosedNotice({ title }: { title: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-10">
      <Card className="careers-card rounded-2xl">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <LockIcon className="size-6 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Applications for this job are closed
          </h1>
          <p className="max-w-md text-balance text-sm text-muted-foreground">
            <strong>{title}</strong> is no longer accepting applications. Take a
            look at our other open positions.
          </p>
          <Link to="/careers">
            <Button size="sm">View open positions</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
