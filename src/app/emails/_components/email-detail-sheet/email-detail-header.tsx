import { cn } from '@/lib/utils';
import type { Email } from '@/store/types';
import { ArrowDownLeftIcon, ArrowUpRightIcon } from 'lucide-react';
import { ContextChip } from './context-chip';
import { EmailStatusBadge } from './email-status-badge';

export function EmailDetailHeader({ email }: { email: Email }) {
  const isOutbound = email.direction === 'outbound';
  return (
    <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 px-6 pt-5 pb-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
            isOutbound
              ? 'bg-primary/10 text-primary'
              : 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400'
          )}
          aria-hidden
        >
          {isOutbound ? (
            <ArrowUpRightIcon className="size-4" />
          ) : (
            <ArrowDownLeftIcon className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold leading-snug tracking-tight text-foreground wrap-break-word">
            {email.subject}
          </h2>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <EmailStatusBadge
              status={email.status}
              failureReason={email.failureReason}
            />
            <ContextChip email={email} />
          </div>
        </div>
      </div>
    </div>
  );
}
