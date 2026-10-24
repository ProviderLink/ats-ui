import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn, formatDate } from '@/lib/utils';
import { useUserStore } from '@/store';
import type { PipelineTemplate } from '@/store/types';
import { LayersIcon, PencilIcon, PowerIcon, StarIcon } from 'lucide-react';
import { FALLBACK_STAGE_ICON, STAGE_ICONS } from '../_utils/stage-icons';
import { IconTile, Pill, SectionHeading } from './template-ui';

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
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="flex-row items-start gap-3 px-6 pt-6 pb-4 pr-14">
          <IconTile icon={LayersIcon} />
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base leading-tight font-semibold">
              {template.name}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs">
              {activeStages.length} active stage
              {activeStages.length !== 1 ? 's' : ''}
              {' · '}Updated {formatDate(template.updatedAt)}
            </DialogDescription>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {template.isDefault && (
                <Pill tone="amber" icon={StarIcon}>
                  Default
                </Pill>
              )}
              <Pill
                tone={template.isActive ? 'emerald' : 'neutral'}
                icon={PowerIcon}
              >
                {template.isActive ? 'Active' : 'Inactive'}
              </Pill>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto border-t px-6 py-5">
          <div className="flex flex-col gap-6">
            {template.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {template.description}
              </p>
            )}

            <section className="flex flex-col gap-3">
              <SectionHeading>Pipeline stages</SectionHeading>
              {activeStages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active stages.
                </p>
              ) : (
                <ol className="flex flex-col">
                  {activeStages.map((s, i) => {
                    const Icon = STAGE_ICONS[s.icon] ?? FALLBACK_STAGE_ICON;
                    const last = i === activeStages.length - 1;
                    return (
                      <li key={s._id} className="flex items-stretch gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--stage)_18%,transparent)] text-[color-mix(in_srgb,var(--stage)_60%,black)] dark:text-(--stage)"
                            style={
                              { '--stage': s.color } as React.CSSProperties
                            }
                          >
                            <Icon className="size-4" />
                          </span>
                          {!last && (
                            <span className="my-1 w-px flex-1 bg-gray-300 dark:bg-border" />
                          )}
                        </div>
                        <div
                          className={cn(
                            'flex min-w-0 flex-1 items-center justify-between gap-2 pt-1.5',
                            !last && 'pb-4',
                          )}
                        >
                          <span className="text-sm font-medium">{s.name}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            Stage {i + 1}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            {inactiveStages.length > 0 && (
              <section className="flex flex-col gap-2">
                <SectionHeading>
                  Inactive stages ({inactiveStages.length})
                </SectionHeading>
                <div className="flex flex-wrap gap-1.5">
                  {inactiveStages.map(s => (
                    <span
                      key={s._id}
                      className="rounded-md border border-dashed border-gray-400 bg-gray-100 px-2 py-0.5 text-xs text-gray-600 line-through dark:border-border dark:bg-transparent dark:text-muted-foreground"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-gray-50 px-6 py-3 dark:bg-white/3">
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            Created by {resolveUser(template.createdBy)} ·{' '}
            {formatDate(template.createdAt)}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {onEdit && (
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(template);
                }}
              >
                <PencilIcon className="size-3.5" />
                Edit template
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
