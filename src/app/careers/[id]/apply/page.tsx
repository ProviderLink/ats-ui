import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ApplyInputStep } from '../../_components/apply-input-step';
import { ApplyPageSkeleton } from '../../_components/apply-page-skeleton';
import { ApplyReviewStep } from '../../_components/apply-review-step';
import { ApplyStepper } from '../../_components/apply-stepper';
import { ApplySuccess } from '../../_components/apply-success';
import { CareersDoodles } from '../../_components/careers-doodles';
import { JobClosedNotice } from '../../_components/job-closed-notice';
import { ParsingScreen } from '../../_components/parsing-screen';
import { useApplyFlow, type ApplyStep } from '../../_utils/use-apply-flow';
import { usePublicJob } from '../../_utils/use-public-job';

export default function CareerApplyPage() {
  const { id } = useParams<{ id: string }>();
  const { job, loading, error } = usePublicJob(id);
  const flow = useApplyFlow(id);
  const { step, inputValues } = flow;

  if (loading) return <ApplyPageSkeleton />;

  if (error || !job) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center sm:px-6">
        <p className="text-base text-muted-foreground">
          {error
            ? 'We couldn’t load this job right now.'
            : 'This job is no longer available.'}
        </p>
        <Link to="/careers">
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            Back to jobs
          </Button>
        </Link>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <ApplySuccess
        firstName={flow.form.getValues('firstName')}
        jobTitle={job.title}
      />
    );
  }

  if (job.status !== 'open') return <JobClosedNotice title={job.title} />;

  const inReview = step === 'review' || step === 'submitting';
  const { title, desc } = stepMeta(step, job.title);

  return (
    <div className="relative flex-1 overflow-x-clip">
      <CareersDoodles variant="detail" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
        <div className="flex flex-col gap-6">
          <Link
            to={`/careers/${job._id}`}
            className="flex w-fit items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="size-4" />
            Back to job
          </Link>
          <ApplyStepper current={inReview ? 1 : 0} />
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            <p className="text-base text-white/70">{desc}</p>
          </div>
        </div>

        {step === 'input' && (
          <ApplyInputStep
            job={job}
            form={flow.form}
            resumeFile={flow.resumeFile}
            onResumeChange={flow.setResumeFile}
            resumeError={flow.resumeError}
            portfolioFile={flow.portfolioFile}
            onPortfolioChange={flow.setPortfolioFile}
            onSubmit={flow.parseResume}
          />
        )}

        {step === 'parsing' && (
          <ParsingScreen
            message="Parsing resume..."
            description="AI is extracting structured information from your uploaded PDF."
          />
        )}

        {inReview && inputValues && (
          <ApplyReviewStep
            job={job}
            values={inputValues}
            reviewData={flow.reviewData}
            onReviewChange={patch =>
              flow.setReviewData(prev => ({ ...prev, ...patch }))
            }
            portfolioFileName={flow.portfolioFile?.name ?? null}
            onSubmit={flow.submitApplication}
            onBack={flow.backToUpload}
            submitting={step === 'submitting'}
          />
        )}
      </div>
    </div>
  );
}

function stepMeta(step: ApplyStep, jobTitle: string) {
  switch (step) {
    case 'input':
      return {
        title: `Apply for ${jobTitle}`,
        desc: 'Fill in your details and upload your resume to begin.',
      };
    case 'parsing':
      return {
        title: 'Parsing Resume',
        desc: 'AI is extracting information from your uploaded resume.',
      };
    case 'review':
      return {
        title: 'Review Parsed Data',
        desc: 'Review and correct the extracted information before submitting.',
      };
    default:
      return {
        title: 'Submitting Application',
        desc: 'Sending your application...',
      };
  }
}
