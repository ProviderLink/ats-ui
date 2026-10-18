import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { PipelineTemplate } from '@/store/types';
import {
  EyeIcon,
  PencilIcon,
  PowerIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react';

export interface TemplateRowActionsProps {
  template: PipelineTemplate;
  onToggleActive: () => void;
  onSetDefault: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TemplateRowActions({
  template: tpl,
  onToggleActive,
  onSetDefault,
  onView,
  onEdit,
  onDelete,
}: TemplateRowActionsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onToggleActive}
            aria-label={
              tpl.isActive ? `Deactivate ${tpl.name}` : `Activate ${tpl.name}`
            }
            className={cn(
              'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-xs font-medium transition-colors',
              tpl.isActive
                ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:border-primary/60'
                : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <PowerIcon className="size-3" />
            {tpl.isActive ? 'Active' : 'Inactive'}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tpl.isActive
            ? 'Deactivate template — it will no longer be selectable when creating jobs'
            : 'Activate template — make it available for selection when creating jobs'}
        </TooltipContent>
      </Tooltip>
      {!tpl.isDefault && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:hover:text-amber-400"
              onClick={onSetDefault}
            >
              <StarIcon className="size-3" />
              Set default
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-55">
            ⚠️ This will make this the default template. The current default
            template will be un-defaulted — only one default pipeline template
            is allowed at a time.
          </TooltipContent>
        </Tooltip>
      )}
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={onView}
      >
        <EyeIcon className="size-3" />
        View
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
        onClick={onEdit}
      >
        <PencilIcon className="size-3" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
        onClick={onDelete}
        disabled={tpl.isDefault}
      >
        <Trash2Icon className="size-3" />
        Delete
      </Button>
    </div>
  );
}
