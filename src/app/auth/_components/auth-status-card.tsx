import { CardContent } from '@/components/ui/card';
import { Loader2Icon, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { AuthCard } from './auth-card';

interface AuthStatusCardProps {
  icon: LucideIcon;
  tone?: 'success' | 'error' | 'loading';
  title: string;
  description: ReactNode;
  children?: ReactNode;
}

export function AuthStatusCard({
  icon: Icon,
  tone = 'success',
  title,
  description,
  children,
}: AuthStatusCardProps) {
  return (
    <AuthCard>
      <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
        {tone === 'loading' ? (
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        ) : (
          <div
            className={`flex size-12 items-center justify-center rounded-full ${tone === 'error' ? 'bg-destructive/10' : 'bg-accent'}`}
          >
            <Icon
              className={`size-6 ${tone === 'error' ? 'text-destructive' : 'text-primary'}`}
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </CardContent>
    </AuthCard>
  );
}
