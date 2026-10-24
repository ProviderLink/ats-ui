import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ActiveSwitch } from '../active-switch';
import type { PipelineTemplate } from '@/store/types';
import { EyeIcon, PencilIcon, StarIcon, Trash2Icon } from 'lucide-react';

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
          <span>
            <ActiveSwitch
              active={tpl.isActive}
              label={
                tpl.isActive ? `Deactivate ${tpl.name}` : `Activate ${tpl.name}`
              }
              onToggle={onToggleActive}
            />
          </span>
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
              className="h-7 gap-1 px-2 text-xs border border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200 hover:text-amber-900 dark:border-transparent dark:bg-transparent dark:text-muted-foreground dark:hover:text-amber-400 dark:hover:bg-amber-950/40"
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
        className="h-7 gap-1 px-2 text-xs border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 dark:border-input dark:bg-input/30 dark:text-muted-foreground dark:hover:bg-input/50 dark:hover:text-foreground"
        onClick={onView}
      >
        <EyeIcon className="size-3" />
        View
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-xs border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 hover:border-blue-400 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-primary/10 dark:hover:text-primary dark:hover:border-primary/30"
        onClick={onEdit}
      >
        <PencilIcon className="size-3" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-xs border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 hover:border-red-400 dark:border-input dark:bg-input/30 dark:text-destructive dark:hover:bg-destructive/10 dark:hover:border-destructive/40"
        onClick={onDelete}
        disabled={tpl.isDefault}
      >
        <Trash2Icon className="size-3" />
        Delete
      </Button>
    </div>
  );
}
