import { useEmailStore } from '@/store';
import type { Email } from '@/store/types';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ComposeMode } from '../_utils/compose-mode';

export function useEmailComposeActions() {
  const resendEmail = useEmailStore(s => s.resend);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>({ type: 'new' });

  function openCompose(mode: ComposeMode) {
    setComposeMode(mode);
    setComposeOpen(true);
  }

  async function resend(emailId: string) {
    try {
      await resendEmail(emailId);
      toast.success('Email resent successfully.');
    } catch {
      toast.error('Failed to resend email.');
    }
  }

  return {
    composeOpen,
    setComposeOpen,
    composeMode,
    openNew: () => openCompose({ type: 'new' }),
    openReply: (email: Email) => openCompose({ type: 'reply', email }),
    openForward: (email: Email) => openCompose({ type: 'forward', email }),
    resend,
  };
}
