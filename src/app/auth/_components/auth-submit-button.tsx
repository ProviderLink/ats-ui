import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthSubmitButtonProps {
  loading: boolean;
  children: ReactNode;
  className?: string;
}

export function AuthSubmitButton({
  loading,
  children,
  className,
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      className={cn('w-full mt-2', className)}
      disabled={loading}
    >
      {loading && <Loader2Icon className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}
