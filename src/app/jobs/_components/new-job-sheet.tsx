import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Client, Job } from '@/store';
import { TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';
import { useJobAi } from '../_hooks/use-job-ai';
import { useJobFormState } from '../_hooks/use-job-form-state';
import { useJobSheetData } from '../_hooks/use-job-sheet-data';
import { useJobSubmit } from '../_hooks/use-job-submit';
import { AiBadge } from './new-job/ai-badge';
import { AiDraftCard } from './new-job/ai-draft-card';
import { AiImproveCard } from './new-job/ai-improve-card';
import { ClientCombobox } from './new-job/client-combobox';
import { FormField } from './new-job/form-field';
import { JobAttributeFields } from './new-job/job-attribute-fields';
import { JobContentFields } from './new-job/job-content-fields';
import { PipelinePicker } from './new-job/pipeline-picker';
import { ScheduleCompensationFields } from './new-job/schedule-compensation-fields';

interface NewJobSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  job?: Job;
  clients?: Client[];
}

export function NewJobSheet({
  open,
  onOpenChange,
  job,
  clients: clientsProp,
}: NewJobSheetProps) {
  const isEdit = !!job;
  const { clients, tags } = useJobSheetData(open, clientsProp);
  const { form, patch, activePipelines } = useJobFormState(open, job);
  const ai = useJobAi(form, patch, isEdit);
  const { submit, mutating } = useJobSubmit(form, job, () =>
    onOpenChange(false)
  );
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  /**
   * Creation only: warn before throwing away an in-progress brief or a
   * generated draft. Edit mode keeps its existing close behaviour.
   */
  const hasUnsavedDraft =
    !isEdit &&
    (ai.aiNotes.trim() !== '' ||
      form.title.trim() !== '' ||
      form.description.trim() !== '' ||
      ai.aiHasListContent);

  function handleOpenChange(next: boolean) {
    if (next) {
      onOpenChange(true);
      return;
    }
    if (hasUnsavedDraft && !mutating) {
      setConfirmDiscard(true);
      return;
    }
    onOpenChange(false);
  }

  const canSubmit =
    !mutating &&
    !!form.title.trim() &&
    !!form.clientId &&
    !!form.jobType &&
    !!form.locationType &&
    !!form.experienceLevel &&
    !!form.description.trim();

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'flex flex-col gap-0 p-0',
          isEdit
            ? 'data-[side=right]:sm:max-w-xl'
            : 'data-[side=right]:sm:max-w-2xl'
        )}
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{isEdit ? 'Edit Job' : 'New Job'}</SheetTitle>
          <SheetDescription className="sr-only">
            Job details, requirements, salary range and pipeline.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {isEdit ? <AiImproveCard ai={ai} /> : <AiDraftCard ai={ai} />}

          <FormField
            label="Job Title"
            required
            badge={ai.aiFilled.title ? <AiBadge /> : undefined}
          >
            <Input
              placeholder="e.g. Senior Frontend Engineer"
              value={form.title}
              onChange={e => {
                patch({ title: e.target.value });
                ai.clearAiFilled('title');
              }}
            />
          </FormField>

          <FormField label="Client" required>
            <ClientCombobox
              clients={clients}
              value={form.clientId}
              onChange={clientId => patch({ clientId })}
            />
          </FormField>

          <PipelinePicker
            pipelines={activePipelines}
            value={form.pipelineId}
            onChange={pipelineId => patch({ pipelineId })}
          />

          <JobAttributeFields form={form} patch={patch} />
          <ScheduleCompensationFields form={form} patch={patch} />
          <JobContentFields
            form={form}
            patch={patch}
            tags={tags}
            aiFilled={ai.aiFilled}
            onAiFieldEdited={ai.clearAiFilled}
          />
        </div>

        {confirmDiscard && (
          <div className="flex items-start gap-2 border-t border-warning/40 bg-warning/10 px-6 py-3">
            <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0 text-warning" />
            <p className="text-xs text-foreground">
              You have unsaved job details. Close and discard them?
            </p>
          </div>
        )}

        <SheetFooter className="border-t px-6 py-4 gap-2">
          {confirmDiscard ? (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDiscard(false)}
              >
                Keep editing
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setConfirmDiscard(false);
                  onOpenChange(false);
                }}
              >
                Discard
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={mutating}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
                onClick={() => void submit()}
                disabled={!canSubmit}
              >
                {isEdit ? 'Save Changes' : 'Add Job'}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
