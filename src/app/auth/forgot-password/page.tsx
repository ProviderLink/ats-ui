import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthStore } from '@/store/slices/auth.store';
import { MailCheckIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthCard } from '../_components/auth-card';
import { AuthEmailField } from '../_components/auth-email-field';
import { AuthStatusCard } from '../_components/auth-status-card';
import { AuthSubmitButton } from '../_components/auth-submit-button';
import { BackToSignInLink } from '../_components/back-to-sign-in-link';

export default function ForgotPasswordPage() {
  const forgotPassword = useAuthStore(s => s.forgotPassword);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('If an account exists, a reset link has been sent.');
    } catch (err) {
      toast.error(
        (err as Error).message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthStatusCard
        icon={MailCheckIcon}
        title="Check your email"
        description={
          <>
            If an account exists for{' '}
            <span className="font-medium text-foreground">{email}</span>,
            you'll receive a password reset link.
          </>
        }
      >
        <Link to="/ats/login" className="text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </AuthStatusCard>
    );
  }

  return (
    <AuthCard>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          Reset password
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthEmailField value={email} onChange={setEmail} />
          <AuthSubmitButton loading={loading}>Send reset link</AuthSubmitButton>
          <BackToSignInLink />
        </form>
      </CardContent>
    </AuthCard>
  );
}
