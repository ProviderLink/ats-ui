import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EMAIL_TEMPLATE_TYPE_LABELS } from '@/lib/email-templates';
import { cn } from '@/lib/utils';
import type { EmailTemplate } from '@/store/types';
import {
  EyeIcon,
  PencilIcon,
  PowerIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react';

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
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
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
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 gap-1 px-2 text-xs',
              tpl.isActive
                ? 'text-muted-foreground hover:text-foreground'
                : 'text-muted-foreground/50 hover:text-foreground'
            )}
            onClick={onToggleActive}
            disabled={togglingActive}
          >
            <PowerIcon className="size-3" />
            {tpl.isActive ? 'Active' : 'Inactive'}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tpl.isActive ? 'Click to deactivate' : 'Click to activate'}
        </TooltipContent>
      </Tooltip>

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
      >
        <Trash2Icon className="size-3" />
        Delete
      </Button>
    </div>
  );
}
