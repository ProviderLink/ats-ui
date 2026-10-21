import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { CheckIcon } from 'lucide-react';
import { SectionCard } from './section-card';

interface CategorySectionProps {
  id: string;
  icon: LucideIcon;
  title: string;
  weight: number;
  weighted: number;
  rated: boolean;
  children: React.ReactNode;
}

export function CategorySection({
  id,
  icon,
  title,
  weight,
  weighted,
  rated,
  children,
}: CategorySectionProps) {
  return (
    <SectionCard
      id={id}
      icon={icon}
      title={title}
      subtitle={`Worth ${weight} of 100 points`}
      aside={
        <span
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums',
            rated
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {rated && <CheckIcon className="size-3" />}
          {weighted.toFixed(1)}
          <span className="font-normal opacity-70">/ {weight}</span>
        </span>
      }
    >
      {children}
    </SectionCard>
  );
}
