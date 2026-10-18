import { EMAIL_STATUS_STYLES } from '@/lib/status-styles';
import { cn } from '@/lib/utils';
import type { EmailStatus } from '@/store/types';

export function StatusPill({ status }: { status: EmailStatus }) {
  const { label, cls } = EMAIL_STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium shrink-0',
        cls
      )}
    >
      {label}
    </span>
  );
}
