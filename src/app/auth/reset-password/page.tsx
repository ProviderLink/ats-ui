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
  ArrowLeftIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const resetPassword = useAuthStore(s => s.resetPassword);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
      <Card className="rounded-xl shadow-lg border-border/60 bg-card/80 backdrop-blur-md">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
          <p className="text-sm text-destructive">
            Invalid or missing reset token.
          </p>
          <Link
            to="/ats/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Request a new link
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
            <p className="text-base font-semibold">Password updated</p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to sign in…
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-lg border-border/60 bg-card/80 backdrop-blur-md">
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">New password</Label>
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
                aria-label={
                  showPassword ? 'Hide new password' : 'Show new password'
                }
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
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading && <Loader2Icon className="size-4 animate-spin" />}
            Update password
          </Button>
          <Link
            to="/ats/login"
            className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to sign in
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
