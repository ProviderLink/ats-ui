import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useResolvedTags, type RawTag } from '@/lib/tags';
import { cn } from '@/lib/utils';
import { MousePointerClickIcon } from 'lucide-react';

export interface TagListProps {
  /** Raw tags from the entity — strings (ObjectIds) and/or full Tag objects. */
  tags: RawTag[] | null | undefined;
  /** Max chips to render explicitly; rest becomes "+N". */
  max?: number;
  /** Stack tags vertically instead of inline wrap. */
  stacked?: boolean;
  className?: string;
}

/**
 * Render a candidate's / job's / client's tags as colored chips.
 *
 * Resolves raw backend data (which may arrive as `string[]` of ObjectIds or
 * as full `Tag[]` — see `lib/tags.ts`) against the cached Tag store before
 * rendering, so chips always show `name` + `color` instead of empty boxes.
 * Place it with `<TagList tags={row.original.tags} max={2} />`.
 */
export function TagList({ tags, max = 2, stacked, className }: TagListProps) {
  const resolved = useResolvedTags(tags);

  if (resolved.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const visible = resolved.slice(0, max);
  const overflow = resolved.length - max;

  return (
    <div
      className={cn(
        stacked
          ? 'flex flex-col gap-1 items-start'
          : 'flex items-center gap-1 flex-wrap',
        className
      )}
    >
      {visible.map(tag => (
        <span
          key={tag._id}
          className="inline-flex items-center gap-1 h-5 rounded-full border px-2 text-xs font-medium"
          style={{
            borderColor: tag.color + '70',
            color: tag.color,
            backgroundColor: tag.color + '12',
          }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          {tag.name}
        </span>
      ))}
      {overflow > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 h-5 shrink-0 rounded-md border border-dashed px-1.5 text-xs leading-none text-muted-foreground bg-muted/40 cursor-pointer">
                +{overflow} more
                <MousePointerClickIcon className="size-3 text-warning" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="flex flex-col gap-1.5 p-2 text-xs bg-popover text-popover-foreground border border-border">
              {resolved.map(t => (
                <span
                  key={t._id}
                  className="inline-flex items-center gap-1 h-5 rounded-full border px-2 text-xs font-medium"
                  style={{
                    borderColor: t.color + '70',
                    color: t.color,
                    backgroundColor: t.color + '12',
                  }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.name}
                </span>
              ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
