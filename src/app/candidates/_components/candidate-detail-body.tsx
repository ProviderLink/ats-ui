import { Separator } from '@/components/ui/separator';
import type { useCandidateEmailActivity } from '@/hooks/use-candidate-email-activity';
import type { Application, Candidate, Job } from '@/store/types';
import type { useCandidateInterviews } from '../_hooks/use-candidate-interviews';
import type { useCandidateLookups } from '../_hooks/use-candidate-lookups';
import type { useInterviewActions } from '../_hooks/use-interview-actions';
import type { usePipelineNotes } from '../_hooks/use-pipeline-notes';
import { AdditionalInfoSection } from './additional-info-section';
import { AiEvaluationSection } from './ai-evaluation-section';
import { AiValidationSection } from './ai-validation-section';
import { ApplicationsSection } from './applications-section';
import { CandidateActivitySection } from './candidate-activity-section';
import { CandidateProfileSections } from './candidate-profile-sections';
import { CrmProfileSection } from './crm-profile-section';
import { HiredApplicationsSection } from './hired-applications-section';
import { InterviewScorecardsSection } from './interview-scorecards-section';
import { InterviewsSection } from './interviews-section';
import { PipelineNotesSection } from './pipeline-notes-section';
import { ResumeAndPortfolioSection } from './resume-and-portfolio-section';

type Lookups = ReturnType<typeof useCandidateLookups>;

interface CandidateDetailBodyProps {
  candidate: Candidate;
  applications: Application[];
  applicationsLoading: boolean;
  lookups: Pick<Lookups, 'jobs' | 'users' | 'getJobTitle' | 'getClientName'>;
  interviews: ReturnType<typeof useCandidateInterviews>['candidateInterviews'];
  interviewActions: Pick<
    ReturnType<typeof useInterviewActions>,
    'completeInterview' | 'startReschedule' | 'cancelScheduledInterview'
  >;
  activePipelineApp: Application | null;
  pipelineJob: Job | null;
  notes: ReturnType<typeof usePipelineNotes>;
  emailActivity: ReturnType<typeof useCandidateEmailActivity>;
  onScorecardCreated: () => void;
}

export function CandidateDetailBody({
  candidate: c,
  applications,
  applicationsLoading,
  lookups: { jobs, users, getJobTitle, getClientName },
  interviews,
  interviewActions,
  activePipelineApp,
  pipelineJob,
  notes,
  emailActivity,
  onScorecardCreated,
}: CandidateDetailBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="flex flex-col gap-6">
        <AiValidationSection candidate={c} />
        <AiEvaluationSection candidate={c} />
        <CandidateProfileSections candidate={c} />
        <AdditionalInfoSection candidate={c} />

        <ApplicationsSection
          applications={applications}
          loading={applicationsLoading}
          jobs={jobs}
          users={users}
          getJobTitle={getJobTitle}
          getClientName={getClientName}
        />

        {c.status === 'approved' && (
          <>
            <Separator />
            <InterviewsSection
              interviews={interviews}
              users={users}
              onComplete={interviewActions.completeInterview}
              onReschedule={interviewActions.startReschedule}
              onCancel={interviewActions.cancelScheduledInterview}
            />
            <Separator />
            <InterviewScorecardsSection
              candidateId={c._id}
              jobOptions={jobs.map(j => ({ _id: j._id, title: j.title }))}
              users={users}
              defaultJobId={pipelineJob?._id ?? null}
              onCreated={onScorecardCreated}
            />
            <PipelineNotesSection
              activeApp={activePipelineApp}
              notesText={notes.notesText}
              onNotesTextChange={notes.setNotesText}
              onFocus={notes.seedFromSaved}
              saving={notes.savingNotes}
              onSave={notes.saveNotes}
            />
          </>
        )}

        {c.status === 'hired' && (
          <>
            <Separator />
            <HiredApplicationsSection
              applications={applications}
              jobs={jobs}
              users={users}
              getClientName={getClientName}
            />
          </>
        )}

        <Separator />
        <ResumeAndPortfolioSection candidate={c} />
        <CrmProfileSection candidate={c} />

        <Separator />
        <CandidateActivitySection candidate={c} emailActivity={emailActivity} />
      </div>
    </div>
  );
}
