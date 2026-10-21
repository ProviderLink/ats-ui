import { cn } from '@/lib/utils';
import { StarIcon } from 'lucide-react';

interface CategoryDetailProps {
  title: string;
  rating: number;
  weighted: number;
  weight: number;
  subRows?: { label: string; value: string }[];
  extra?: React.ReactNode;
  note?: string;
  /** Interviewer's free-text notes for this category. */
  notes?: string;
}

export function CategoryDetail({
  title,
  rating,
  weighted,
  weight,
  subRows = [],
  extra,
  note,
  notes,
}: CategoryDetailProps) {
  return (
    <section className="rounded-lg border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-semibold">
          {title}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            weight {weight}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={cn(
                  'size-3.5',
                  i < rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/30'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {weighted.toFixed(1)}/{weight}
          </span>
        </div>
      </div>

      {subRows.length > 0 && (
        <ul className="text-sm text-muted-foreground flex flex-col gap-1.5">
          {subRows.map((r, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>{r.label}</span>
              <span className="text-foreground font-medium">{r.value}</span>
            </li>
          ))}
        </ul>
      )}

      {note && <p className="text-xs text-muted-foreground italic">{note}</p>}
      {extra}
      {notes && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Notes
          </span>
          <p className="text-sm whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </section>
  );
}
