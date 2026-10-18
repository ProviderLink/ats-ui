import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { StarIcon } from 'lucide-react';
import { StageChips } from '../stage-chips';
import {
  TemplateRowActions,
  type TemplateRowActionsProps,
} from './template-row-actions';

export function TemplateRow(props: TemplateRowActionsProps) {
  const tpl = props.template;

  return (
    <div className="flex items-start gap-3 px-6 py-4">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{tpl.name}</span>
          {tpl.isDefault && (
            <Badge
              variant="default"
              className="gap-1 h-5 px-2 text-[11px] font-semibold uppercase tracking-wide shadow-sm"
            >
              <StarIcon className="size-3 shrink-0 fill-current" />
              Default
            </Badge>
          )}
        </div>
        {tpl.description && (
          <p className="text-xs text-muted-foreground">{tpl.description}</p>
        )}
        <StageChips stages={tpl.stages} />
        <p className="text-xs text-muted-foreground mt-0.5">
          {tpl.stages.filter(s => s.isActive).length} stages · Updated{' '}
          {formatDate(tpl.updatedAt)}
        </p>
      </div>
      <TemplateRowActions {...props} />
    </div>
  );
}
