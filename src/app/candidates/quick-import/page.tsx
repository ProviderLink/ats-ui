import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingScreen } from './_components/loading-screen';
import { QuickImportInputStep } from './_components/quick-import-input-step';
import { QuickImportReviewStep } from './_components/quick-import-review-step';
import { useOpenJobs } from './_utils/use-open-jobs';
import {
  useQuickImportFlow,
  type QuickImportStep,
} from './_utils/use-quick-import-flow';

const STEP_META: Record<QuickImportStep, { title: string; desc: string }> = {
  input: {
    title: 'Quick Import Candidate',
    desc: 'Upload a candidate internally — source will be marked as Internal Upload.',
  },
  parsing: {
    title: 'Parsing Resume',
    desc: 'AI is extracting information from the uploaded resume.',
  },
  review: {
    title: 'Review Parsed Data',
    desc: 'Review and correct the extracted information before importing.',
  },
  importing: {
    title: 'Importing Candidate',
    desc: 'Assigning candidate to the selected job...',
  },
};

export default function CandidateQuickImportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetJobId = searchParams.get('jobId') ?? '';
  const { allJobs, openJobs } = useOpenJobs(presetJobId);
  const flow = useQuickImportFlow(presetJobId, allJobs);
  const { step, inputValues } = flow;

  const isLoading = step === 'parsing' || step === 'importing';

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isLoading}
          onClick={() =>
            step === 'review' ? flow.cancelReview() : navigate('/ats/candidates')
          }
          aria-label="Back to candidates"
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-base font-semibold">{STEP_META[step].title}</h1>
          <p className="text-sm text-muted-foreground">
            {STEP_META[step].desc}
          </p>
        </div>
      </div>

      {step === 'input' && (
        <QuickImportInputStep
          form={flow.form}
          resumeFile={flow.resumeFile}
          onResumeChange={flow.setResumeFile}
          resumeError={flow.resumeError}
          openJobs={openJobs}
          onSubmit={flow.parseResume}
        />
      )}

      {step === 'parsing' && (
        <LoadingScreen
          message="Parsing resume..."
          description="AI is extracting structured information from the uploaded PDF."
        />
      )}

      {step === 'review' && inputValues && (
        <QuickImportReviewStep
          values={inputValues}
          reviewData={flow.reviewData}
          onReviewChange={patch =>
            flow.setReviewData(prev => ({ ...prev, ...patch }))
          }
          openJobs={openJobs}
          onImport={flow.importCandidate}
          onCancel={flow.cancelReview}
        />
      )}

      {step === 'importing' && (
        <LoadingScreen
          message="Importing candidate..."
          description="Assigning candidate to the selected job. Please wait."
        />
      )}
    </div>
  );
}
