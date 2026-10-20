import type { Email } from '@/store/types';
import { BriefcaseIcon, UserIcon, UserRoundIcon } from 'lucide-react';
import { isExternalEmail } from '../../_utils/is-external-email';

const CHIP_CLASS =
  'inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground';

export function MessageContextChip({ email }: { email: Email }) {
  const ctx = email.context;
  if (isExternalEmail(email)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-teal-500/50 bg-teal-500/10 px-2 py-0.5 text-[11px] text-teal-800 dark:text-teal-300">
        <UserRoundIcon className="size-3" />
        External
      </span>
    );
  }
  if (ctx?.candidateId) {
    return (
      <span className={CHIP_CLASS}>
        <UserIcon className="size-3" />
        Candidate
      </span>
    );
  }
  if (ctx?.jobId) {
    return (
      <span className={CHIP_CLASS}>
        <BriefcaseIcon className="size-3" />
        Job
      </span>
    );
  }
  return null;
}
