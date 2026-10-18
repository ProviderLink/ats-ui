import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { usePipelineTemplateStore } from '@/store';
import type { PipelineTemplate } from '@/store/types';
import { FileTextIcon, LayersIcon, PlusIcon } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { usePipelineTemplateActions } from '../_hooks/use-pipeline-template-actions';
import { PipelineTemplateSheet } from './pipeline-template-sheet';
import { PipelineTemplateViewDialog } from './pipeline-template-view-dialog';
import { TemplateRow } from './pipeline-templates-card/template-row';

export function PipelineTemplatesCard() {
  const templates = usePipelineTemplateStore(s => s.items);
  const loading = usePipelineTemplateStore(s => s.loading);
  const fetch = usePipelineTemplateStore(s => s.fetch);
  const actions = usePipelineTemplateActions();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<PipelineTemplate | undefined>(
    undefined
  );
  const [viewing, setViewing] = useState<PipelineTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PipelineTemplate | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch();
  }, [fetch]);

  function openSheet(tpl?: PipelineTemplate) {
    setEditing(tpl);
    setSheetOpen(true);
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
            <Button
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => openSheet()}
            >
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
              <Fragment key={tpl._id}>
                {i > 0 && <Separator />}
                <TemplateRow
                  template={tpl}
                  onToggleActive={() =>
                    actions.toggleActive(tpl._id, tpl.isActive)
                  }
                  onSetDefault={() => actions.makeDefault(tpl._id)}
                  onView={() => setViewing(tpl)}
                  onEdit={() => openSheet(tpl)}
                  onDelete={() => setDeleteTarget(tpl)}
                />
              </Fragment>
            ))}

            {!loading && templates.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground px-6">
                <FileTextIcon className="size-8 opacity-30" />
                <p>No pipeline templates yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openSheet()}
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
        onSave={data => actions.save(data, editing)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title="Delete pipeline template?"
        description={
          deleteTarget && (
            <>
              <strong>{deleteTarget.name}</strong> will be permanently deleted.
              This action cannot be undone.
            </>
          )
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          const deleted = await actions.deleteTemplate(deleteTarget._id);
          setDeleting(false);
          if (deleted) setDeleteTarget(null);
        }}
      />

      <PipelineTemplateViewDialog
        open={!!viewing}
        onOpenChange={open => !open && setViewing(null)}
        template={viewing}
        onEdit={tpl => {
          setViewing(null);
          openSheet(tpl);
        }}
      />
    </>
  );
}
