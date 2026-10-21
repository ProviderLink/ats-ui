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
import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import {
  usePipelineTemplateForm,
  type PipelineTemplateFormData,
} from '../_hooks/use-pipeline-template-form';
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
      <SheetContent className="w-full sm:max-w-sm flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>
            {template ? 'Edit Template' : 'New Pipeline Template'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Pipeline template name, stages and stage order.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto flex-1">
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

            <StatusSwitches
              isDefault={form.isDefault}
              isActive={form.isActive}
              wasDefault={!!template?.isDefault}
              existingDefaultName={existingDefaultName}
              onDefaultChange={form.changeDefault}
              onActiveChange={form.setIsActive}
            />

            {showErrors && form.errors.length > 0 && (
              <ul className="list-disc pl-5 text-xs text-destructive">
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

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t">
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
