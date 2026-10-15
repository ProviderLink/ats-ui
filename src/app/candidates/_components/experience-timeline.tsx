import { cn } from '@/lib/utils';
import type { ParsedExperience } from '@/store/types';

export function ExperienceTimeline({ items }: { items: ParsedExperience[] }) {
  if (items.length === 0)
    return (
      <p className="text-sm text-muted-foreground">No experience listed.</p>
    );
  return (
    <div className="flex flex-col">
      {items.map((exp, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="mt-1.5 size-2 shrink-0 rounded-full bg-pine-teal-600 dark:bg-pine-teal-400" />
            {i < items.length - 1 && (
              <div className="mt-1 w-px flex-1 bg-border" />
            )}
          </div>
          <div
            className={cn('min-w-0', i < items.length - 1 ? 'pb-5' : 'pb-1')}
          >
            <p className="text-sm font-medium leading-tight">{exp.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {exp.company} · {exp.duration}
            </p>
            {exp.description && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {exp.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
