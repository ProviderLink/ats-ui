import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import type { PipelineTemplate } from '@/store/types';
import { LayersIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import {
  usePipelineTemplateForm,
  type PipelineTemplateFormData,
} from '../_hooks/use-pipeline-template-form';
import { IconTile, SectionHeading } from './template-ui';
import { StagesEditor } from './pipeline-template-sheet/stages-editor';
import { StatusSwitches } from './pipeline-template-sheet/status-switches';

interface PipelineTemplateSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template?: PipelineTemplate;
  /** Name of the template currently marked as default, or null if none. Used
   *  to warn that saving will transfer the default status from that template.
   */
  existingDefaultName?: string | null;
  /** Rejects when the save fails so the sheet can stay open. */
  onSave: (data: PipelineTemplateFormData) => Promise<void>;
}

export function PipelineTemplateSheet({
  open,
  onOpenChange,
  template,
  existingDefaultName,
  onSave,
}: PipelineTemplateSheetProps) {
  const form = usePipelineTemplateForm(open, template);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = form.getData();
    if (!data) return;
    if (form.errors.length > 0) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    try {
      await onSave(data);
      onOpenChange(false);
    } catch {
      // The caller already toasted the error; keep the sheet open so nothing
      // the user typed is lost.
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(v: boolean) {
    if (!v) setShowErrors(false);
    onOpenChange(v);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="flex-row items-start gap-3 border-b px-6 py-5 pr-14">
          <IconTile icon={LayersIcon} />
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-base leading-tight">
              {template ? 'Edit pipeline template' : 'New pipeline template'}
            </SheetTitle>
            <SheetDescription className="mt-1 text-xs">
              {template
                ? `Update the name, settings and stages of “${template.name}”.`
                : 'Set up a hiring pipeline you can apply to jobs.'}
            </SheetDescription>
          </div>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-6 py-6">
            <section className="flex flex-col gap-4">
              <SectionHeading>Details</SectionHeading>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tpl-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tpl-name"
                  value={form.name}
                  onChange={e => form.setName(e.target.value)}
                  placeholder="e.g. Standard Hiring"
                  maxLength={100}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="tpl-desc">Description</Label>
                <Textarea
                  id="tpl-desc"
                  value={form.description}
                  onChange={e => form.setDescription(e.target.value)}
                  placeholder="Describe when to use this template..."
                  className="resize-none h-20"
                />
              </div>
            </section>

            <StatusSwitches
              isDefault={form.isDefault}
              isActive={form.isActive}
              wasDefault={!!template?.isDefault}
              existingDefaultName={existingDefaultName}
              onDefaultChange={form.changeDefault}
              onActiveChange={form.setIsActive}
            />

            {showErrors && form.errors.length > 0 && (
              <ul className="list-disc rounded-lg border border-red-300 bg-red-50 py-2.5 pr-3 pl-7 text-xs text-red-800 dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive">
                {form.errors.map(err => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            )}

            <StagesEditor
              stages={form.stages}
              onAdd={form.addStage}
              onUpdate={form.updateStage}
              onRemove={form.removeStage}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t bg-gray-50 px-6 py-4 dark:bg-white/3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.name.trim()}>
              {submitting && <Loader2Icon className="size-3.5 animate-spin" />}
              {submitting
                ? 'Saving…'
                : template
                  ? 'Save changes'
                  : 'Create template'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
