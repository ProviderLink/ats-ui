import { Button } from '@/components/ui/button';
import type { Email } from '@/store/types';
import {
  ForwardIcon,
  RefreshCwIcon,
  ReplyIcon,
  Trash2Icon,
} from 'lucide-react';

interface EmailDetailFooterProps {
  email: Email;
  onDelete: () => void;
  onReply: (email: Email) => void;
  onForward: (email: Email) => void;
  onResend?: (id: string) => void;
}

export function EmailDetailFooter({
  email,
  onDelete,
  onReply,
  onForward,
  onResend,
}: EmailDetailFooterProps) {
  return (
    <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
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
  );
}
