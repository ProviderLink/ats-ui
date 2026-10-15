import { PasswordInput } from '@/components/password-input';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/slices/auth.store';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthCard } from '../_components/auth-card';
import { AuthEmailField } from '../_components/auth-email-field';
import { AuthSubmitButton } from '../_components/auth-submit-button';

export default function LoginPage() {
  const login = useAuthStore(s => s.login);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isInitialized = useAuthStore(s => s.isInitialized);

  const navigate = useNavigate();
  const location = useLocation();
  const from = useRef(
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/ats/dashboard'
  ).current;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isInitialized && isAuthenticated) navigate(from, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, isAuthenticated]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully.');
    } catch (err) {
      toast.error(
        (err as Error).message || 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Welcome back</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthEmailField value={email} onChange={setEmail} />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/ats/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              toggleLabel="password"
            />
          </div>
          <AuthSubmitButton loading={loading}>Sign in</AuthSubmitButton>
        </form>
      </CardContent>
    </AuthCard>
  );
}
