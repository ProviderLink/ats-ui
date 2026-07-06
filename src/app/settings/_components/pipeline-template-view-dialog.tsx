import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import { useUserStore } from '@/store';
import type { PipelineTemplate } from '@/store/types';
import { StarIcon } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: PipelineTemplate | null;
  onEdit?: (template: PipelineTemplate) => void;
};

export function PipelineTemplateViewDialog({
  open,
  onOpenChange,
  template,
  onEdit,
}: Props) {
  const users = useUserStore(s => s.items);

  if (!template) return null;

  function resolveUser(id?: string) {
    if (!id) return 'System';
    const u = users.find(u => u._id === id);
    return u ? `${u.firstName} ${u.lastName}`.trim() : 'System';
  }

  const activeStages = template.stages
    .filter(s => s.isActive)
    .sort((a, b) => a.order - b.order);
  const inactiveStages = template.stages
    .filter(s => !s.isActive)
    .sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-base font-semibold leading-none">
            {template.name}
          </DialogTitle>
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {template.isDefault && (
              <Badge variant="secondary" className="text-xs h-4 px-1.5 gap-0.5">
                <StarIcon className="size-2.5" />
                Default
              </Badge>
            )}
            <Badge
              variant={template.isActive ? 'secondary' : 'outline'}
              className="text-xs h-4 px-1.5"
            >
              {template.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {activeStages.length} active stage
              {activeStages.length !== 1 ? 's' : ''}
            </span>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh]">
          <div className="flex flex-col gap-4 px-6 py-5">
            {/* Description */}
            {template.description && (
              <>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
                <Separator />
              </>
            )}

            {/* Active stages */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pipeline stages
              </p>
              {activeStages.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No active stages.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {activeStages.map((s, i) => (
                    <div key={s._id} className="flex items-center gap-2.5">
                      <span className="text-xs text-muted-foreground w-4 text-right shrink-0">
                        {i + 1}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border"
                        style={{
                          background: `${s.color}18`,
                          borderColor: `${s.color}55`,
                          color: s.color,
                        }}
                      >
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ background: s.color }}
                        />
                        {s.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inactive stages */}
            {inactiveStages.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Inactive stages
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {inactiveStages.map(s => (
                      <span
                        key={s._id}
                        className="text-xs text-muted-foreground border border-dashed rounded-md px-2 py-0.5 line-through"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Created by {resolveUser(template.createdBy)}</span>
              <span>{formatDate(template.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Close
          </Button>
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onEdit(template);
              }}
            >
              Edit template
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
