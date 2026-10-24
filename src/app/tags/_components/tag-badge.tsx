import { TAG_CHIP_CLS } from '@/components/tag-list';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  color: string;
  fallback?: string;
};

export function TagBadge({ name, color, fallback = 'Preview' }: Props) {
  return (
    <span
      className={cn(
        TAG_CHIP_CLS,
        'h-auto gap-1.5 px-2.5 py-0.5 whitespace-nowrap',
      )}
      style={{ '--tag': color } as React.CSSProperties}
    >
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      {name || fallback}
    </span>
  );
}
