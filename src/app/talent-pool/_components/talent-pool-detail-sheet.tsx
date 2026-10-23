import { CandidateProfileSections } from '@/app/candidates/_components/candidate-profile-sections';
import { CrmProfileSection } from '@/app/candidates/_components/crm-profile-section';
import { ResumeAndPortfolioSection } from '@/app/candidates/_components/resume-and-portfolio-section';
import { SectionLabel } from '@/app/candidates/_components/section-label';
import { ActivityTimeline } from '@/components/activity-timeline';
import { AssignJobDialog } from '@/components/assign-job-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useCandidateEmailActivity } from '@/hooks/use-candidate-email-activity';
import { useLoadFullCandidate } from '@/hooks/use-load-full-candidate';
import { useCandidateStore } from '@/store/slices/candidates.store';
import type { Candidate } from '@/store/types';
import { useState } from 'react';
import { useTalentPoolActions } from '../_hooks/use-talent-pool-actions';
import { RemoveTalentPoolConfirmDialog } from './remove-talent-pool-dialog';
import { TalentPoolAdditionalInfo } from './talent-pool-additional-info';
import { TalentPoolNotesEditor } from './talent-pool-notes-editor';
import { TalentPoolSheetHeader } from './talent-pool-sheet-header';

interface TalentPoolDetailSheetProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mutating?: boolean;
}

export function TalentPoolDetailSheet({
  candidate,
  open,
  onOpenChange,
  mutating = false,
}: TalentPoolDetailSheetProps) {
  const [assignJobOpen, setAssignJobOpen] = useState(false);
  const [removePoolConfirmOpen, setRemovePoolConfirmOpen] = useState(false);

  const actions = useTalentPoolActions(open, candidate, () =>
    setAssignJobOpen(false)
  );

  // The `candidate` prop is a snapshot from when the sheet opened; the store's
  // detail/list entry stays current across mutations.
  const current = useCandidateStore(s =>
    candidate
      ? (s.detail[candidate._id] ?? s.items.find(i => i._id === candidate._id))
      : undefined
  );
  useLoadFullCandidate(candidate?._id, open);
  const emailActivity = useCandidateEmailActivity((current ?? candidate)?._id);

  if (!candidate) return null;
  const c = current ?? candidate;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex flex-col p-0 max-w-none! w-full sm:w-[60vw] min-w-95"
        >
          <TalentPoolSheetHeader
            candidate={c}
            allTags={actions.allTags}
            mutating={mutating}
            onUpdateTags={actions.updateTags}
            onRemoveFromPool={() => setRemovePoolConfirmOpen(true)}
            onAssign={() => setAssignJobOpen(true)}
          />

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-6">
              {c.inTalentPool && (
                <>
                  <div className="flex flex-col gap-3">
                    <SectionLabel>Talent Pool Notes</SectionLabel>
                    <TalentPoolNotesEditor
                      notes={c.talentPoolNotes ?? ''}
                      mutating={mutating}
                      onSave={actions.updateNotes}
                    />
                  </div>
                  <Separator />
                </>
              )}
              <CandidateProfileSections candidate={c} />
              <TalentPoolAdditionalInfo candidate={c} />
              <ResumeAndPortfolioSection candidate={c} divided />
              <CrmProfileSection candidate={c} />
            </div>

            <Separator className="my-8" />

            <div className="flex flex-col gap-3">
              <SectionLabel>Activity Log</SectionLabel>
              <ActivityTimeline
                resourceType="candidate"
                resourceId={c._id}
                extraLogs={emailActivity}
                compact
              />
            </div>
          </div>

          <div className="shrink-0 border-t px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Created{' '}
                {new Date(c.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <Button
                variant="outline"
                className="ml-auto"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AssignJobDialog
        open={assignJobOpen}
        onClose={() => setAssignJobOpen(false)}
        onConfirm={actions.assignToJob}
        jobs={actions.openJobs}
      />

      <RemoveTalentPoolConfirmDialog
        candidate={c}
        open={removePoolConfirmOpen}
        onClose={() => setRemovePoolConfirmOpen(false)}
        onConfirm={actions.removeFromPool}
      />
    </>
  );
}
