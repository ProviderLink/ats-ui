/**
 * Interview Scorecard entry form (React Hook Form + Zod).
 *
 * The live score preview is cosmetic: the server is the source of truth and
 * recomputes on save. The computed weighted / overall / communication fields
 * are never sent to the backend.
 */
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';
import { Loader2Icon } from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import type { ScorecardJobOption } from '../_utils/scorecard-form';
import { useScorecardForm } from '../_hooks/use-scorecard-form';
import { useScorecardTagSuggestions } from '../_hooks/use-scorecard-tag-suggestions';
import { useScorecardInterviewers } from '../_hooks/use-scorecard-interviewers';
import { FinalRecommendationSection } from './scorecard-form/final-recommendation-section';
import { InterviewDetailsSection } from './scorecard-form/interview-details-section';
import { NotesSection } from './scorecard-form/notes-section';
import { RatingCategories } from './scorecard-form/rating-categories';
import { CompletionHint, ScoreStrip } from './scorecard-form/score-strip';

/** After a failed submit, bring the first invalid field into view. */
function scrollToFirstError() {
  requestAnimationFrame(() => {
    document
      .querySelector('[aria-invalid="true"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

interface InterviewScorecardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  /** Pre-selected job id (e.g. the active pipeline application's job). */
  defaultJobId?: string | null;
  /** Allowed job choices (jobs scoped to this candidate's applications). */
  jobOptions: ScorecardJobOption[];
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
  const { interviewerOptions } = useScorecardInterviewers(
    open,
    editing?.interviewerId
  );

  const tagSuggestions = useScorecardTagSuggestions(open);

  return (
    // Non-modal and overlay-free so the candidate profile stays visible and
    // scrollable beside the form (the profile sheet shrinks to the left while
    // this is open — see CandidateDetailSheet).
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        showOverlay={false}
        // Closed only by Cancel / a successful submit, so a stray Esc or click
        // can't throw away a half-filled scorecard.
        showCloseButton={false}
        onEscapeKeyDown={e => e.preventDefault()}
        onInteractOutside={e => e.preventDefault()}
        // The profile sheet is modal and its scroll lock cancels wheel/touch
        // events outside it; stop them here so this panel can still scroll.
        onWheel={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
        className="flex max-w-none! w-full sm:w-[60vw] lg:w-[50vw] min-w-95 flex-col gap-0 p-0"
      >
        <SheetHeader className="shrink-0 flex-row items-center justify-between gap-4 border-b px-5 py-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <SheetTitle className="text-base">
              {editing ? 'Edit interview scorecard' : 'New interview scorecard'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Rate five areas — the score is calculated for you.
            </SheetDescription>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <p className="text-2xl font-semibold leading-none tabular-nums">
              {previewScores.overallScore.toFixed(1)}
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                /100
              </span>
            </p>
            <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${previewScores.overallScore}%` }}
              />
            </div>
          </div>
        </SheetHeader>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="@container flex-1 overflow-y-auto bg-muted/30 px-5 pb-6">
              <ScoreStrip scores={previewScores} />
              <div className="flex flex-col gap-4 pt-4">
                <InterviewDetailsSection
                  candidateId={candidateId}
                  open={open}
                  editingInterviewId={editing?.interviewId}
                  jobOptions={jobOptions}
                  defaultJobId={defaultJobId}
                  isEditing={!!editing}
                  interviewerOptions={interviewerOptions}
                  editingAuthorId={editing?.interviewerId}
                />
                <RatingCategories
                  scores={previewScores}
                  tagSuggestions={tagSuggestions}
                />
                <NotesSection />
                <FinalRecommendationSection />
              </div>
            </div>

            <SheetFooter className="shrink-0 flex-row items-center justify-between gap-3 border-t px-5 py-3">
              <CompletionHint />
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
                  {editing ? 'Save changes' : 'Submit scorecard'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}
