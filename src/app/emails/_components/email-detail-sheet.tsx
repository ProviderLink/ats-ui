import { ConfirmDialog } from '@/components/confirm-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatDate } from '@/lib/utils';
import { useEmailStore } from '@/store';
import type { Email, EmailAttachment, EmailStatus } from '@/store/types';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BriefcaseIcon,
  ClockIcon,
  DownloadIcon,
  FileIcon,
  ForwardIcon,
  PaperclipIcon,
  RefreshCwIcon,
  ReplyIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const statusConfig: Record<
  EmailStatus,
  { label: string; dot: string; cls: string }
> = {
  delivered: {
    label: 'Delivered',
    dot: 'bg-emerald-500',
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-400',
  },
  received: {
    label: 'Received',
    dot: 'bg-blue-500',
    cls: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-400',
  },
  sent: {
    label: 'Sent',
    dot: 'bg-muted-foreground',
    cls: 'border-border bg-muted text-muted-foreground',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-amber-500',
    cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-400',
  },
  failed: {
    label: 'Failed',
    dot: 'bg-destructive',
    cls: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
  delayed: {
    label: 'Delayed',
    dot: 'bg-orange-500',
    cls: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/50 dark:text-orange-400',
  },
  bounced: {
    label: 'Bounced',
    dot: 'bg-red-500',
    cls: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-400',
  },
  complained: {
    label: 'Complained',
    dot: 'bg-red-600',
    cls: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-400',
  },
};

function StatusBadge({
  status,
  failureReason,
}: {
  status: EmailStatus;
  failureReason?: string | null;
}) {
  const { label, dot, cls } = statusConfig[status];
  const badge = (
    <Badge
      className={cn(
        'border font-medium bg-transparent cursor-default gap-1.5',
        cls
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} aria-hidden />
      {label}
    </Badge>
  );

  if (status === 'failed' && failureReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          {failureReason}
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}

function initialsFor(address: string): string {
  const user = address.split('@')[0];
  return user
    .split(/[._+\-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('');
}

function avatarColor(address: string): string {
  const palette = [
    'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
    'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
    'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  ];
  const idx =
    address.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    palette.length;
  return palette[idx];
}

function ContextChip({ email }: { email: Email }) {
  const { context } = email;
  if (!context) return null;

  if (context.candidateId) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
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
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
        <BriefcaseIcon className="size-3" />
        Job #{context.jobId}
      </span>
    );
  }

  return null;
}

function AttachmentItem({ attachment }: { attachment: EmailAttachment }) {
  return (
    <a
      href={attachment.url}
      download={attachment.filename}
      className="group flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 transition-colors hover:border-foreground/20 hover:bg-muted/40"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <FileIcon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">
          {attachment.filename}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.size)}
        </p>
      </div>
      <DownloadIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
    </a>
  );
}

type Props = {
  email: Email | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReply: (email: Email) => void;
  onForward: (email: Email) => void;
  onResend?: (id: string) => void;
};

export function EmailDetailSheet({
  email,
  open,
  onOpenChange,
  onReply,
  onForward,
  onResend,
}: Props) {
  const { remove, mutating } = useEmailStore();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!email) return null;

  const isOutbound = email.direction === 'outbound';
  const senderAddress = email.from;
  const senderInitials = initialsFor(senderAddress);
  const senderColor = avatarColor(senderAddress);
  const date = email.sentAt ?? email.receivedAt ?? email.createdAt;
  const formattedDate = formatDate(date);
  const timeString = date
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(date))
    : '';
  const recipients = Array.isArray(email.to) ? email.to : [email.to];

  async function handleDelete() {
    try {
      await remove(email!._id);
      toast.success('Email deleted');
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete email');
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        style={{ width: '44rem', maxWidth: '100vw' }}
        className="flex flex-col gap-0 p-0 overflow-hidden"
      >
        {/* Visually-hidden title for a11y; subject rendered in header */}
        <SheetTitle className="sr-only">{email.subject}</SheetTitle>

        {/* Header — subject, status, direction */}
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
                <StatusBadge
                  status={email.status}
                  failureReason={email.failureReason}
                />
                <ContextChip email={email} />
              </div>
            </div>
          </div>
        </div>

        {/* Sender block — modern, like Gmail/Spark */}
        <div className="shrink-0 px-6 py-4">
          <div className="flex items-start gap-3">
            <Avatar className="size-10 shrink-0 rounded-full">
              <AvatarFallback
                className={cn(
                  'rounded-full text-sm font-semibold select-none',
                  senderColor
                )}
              >
                {senderInitials || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {isOutbound ? 'You' : senderAddress}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {isOutbound ? (
                      <span className="truncate">from {senderAddress}</span>
                    ) : (
                      <span className="truncate">
                        to {recipients.join(', ')}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                  <ClockIcon className="size-3" />
                  <time dateTime={date ?? undefined}>
                    {formattedDate} · {timeString}
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

        <Separator />

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {email.bodyHtml ? (
            <div className="px-6 py-1">
              <iframe
                srcDoc={email.bodyHtml}
                sandbox="allow-same-origin"
                className="w-full min-h-64 border-0"
                title="Email body"
              />
            </div>
          ) : (
            <div className="px-6 py-5">
              <div className="text-sm leading-relaxed text-foreground/90">
                {(email.bodyText ?? '(no content)')
                  .split('\n')
                  .map((line, i) => (
                    <p key={i} className="min-h-5">
                      {line || '\u00A0'}
                    </p>
                  ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="px-6 pb-6 pt-2">
              <div className="mb-3 flex items-center gap-2">
                <PaperclipIcon className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {email.attachments.length} Attachment
                  {email.attachments.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {email.attachments.map((att, i) => (
                  <AttachmentItem key={i} attachment={att} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon className="size-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
            <div className="flex items-center gap-2">
              {email.status === 'failed' ? (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  onClick={() => onResend?.(email._id)}
                >
                  <RefreshCwIcon className="size-4" />
                  <span className="hidden sm:inline">Resend</span>
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  onClick={() => onReply(email)}
                >
                  <ReplyIcon className="size-4" />
                  <span className="hidden sm:inline">Reply</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => onForward(email)}
              >
                <ForwardIcon className="size-4" />
                <span className="hidden sm:inline">Forward</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete email?"
        description={
          <>
            <strong>{email.subject}</strong> will be permanently removed. This
            action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={mutating}
        onConfirm={handleDelete}
      />
    </Sheet>
  );
}
