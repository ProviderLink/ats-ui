import { Button } from '@/components/ui/button';
import { CheckCircle2Icon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApplySuccessProps {
  firstName: string;
  jobTitle: string;
}

export function ApplySuccess({ firstName, jobTitle }: ApplySuccessProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center sm:px-6">
      <div className="flex size-16 items-center justify-center rounded-full bg-careers-accent">
        <CheckCircle2Icon className="size-8 text-careers" />
      </div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Application submitted
      </h1>
      <p className="max-w-md text-balance text-base text-muted-foreground">
        Thanks, {firstName}. We&rsquo;ve received your application for{' '}
        <strong>{jobTitle}</strong> and will be in touch soon.
      </p>
      <Button
        className="bg-careers-accent text-careers hover:bg-careers-accent/90"
        onClick={() => navigate('/careers')}
      >
        Back to jobs
      </Button>
    </div>
  );
}
