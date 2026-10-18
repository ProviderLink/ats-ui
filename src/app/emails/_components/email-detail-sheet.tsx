import { ConfirmDialog } from '@/components/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useEmailStore } from '@/store';
import type { Email } from '@/store/types';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmailBody } from './email-detail-sheet/email-body';
import { EmailDetailFooter } from './email-detail-sheet/email-detail-footer';
import { EmailDetailHeader } from './email-detail-sheet/email-detail-header';
import { EmailSenderBlock } from './email-detail-sheet/email-sender-block';

interface EmailDetailSheetProps {
  email: Email | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReply: (email: Email) => void;
  onForward: (email: Email) => void;
  onResend?: (id: string) => void;
}

export function EmailDetailSheet({
  email,
  open,
  onOpenChange,
  onReply,
  onForward,
  onResend,
}: EmailDetailSheetProps) {
  const remove = useEmailStore(s => s.remove);
  const mutating = useEmailStore(s => s.mutating);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!email) return null;

  async function handleDelete(id: string) {
    try {
      await remove(id);
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
        <SheetTitle className="sr-only">{email.subject}</SheetTitle>

        <EmailDetailHeader email={email} />
        <EmailSenderBlock email={email} />

        <Separator />

        <EmailBody email={email} />

        <EmailDetailFooter
          email={email}
          onDelete={() => setDeleteOpen(true)}
          onReply={onReply}
          onForward={onForward}
          onResend={onResend}
        />
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
        onConfirm={() => handleDelete(email._id)}
      />
    </Sheet>
  );
}
