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
  onSave: (data: PipelineTemplateFormData) => void;
}

export function PipelineTemplateSheet({
  open,
  onOpenChange,
  template,
  existingDefaultName,
  onSave,
}: PipelineTemplateSheetProps) {
  const form = usePipelineTemplateForm(open, template);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = form.getData();
    if (!data) return;
    onSave(data);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[30vw] flex flex-col gap-0 p-0">
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!form.name.trim()}>
              {template ? 'Save changes' : 'Create template'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
