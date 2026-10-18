import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatDate } from '@/lib/utils';
import type { Email } from '@/store/types';
import { ClockIcon } from 'lucide-react';
import {
  avatarColor,
  formatEmailTime,
  initialsFor,
} from '../../_utils/email-sender';

export function EmailSenderBlock({ email }: { email: Email }) {
  const isOutbound = email.direction === 'outbound';
  const sender = email.from;
  const date = email.sentAt ?? email.receivedAt ?? email.createdAt;
  const recipients = Array.isArray(email.to) ? email.to : [email.to];

  return (
    <div className="shrink-0 px-6 py-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0 rounded-full">
          <AvatarFallback
            className={cn(
              'rounded-full text-sm font-semibold select-none',
              avatarColor(sender)
            )}
          >
            {initialsFor(sender) || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {isOutbound ? 'You' : sender}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="truncate">
                  {isOutbound
                    ? `from ${sender}`
                    : `to ${recipients.join(', ')}`}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
              <ClockIcon className="size-3" />
              <time dateTime={date ?? undefined}>
                {formatDate(date)} · {formatEmailTime(date)}
              </time>
            </div>
          </div>

          {isOutbound && recipients.length > 0 && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              To: {recipients.join(', ')}
            </p>
          )}
        </div>
      </div>

      {email.cc?.length || email.bcc?.length ? (
        <div className="mt-3 space-y-1 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {email.cc && email.cc.length > 0 && (
            <p className="wrap-break-word">
              <span className="font-semibold text-foreground/70">Cc:</span>{' '}
              {email.cc.join(', ')}
            </p>
          )}
          {email.bcc && email.bcc.length > 0 && (
            <p className="wrap-break-word">
              <span className="font-semibold text-foreground/70">Bcc:</span>{' '}
              {email.bcc.join(', ')}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
