import type { Email } from '@/store/types';
import { BriefcaseIcon, UserIcon, UserRoundIcon } from 'lucide-react';
import { isExternalEmail } from '../../_utils/is-external-email';

const CHIP_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground';

export function ContextChip({ email }: { email: Email }) {
  const { context } = email;
  if (!context) return null;

  if (isExternalEmail(email)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-teal-500/50 bg-teal-500/10 px-2 py-1 text-xs text-teal-800 dark:text-teal-300">
        <UserRoundIcon className="size-3" />
        External contact
      </span>
    );
  }

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
