import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthStore } from '@/store/slices/auth.store';
import { CheckCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthCard } from '../_components/auth-card';
import { AuthInvalidCard } from '../_components/auth-invalid-card';
import { AuthStatusCard } from '../_components/auth-status-card';
import { AuthSubmitButton } from '../_components/auth-submit-button';
import { BackToSignInLink } from '../_components/back-to-sign-in-link';
import { NewPasswordFields } from '../_components/new-password-fields';
import { validateNewPassword } from '../_utils/validate-new-password';

export default function ResetPasswordPage() {
  const resetPassword = useAuthStore(s => s.resetPassword);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateNewPassword(password, confirm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      toast.success('Password updated');
      setTimeout(() => navigate('/ats/login', { replace: true }), 2000);
    } catch (err) {
      toast.error(
        (err as Error).message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthInvalidCard
        message="Invalid or missing reset token."
        linkTo="/ats/forgot-password"
        linkLabel="Request a new link"
      />
    );
  }

  if (done) {
    return (
      <AuthStatusCard
        icon={CheckCircleIcon}
        title="Password updated"
        description="Redirecting you to sign in…"
      />
    );
  }

  return (
    <AuthCard>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          Set new password
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Choose a password with at least 8 characters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <NewPasswordFields
            passwordLabel="New password"
            password={password}
            confirm={confirm}
            onPasswordChange={setPassword}
            onConfirmChange={setConfirm}
          />
          <AuthSubmitButton loading={loading}>Update password</AuthSubmitButton>
          <BackToSignInLink />
        </form>
      </CardContent>
    </AuthCard>
  );
}
