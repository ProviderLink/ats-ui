import type { Email } from '@/store/types';
import { BriefcaseIcon, UserIcon, UserRoundIcon } from 'lucide-react';
import { isExternalEmail } from '../../_utils/is-external-email';

const CHIP_CLASS =
  'inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700 dark:border-border dark:bg-transparent dark:text-muted-foreground shrink-0';

export function EmailContextChip({ email }: { email: Email }) {
  const { context } = email;
  if (!context) return null;

  if (isExternalEmail(email)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-teal-500 bg-teal-100 px-2 py-0.5 text-[10px] text-teal-900 dark:border-teal-500/50 dark:bg-teal-500/10 dark:text-teal-300 shrink-0">
        <UserRoundIcon className="size-2.5" />
        External
      </span>
    );
  }

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
