import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, MailIcon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ComposeEmailSheet } from '../_components/compose-email-sheet';
import { EmailMessage } from '../_components/email-thread/email-message';
import {
  ThreadError,
  ThreadNotFound,
  ThreadSkeleton,
} from '../_components/email-thread/thread-state';
import { useEmailComposeActions } from '../_hooks/use-email-compose-actions';
import { useEmailThread } from '../_hooks/use-email-thread';

export default function EmailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { messages, loading, error } = useEmailThread(id);
  const compose = useEmailComposeActions();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 shrink-0">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link to="/ats/emails">
            <ArrowLeftIcon className="size-4" />
            Back to Emails
          </Link>
        </Button>
        <Button size="sm" className="gap-2" onClick={compose.openNew}>
          <MailIcon className="size-4" />
          Compose
        </Button>
      </div>

      {loading ? (
        <ThreadSkeleton />
      ) : error ? (
        <ThreadError message={error} />
      ) : messages.length === 0 ? (
        <ThreadNotFound />
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
                onReply={compose.openReply}
                onForward={compose.openForward}
                onResend={compose.resend}
              />
            ))}
          </div>
        </>
      )}

      <ComposeEmailSheet
        open={compose.composeOpen}
        onOpenChange={compose.setComposeOpen}
        mode={compose.composeMode}
      />
    </div>
  );
}
