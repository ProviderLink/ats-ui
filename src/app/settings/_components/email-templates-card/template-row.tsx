import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EMAIL_TEMPLATE_TYPE_LABELS } from '@/lib/email-templates';
import { formatDate } from '@/lib/utils';
import { StarIcon } from 'lucide-react';
import {
  TemplateRowActions,
  type TemplateRowActionsProps,
} from './template-row-actions';

interface TemplateRowProps extends TemplateRowActionsProps {
  createdByName: string;
}

export function TemplateRow({ createdByName, ...actions }: TemplateRowProps) {
  const tpl = actions.template;
  const typeLabel = EMAIL_TEMPLATE_TYPE_LABELS[tpl.type] ?? tpl.type;

  return (
    <div className="flex items-start gap-3 px-6 py-4">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{tpl.name}</span>
          <Badge variant="outline" className="text-xs h-4 px-1.5">
            {typeLabel}
          </Badge>
          {tpl.isDefault && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="text-xs h-4 px-1.5 gap-0.5 cursor-default"
                >
                  <StarIcon className="size-2.5" />
                  Default for {typeLabel}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-52">
                This template is auto-selected when sending a{' '}
                <strong>{typeLabel}</strong> email.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate max-w-sm">
          {tpl.subject}
        </p>
        <p className="text-xs text-muted-foreground">
          By {createdByName} · {formatDate(tpl.createdAt)}
        </p>
      </div>
      <TemplateRowActions {...actions} />
    </div>
  );
}
