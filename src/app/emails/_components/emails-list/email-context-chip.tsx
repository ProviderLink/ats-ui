import type { Email } from '@/store/types';
import { BriefcaseIcon, UserIcon } from 'lucide-react';

const CHIP_CLASS =
  'inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground shrink-0';

export function EmailContextChip({ email }: { email: Email }) {
  const { context } = email;
  if (!context) return null;

  if (context.candidateId) {
    return (
      <span className={CHIP_CLASS}>
        <UserIcon className="size-2.5" />
        Candidate
      </span>
    );
  }

  if (context.jobId) {
    return (
      <span className={CHIP_CLASS}>
        <BriefcaseIcon className="size-2.5" />
        Job
      </span>
    );
  }

  return null;
}
