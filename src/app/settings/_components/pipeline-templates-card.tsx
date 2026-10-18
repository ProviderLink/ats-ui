import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatDate } from '@/lib/utils';
import { usePipelineTemplateStore } from '@/store';
import type { PipelineTemplate } from '@/store/types';
import {
  CheckIcon,
  EyeIcon,
  FileTextIcon,
  LayersIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PipelineTemplateSheet } from './pipeline-template-sheet';
import {
  PipelineTemplateViewDialog,
} from './pipeline-template-view-dialog';
import { StageChips } from './stage-chips';

export function PipelineTemplatesCard() {
  const {
    items: templates,
    loading,
    fetch,
    create,
    update,
    remove,
  } = usePipelineTemplateStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<PipelineTemplate | undefined>(
    undefined
  );
  const [viewing, setViewing] = useState<PipelineTemplate | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  function handleNew() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function handleView(tpl: PipelineTemplate) {
    setViewing(tpl);
  }

  function handleEdit(tpl: PipelineTemplate) {
    setEditing(tpl);
    setSheetOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await remove(id);
      toast.success('Pipeline template deleted');
      setConfirmId(null);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete template');
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await update(id, { isDefault: true });
      toast.success('Default pipeline template set');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to set default template');
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    try {
      await update(id, { isActive: !current });
      toast.success(`Template ${!current ? 'activated' : 'deactivated'}`);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to update template');
    }
  }

  async function handleSave(data: {
    name: string;
    description: string;
    isDefault: boolean;
    isActive: boolean;
    stages: PipelineTemplate['stages'];
  }) {
    const stagesDto = data.stages.map(({ _id: _omit, ...s }) => s);
    try {
      if (editing) {
        await update(editing._id, { ...data, stages: stagesDto });
        toast.success('Pipeline template updated');
      } else {
        await create({ ...data, stages: stagesDto });
        toast.success('Pipeline template created');
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save template');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayersIcon className="size-4 text-muted-foreground" />
            Pipeline Templates
          </CardTitle>
          <CardDescription>
            Manage hiring pipeline templates applied to jobs
          </CardDescription>
          <div className="flex justify-end mt-1">
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleNew}>
              <PlusIcon className="size-3.5" />
              New template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="flex flex-col">
            {loading && templates.length === 0 && (
              <div className="flex flex-col gap-3 px-6 py-4">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className="h-16 rounded-md bg-muted animate-pulse"
                  />
                ))}
              </div>
            )}
            {templates.map((tpl, i) => (
              <div key={tpl._id}>
                {i > 0 && <Separator />}
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
                      <p className="text-xs text-muted-foreground">
                        {tpl.description}
                      </p>
                    )}
                    <StageChips stages={tpl.stages} />
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tpl.stages.filter(s => s.isActive).length} stages ·
                      Updated {formatDate(tpl.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleActive(tpl._id, tpl.isActive)
                          }
                          aria-label={
                            tpl.isActive
                              ? `Deactivate ${tpl.name}`
                              : `Activate ${tpl.name}`
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
                            onClick={() => handleSetDefault(tpl._id)}
                          >
                            <StarIcon className="size-3" />
                            Set default
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-55">
                          ⚠️ This will make this the default template. The
                          current default template will be un-defaulted — only
                          one default pipeline template is allowed at a time.
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleView(tpl)}
                    >
                      <EyeIcon className="size-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      onClick={() => handleEdit(tpl)}
                    >
                      <PencilIcon className="size-3" />
                      Edit
                    </Button>
                    {confirmId === tpl._id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Delete?
                        </span>
                        <Button
                          variant="destructive"
                          size="xs"
                          className="h-7 gap-1 px-2"
                          onClick={() => handleDelete(tpl._id)}
                        >
                          <CheckIcon className="size-3" /> Yes
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          className="h-7 gap-1 px-2"
                          onClick={() => setConfirmId(null)}
                        >
                          <XIcon className="size-3" /> No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                        onClick={() => setConfirmId(tpl._id)}
                        disabled={tpl.isDefault}
                      >
                        <Trash2Icon className="size-3" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!loading && templates.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground px-6">
                <FileTextIcon className="size-8 opacity-30" />
                <p>No pipeline templates yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNew}
                  className="mt-1 gap-1"
                >
                  <PlusIcon className="size-3.5" /> Create one
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PipelineTemplateSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        template={editing}
        onSave={handleSave}
      />

      <PipelineTemplateViewDialog
        open={!!viewing}
        onOpenChange={open => !open && setViewing(null)}
        template={viewing}
        onEdit={tpl => {
          setViewing(null);
          handleEdit(tpl);
        }}
      />
    </>
  );
}
