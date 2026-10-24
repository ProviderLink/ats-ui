import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EMAIL_TEMPLATE_TYPE_LABELS } from '@/lib/email-templates';
import { ActiveSwitch } from '../active-switch';
import type { EmailTemplate } from '@/store/types';
import { EyeIcon, PencilIcon, StarIcon, Trash2Icon } from 'lucide-react';

export interface TemplateRowActionsProps {
  template: EmailTemplate;
  togglingActive: boolean;
  settingDefault: boolean;
  onSetDefault: () => void;
  onToggleActive: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TemplateRowActions({
  template: tpl,
  togglingActive,
  settingDefault,
  onSetDefault,
  onToggleActive,
  onView,
  onEdit,
  onDelete,
}: TemplateRowActionsProps) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {!tpl.isDefault && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200 hover:text-amber-900 dark:border-input dark:bg-input/30 dark:text-muted-foreground dark:hover:bg-input/50 dark:hover:text-foreground"
              onClick={onSetDefault}
              disabled={settingDefault}
            >
              <StarIcon className="size-3" />
              Set default
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-52">
            Make this the default template for{' '}
            <strong>{EMAIL_TEMPLATE_TYPE_LABELS[tpl.type] ?? tpl.type}</strong>{' '}
            emails. The current default will be replaced.
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <ActiveSwitch
              active={tpl.isActive}
              disabled={togglingActive}
              label={
                tpl.isActive ? `Deactivate ${tpl.name}` : `Activate ${tpl.name}`
              }
              onToggle={onToggleActive}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tpl.isActive ? 'Click to deactivate' : 'Click to activate'}
        </TooltipContent>
      </Tooltip>

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
      >
        <Trash2Icon className="size-3" />
        Delete
      </Button>
    </div>
  );
}
