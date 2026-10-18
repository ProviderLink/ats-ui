/**
 * Interview Scorecard entry form (React Hook Form + Zod).
 *
 * The live score preview is cosmetic: the server is the source of truth and
 * recomputes on save. The computed weighted / overall / communication fields
 * are never sent to the backend.
 */
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';
import { CalendarClockIcon, Loader2Icon } from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { useScorecardForm } from '../_hooks/use-scorecard-form';
import { useScorecardInterviewers } from '../_hooks/use-scorecard-interviewers';
import { FinalRecommendationSection } from './scorecard-form/final-recommendation-section';
import { InterviewDetailsSection } from './scorecard-form/interview-details-section';
import { NotesSection } from './scorecard-form/notes-section';
import { RatingCategories } from './scorecard-form/rating-categories';

interface InterviewScorecardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  /** Pre-selected job id (e.g. the active pipeline application's job). */
  defaultJobId?: string | null;
  /** Allowed job choices (jobs scoped to this candidate's applications). */
  jobOptions: { _id: string; title: string }[];
  /** When set, the form is in edit mode for this existing scorecard. */
  editing?: InterviewScorecard | null;
  onCreated?: () => void;
}

export function InterviewScorecardForm({
  open,
  onOpenChange,
  candidateId,
  defaultJobId,
  jobOptions,
  editing,
  onCreated,
}: InterviewScorecardFormProps) {
  const { form, previewScores, mutating, onSubmit } = useScorecardForm({
    open,
    candidateId,
    defaultJobId,
    editing,
    onClose: () => onOpenChange(false),
    onCreated,
  });
  const { interviewerOptions, interviewersLoading } = useScorecardInterviewers(
    open,
    editing?.interviewerId
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex max-w-none! w-full sm:w-[60vw] min-w-95 flex-col gap-0 p-0"
      >
        <SheetHeader className="shrink-0 border-b px-6 py-4">
          <SheetTitle>
            {editing ? 'Edit Interview Scorecard' : 'New Interview Scorecard'}
          </SheetTitle>
          <SheetDescription>
            Rate the candidate across five categories. Overall score is computed
            automatically and finalized by the server on submit.
          </SheetDescription>
        </SheetHeader>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
              <InterviewDetailsSection
                jobOptions={jobOptions}
                defaultJobId={defaultJobId}
                isEditing={!!editing}
                interviewerOptions={interviewerOptions}
                interviewersLoading={interviewersLoading}
              />
              <Separator />
              <RatingCategories scores={previewScores} />
              <Separator />
              <NotesSection />
              <Separator />
              <FinalRecommendationSection />
            </div>

            <SheetFooter className="shrink-0 flex-col items-stretch gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CalendarClockIcon className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Overall score preview
                </span>
                <span className="text-sm font-semibold">
                  {previewScores.overallScore.toFixed(1)}/100
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={mutating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutating}>
                  {mutating && (
                    <Loader2Icon className="size-4 mr-2 animate-spin" />
                  )}
                  {editing ? 'Save Changes' : 'Submit Scorecard'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}
