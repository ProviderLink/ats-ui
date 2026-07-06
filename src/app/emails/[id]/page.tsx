import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDate } from '@/lib/utils';
import { useEmailStore } from '@/store';
import type { Email, EmailAttachment } from '@/store/types';
import {
  ArrowDownLeftIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BriefcaseIcon,
  DownloadIcon,
  FileIcon,
  MailIcon,
  PaperclipIcon,
  RefreshCwIcon,
  ReplyIcon,
  UserIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ComposeEmailSheet } from '../_components/compose-email-sheet';

const statusCls: Record<string, string> = {
  delivered:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-400',
  received:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-400',
  sent: 'border-border bg-muted text-muted-foreground',
  pending:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-400',
  failed: 'border-destructive/30 bg-destructive/10 text-destructive',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DirectionIcon({ direction }: { direction: Email['direction'] }) {
  const isOut = direction === 'outbound';
  return (
    <div
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md',
        isOut ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'
      )}
    >
      {isOut ? (
        <ArrowUpRightIcon className="size-3.5" />
      ) : (
        <ArrowDownLeftIcon className="size-3.5" />
      )}
    </div>
  );
}

function ContextChip({ email }: { email: Email }) {
  const ctx = email.context;
  if (!ctx) return null;
  if (ctx.candidateId) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
        <UserIcon className="size-3" />
        Candidate
      </span>
    );
  }
  if (ctx.jobId) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
        <BriefcaseIcon className="size-3" />
        Job
      </span>
    );
  }
  return null;
}

function AttachmentItem({ attachment }: { attachment: EmailAttachment }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{attachment.filename}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.size)}
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" asChild>
        <a href={attachment.url} download={attachment.filename}>
          <DownloadIcon className="size-4" />
        </a>
      </Button>
    </div>
  );
}

function EmailMessage({
  email,
  onReply,
  onForward,
  onResend,
}: {
  email: Email;
  onReply: (e: Email) => void;
  onForward: (e: Email) => void;
  onResend: (id: string) => void;
}) {
  const date = email.sentAt ?? email.receivedAt ?? email.createdAt;
  const cls = statusCls[email.status] ?? statusCls.sent;

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
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
              <ContextChip email={email} />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(date)}
          </p>
        </div>
      </header>

      <Separator />

      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex gap-2">
          <span className="w-10 shrink-0 text-muted-foreground">From</span>
          <span className="break-all text-foreground">{email.from}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-10 shrink-0 text-muted-foreground">To</span>
          <span className="break-all text-foreground">
            {email.to.join(', ')}
          </span>
        </div>
        {!!email.cc?.length && (
          <div className="flex gap-2">
            <span className="w-10 shrink-0 text-muted-foreground">Cc</span>
            <span className="break-all text-foreground">
              {email.cc.join(', ')}
            </span>
          </div>
        )}
        {!!email.bcc?.length && (
          <div className="flex gap-2">
            <span className="w-10 shrink-0 text-muted-foreground">Bcc</span>
            <span className="break-all text-foreground">
              {email.bcc.join(', ')}
            </span>
          </div>
        )}
        {email.failureReason && email.status === 'failed' && (
          <div className="flex gap-2">
            <span className="w-10 shrink-0 text-muted-foreground">Error</span>
            <span className="break-all text-destructive">
              {email.failureReason}
            </span>
          </div>
        )}
      </div>

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

      {email.attachments && email.attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <PaperclipIcon className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Attachments ({email.attachments.length})
            </span>
          </div>
          {email.attachments.map((att, i) => (
            <AttachmentItem key={i} attachment={att} />
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

function ThreadSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

export default function EmailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { detail, fetchOne, fetchThread, resend } = useEmailStore();
  const [thread, setThread] = useState<Email[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<
    | { type: 'new' }
    | { type: 'reply'; email: Email }
    | { type: 'forward'; email: Email }
  >({ type: 'new' });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setThread(null);

    (async () => {
      await fetchOne(id);
      if (cancelled) return;
      const storeState = useEmailStore.getState();
      const current = storeState.detail[id];
      if (storeState.error && !current) {
        if (!cancelled) setError(storeState.error);
      }
      if (current?.threadId) {
        const threadEmails = await fetchThread(current.threadId);
        if (cancelled) return;
        threadEmails.sort(
          (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
        );
        setThread(threadEmails);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const primary = id ? (detail[id] ?? null) : null;
  const messages = useMemo(() => {
    if (thread) return thread;
    return primary ? [primary] : [];
  }, [thread, primary]);

  function openReply(email: Email) {
    setComposeMode({ type: 'reply', email });
    setComposeOpen(true);
  }

  function openForward(email: Email) {
    setComposeMode({ type: 'forward', email });
    setComposeOpen(true);
  }

  async function handleResend(emailId: string) {
    try {
      await resend(emailId);
      toast.success('Email resent successfully.');
    } catch {
      toast.error('Failed to resend email.');
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 shrink-0">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link to="/ats/emails">
            <ArrowLeftIcon className="size-4" />
            Back to Emails
          </Link>
        </Button>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            setComposeMode({ type: 'new' });
            setComposeOpen(true);
          }}
        >
          <MailIcon className="size-4" />
          Compose
        </Button>
      </div>

      {loading ? (
        <ThreadSkeleton />
      ) : error ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center py-16">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <RefreshCwIcon className="size-5 text-destructive" />
            </div>
            <p className="text-sm font-medium">Failed to load email</p>
            <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">Email not found</p>
            <p className="text-xs text-muted-foreground">
              This email may have been removed.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2 shrink-0">
            <h1 className="text-lg font-semibold truncate">
              {messages[0]?.subject ?? 'Email'}
            </h1>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto pb-2">
            {messages.map(email => (
              <EmailMessage
                key={email._id}
                email={email}
                onReply={openReply}
                onForward={openForward}
                onResend={handleResend}
              />
            ))}
          </div>
        </>
      )}

      <ComposeEmailSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={composeMode}
      />
    </div>
  );
}
