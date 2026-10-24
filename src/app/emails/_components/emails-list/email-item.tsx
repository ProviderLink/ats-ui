import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Email } from '@/store/types';
import { Trash2Icon } from 'lucide-react';
import { formatShortDate } from '../../_utils/format-short-date';
import { isExternalEmail } from '../../_utils/is-external-email';
import { DirectionIcon } from '../direction-icon';
import { EmailContextChip } from './email-context-chip';
import { SenderAvatar } from './sender-avatar';
import { StatusPill } from './status-pill';

interface EmailItemProps {
  email: Email;
  selected: boolean;
  onToggle: () => void;
  onClick: () => void;
  onDelete: () => void;
}

export function EmailItem({
  email,
  selected,
  onToggle,
  onClick,
  onDelete,
}: EmailItemProps) {
  const isOut = email.direction === 'outbound';
  const isUnread = !isOut && !email.isRead;
  const contactAddress = isOut ? email.to[0] : email.from;
  const date = email.sentAt ?? email.receivedAt ?? email.createdAt;
  const snippet = (email.bodyText ?? '').replace(/\n+/g, ' ').slice(0, 100);

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-muted/60 active:bg-muted',
        isExternalEmail(email) &&
          'border-l-2 border-dashed border-teal-500/50 bg-teal-500/5'
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={() => onToggle()}
        aria-label={`Select ${email.subject}`}
        className="mt-1 shrink-0"
      />
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-start gap-3 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <DirectionIcon direction={email.direction} />
        <SenderAvatar address={contactAddress} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'text-sm leading-tight truncate',
                isUnread ? 'font-semibold' : 'font-medium'
              )}
            >
              {isUnread && (
                <span className="inline-block size-2 rounded-full bg-blue-500 mr-1.5 align-middle shrink-0" />
              )}
              {email.subject}
            </p>
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {formatShortDate(date)}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {isOut ? `To: ${contactAddress}` : `From: ${contactAddress}`}
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground/70 truncate">
            {snippet}
          </p>

          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <StatusPill status={email.status} />
            <EmailContextChip email={email} />
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 hover:bg-red-200 dark:bg-transparent dark:text-muted-foreground dark:hover:text-destructive dark:hover:bg-destructive/10 transition-colors"
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2Icon className="size-3" />
              Delete
            </button>
          </div>
        </div>
      </button>
    </div>
  );
}
