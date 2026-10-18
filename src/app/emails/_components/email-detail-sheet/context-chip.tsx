import type { Email } from '@/store/types';
import { BriefcaseIcon, UserIcon } from 'lucide-react';

const CHIP_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground';

export function ContextChip({ email }: { email: Email }) {
  const { context } = email;
  if (!context) return null;

  if (context.candidateId) {
    return (
      <span className={CHIP_CLASS}>
        <UserIcon className="size-3" />
        Candidate #{context.candidateId}
        {context.jobId && (
          <>
            <span className="text-border">·</span>
            <BriefcaseIcon className="size-3" />
            Job #{context.jobId}
          </>
        )}
      </span>
    );
  }

  if (context.jobId) {
    return (
      <span className={CHIP_CLASS}>
        <BriefcaseIcon className="size-3" />
        Job #{context.jobId}
      </span>
    );
  }

  return null;
}
