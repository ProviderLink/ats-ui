import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/slices/auth.store';
import {
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
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
      <Card className="rounded-xl shadow-lg border-border/60 bg-card/80 backdrop-blur-md">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
          <p className="text-sm text-destructive">
            Invalid or missing invitation link.
          </p>
          <Link
            to="/ats/login"
            className="text-sm text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="rounded-xl shadow-lg border-border/60 bg-card/80 backdrop-blur-md">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent">
            <CheckCircleIcon className="size-6 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold">Account created</p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to sign in…
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verifying') {
    return (
      <Card className="rounded-xl shadow-lg border-border/60 bg-card/80 backdrop-blur-md">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold">Verifying your email</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your invitation…
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'error') {
    return (
      <Card className="rounded-xl shadow-lg border-border/60 bg-card/80 backdrop-blur-md">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircleIcon className="size-6 text-destructive" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold">Verification failed</p>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-lg border-border/60 bg-card/80 backdrop-blur-md">
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="pr-9"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="pr-9"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm(v => !v)}
                aria-label={
                  showConfirm
                    ? 'Hide confirm password'
                    : 'Show confirm password'
                }
              >
                {showConfirm ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2Icon className="size-4 mr-2 animate-spin" />}
            Set password &amp; sign in
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Already have an account?{' '}
          <Link to="/ats/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
