import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  /** DOM id so the score strip can scroll to this section. */
  id?: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Right-aligned header content (e.g. the weighted score). */
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function SectionCard({
  id,
  icon: Icon,
  title,
  subtitle,
  aside,
  className,
  children,
}: SectionCardProps) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-20 flex flex-col gap-4 rounded-xl border bg-card p-4 @lg:p-5',
        className
      )}
    >
      <header className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
