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
import { ArrowLeftIcon, Loader2Icon, MailCheckIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

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
      <Card className="rounded-xl shadow-lg border-border/60 bg-card/80 backdrop-blur-md">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent">
            <MailCheckIcon className="size-6 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold">Check your email</p>
            <p className="text-sm text-muted-foreground">
              If an account exists for{' '}
              <span className="font-medium text-foreground">{email}</span>,
              you'll receive a password reset link.
            </p>
          </div>
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

  return (
    <Card className="rounded-xl shadow-lg border-border/60 bg-card/80 backdrop-blur-md">
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading && <Loader2Icon className="size-4 animate-spin" />}
            Send reset link
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
