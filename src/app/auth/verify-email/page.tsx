import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthStore } from '@/store/slices/auth.store';
import { CheckCircleIcon, Loader2Icon, XCircleIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthCard } from '../_components/auth-card';
import { AuthInvalidCard } from '../_components/auth-invalid-card';
import { AuthStatusCard } from '../_components/auth-status-card';
import { AuthSubmitButton } from '../_components/auth-submit-button';
import { NewPasswordFields } from '../_components/new-password-fields';
import { validateNewPassword } from '../_utils/validate-new-password';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const verifyEmail = useAuthStore(s => s.verifyEmail);
  const resetPassword = useAuthStore(s => s.resetPassword);
  const navigate = useNavigate();

  const [step, setStep] = useState<'verifying' | 'verified' | 'error'>(
    'verifying'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const called = useRef(false);

  useEffect(() => {
    if (called.current || !token) return;
    called.current = true;
    verifyEmail(token)
      .then(() => setStep('verified'))
      .catch((err: Error) => {
        setStep('error');
        setErrorMsg(
          err.message ||
            'This invitation link is invalid or has expired. Please request a new one from your admin.'
        );
      });
  }, [token, verifyEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateNewPassword(password, confirm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!token) return;
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      toast.success('Account created');
      setTimeout(() => navigate('/ats/login', { replace: true }), 2000);
    } catch (err) {
      toast.error(
        (err as Error).message || 'Failed to set password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthInvalidCard
        message="Invalid or missing invitation link."
        linkTo="/ats/login"
        linkLabel="Back to sign in"
      />
    );
  }

  if (done) {
    return (
      <AuthStatusCard
        icon={CheckCircleIcon}
        title="Account created"
        description="Redirecting you to sign in…"
      />
    );
  }

  if (step === 'verifying') {
    return (
      <AuthStatusCard
        icon={Loader2Icon}
        tone="loading"
        title="Verifying your email"
        description="Please wait while we confirm your invitation…"
      />
    );
  }

  if (step === 'error') {
    return (
      <AuthStatusCard
        icon={XCircleIcon}
        tone="error"
        title="Verification failed"
        description={errorMsg}
      />
    );
  }

  return (
    <AuthCard>
      <CardHeader className="pb-4">
        <div className="flex justify-center mb-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent">
            <CheckCircleIcon className="size-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-base font-semibold text-center">
          Email verified
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground text-center">
          Choose a password to activate your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <NewPasswordFields
            passwordLabel="Password"
            password={password}
            confirm={confirm}
            onPasswordChange={setPassword}
            onConfirmChange={setConfirm}
          />
          <AuthSubmitButton loading={loading} className="mt-0">
            Set password &amp; sign in
          </AuthSubmitButton>
        </form>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Already have an account?{' '}
          <Link to="/ats/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </AuthCard>
  );
}
