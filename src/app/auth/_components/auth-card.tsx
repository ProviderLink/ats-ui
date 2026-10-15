import { Card } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <Card className="rounded-xl shadow-lg border-border/60 bg-card/80 backdrop-blur-md">
      {children}
    </Card>
  );
}
