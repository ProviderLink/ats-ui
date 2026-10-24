import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DispositionReason } from '@/store/slices/disposition-reasons.store';
import { GripVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react';

interface ReasonRowProps {
  reason: DispositionReason;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function ReasonRow({
  reason: r,
  deleting,
  onEdit,
  onDelete,
}: ReasonRowProps) {
  const stageCount = r.applicableStages.length;

  return (
    <div className="flex items-center gap-3 px-6 py-3 border-t border-muted hover:bg-muted/30 transition-colors">
      <GripVerticalIcon className="size-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate ${!r.isActive ? 'text-muted-foreground line-through' : ''}`}
        >
          {r.label}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {!r.isActive && (
            <Badge variant="outline" className="text-[10px] h-4 px-1 border-gray-300 bg-gray-100 text-gray-800 dark:border-border dark:bg-transparent dark:text-foreground">
              Inactive
            </Badge>
          )}
          {r.requireInternalNotes && (
            <Badge variant="outline" className="text-[10px] h-4 px-1 border-gray-300 bg-gray-100 text-gray-800 dark:border-border dark:bg-transparent dark:text-foreground">
              Notes required
            </Badge>
          )}
          {stageCount > 0 ? (
            <Badge variant="outline" className="text-[10px] h-4 px-1 border-gray-300 bg-gray-100 text-gray-800 dark:border-border dark:bg-transparent dark:text-foreground">
              {stageCount} stage{stageCount !== 1 ? 's' : ''}
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              All stages
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="secondary"
                className="border border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200 dark:border-transparent dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
                aria-label={`Edit ${r.label}`}
                onClick={onEdit}
              >
                <PencilIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Edit reason</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* `destructive` is a soft danger tint, so the irreversible
                  action reads as risky while keeping a light background. */}
              <Button
                size="icon-sm"
                variant="destructive"
                className="border border-red-300 bg-red-100 text-red-700 hover:bg-red-200 dark:border-transparent dark:bg-destructive/10 dark:text-destructive dark:hover:bg-destructive/20"
                disabled={deleting}
                aria-label={`Delete ${r.label}`}
                onClick={onDelete}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Delete reason</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
