import { cn } from '@/lib/utils';
import { CheckIcon, XIcon } from 'lucide-react';
import { RatingStars } from './rating-stars';

export interface CheckItem {
  label: string;
  value: boolean;
}

interface CategoryDetailProps {
  title: string;
  rating: number;
  /** Yes/No criteria, shown as a checklist. */
  checks?: CheckItem[];
  /** Label/value facts, e.g. sub-ratings or a measured speed. */
  facts?: { label: string; value: string }[];
  extra?: React.ReactNode;
  /** Interviewer's free-text notes for this category. */
  notes?: string;
}

function Check({ label, value }: CheckItem) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={cn(
          'grid size-4 shrink-0 place-items-center rounded-full',
          value
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {value ? (
          <CheckIcon className="size-3" strokeWidth={3} />
        ) : (
          <XIcon className="size-3" strokeWidth={3} />
        )}
      </span>
      <span className={value ? '' : 'text-muted-foreground'}>{label}</span>
    </li>
  );
}

export function CategoryDetail({
  title,
  rating,
  checks = [],
  facts = [],
  extra,
  notes,
}: CategoryDetailProps) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        <RatingStars rating={rating} showValue />
      </div>

      {facts.length > 0 && (
        <dl className="flex flex-col gap-1.5">
          {facts.map(f => (
            <div key={f.label} className="flex justify-between gap-3 text-sm">
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {checks.length > 0 && (
        <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {checks.map(c => (
            <Check key={c.label} {...c} />
          ))}
        </ul>
      )}

      {extra}

      {notes && (
        <p className="whitespace-pre-wrap rounded-md bg-muted/50 px-3 py-2 text-sm leading-relaxed">
          {notes}
        </p>
      )}
    </section>
  );
}
