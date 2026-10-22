import { cn } from '@/lib/utils';
import { StarIcon } from 'lucide-react';

export function RatingStars({
  rating,
  showValue = false,
}: {
  rating: number;
  showValue?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label={`${rating} out of 5`}
    >
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
      {showValue && (
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {rating}/5
        </span>
      )}
    </div>
  );
}
