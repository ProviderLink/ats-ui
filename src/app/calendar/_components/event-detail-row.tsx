import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EventDetailRowProps {
  icon: LucideIcon;
  alignTop?: boolean;
  children: ReactNode;
}

export function EventDetailRow({
  icon: Icon,
  alignTop,
  children,
}: EventDetailRowProps) {
  return (
    <div
      className={cn(
        'flex gap-3 text-sm',
        alignTop ? 'items-start' : 'items-center'
      )}
    >
      <Icon
        className={cn(
          'size-4 text-muted-foreground shrink-0',
          alignTop && 'mt-0.5'
        )}
      />
      {children}
    </div>
  );
}
