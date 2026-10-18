import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/slices/auth.store';
import { MailIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function PasswordResetRow() {
  const user = useAuthStore(s => s.user);
  const forgotPassword = useAuthStore(s => s.forgotPassword);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function sendReset() {
    if (!user?.email) return;
    setSending(true);
    try {
      await forgotPassword(user.email);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
      toast.success(`Reset link sent to ${user.email}`);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to send reset link');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <MailIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Forgot your password? We can send a reset link to{' '}
          <span className="font-medium text-foreground">{user?.email}</span>.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={sending || sent}
        onClick={sendReset}
        className="shrink-0"
      >
        {sent ? 'Reset link sent' : sending ? 'Sending…' : 'Send reset link'}
      </Button>
    </div>
  );
}
