import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EMAIL_STATUS_STYLES } from '@/lib/status-styles';
import { cn, formatDate } from '@/lib/utils';
import type { Email } from '@/store/types';
import { MailIcon, PaperclipIcon, RefreshCwIcon, ReplyIcon } from 'lucide-react';
import { isExternalEmail } from '../../_utils/is-external-email';
import { DirectionIcon } from '../direction-icon';
import { MessageAttachment } from './message-attachment';
import { MessageContextChip } from './message-context-chip';
import { MessageHeaderFields } from './message-header-fields';

interface EmailMessageProps {
  email: Email;
  onReply: (email: Email) => void;
  onForward: (email: Email) => void;
  onResend: (id: string) => void;
}

export function EmailMessage({
  email,
  onReply,
  onForward,
  onResend,
}: EmailMessageProps) {
  const date = email.sentAt ?? email.receivedAt ?? email.createdAt;
  const { cls } = EMAIL_STATUS_STYLES[email.status];
  const attachments = email.attachments ?? [];

  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border bg-card p-4',
        isExternalEmail(email) &&
          'border-dashed border-teal-500/40 bg-teal-500/5'
      )}
    >
      <header className="flex items-start gap-3">
        <DirectionIcon direction={email.direction} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-sm font-semibold leading-snug">
              {email.subject}
            </h2>
            <div className="flex items-center gap-2">
              <Badge className={cn('border bg-transparent font-medium', cls)}>
                {email.status[0].toUpperCase() + email.status.slice(1)}
              </Badge>
              <MessageContextChip email={email} />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(date)}
          </p>
        </div>
      </header>

      <Separator />
      <MessageHeaderFields email={email} />
      <Separator />

      <div className="text-sm leading-relaxed">
        {email.bodyHtml ? (
          <iframe
            srcDoc={email.bodyHtml}
            sandbox="allow-same-origin"
            className="w-full min-h-48 border-0 rounded"
            title={`Email body ${email._id}`}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-foreground">
            {email.bodyText ?? '(no content)'}
          </pre>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <PaperclipIcon className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Attachments ({attachments.length})
            </span>
          </div>
          {attachments.map((att, i) => (
            <MessageAttachment key={i} attachment={att} />
          ))}
        </div>
      )}

      <Separator />

      <div className="flex items-center gap-2">
        {email.status === 'failed' ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onResend(email._id)}
          >
            <RefreshCwIcon className="size-4" />
            Resend
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onReply(email)}
          >
            <ReplyIcon className="size-4" />
            Reply
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => onForward(email)}
        >
          <MailIcon className="size-4" />
          Forward
        </Button>
      </div>
    </article>
  );
}
