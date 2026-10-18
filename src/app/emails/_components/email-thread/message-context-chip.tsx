import type { Email } from '@/store/types';
import { BriefcaseIcon, UserIcon } from 'lucide-react';

const CHIP_CLASS =
  'inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground';

export function MessageContextChip({ email }: { email: Email }) {
  const ctx = email.context;
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
