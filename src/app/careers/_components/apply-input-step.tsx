import { Button } from '@/components/ui/button';
import type { Job } from '@/store';
import { UploadIcon } from 'lucide-react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';
import type { ApplyFormValues } from '../_utils/apply-form';
import { ApplyDetailsCard } from './apply-details-card';
import { ApplyResumeCard } from './apply-resume-card';
import { JobSummaryCard } from './job-summary-card';

interface ApplyInputStepProps {
  job: Job;
  form: UseFormReturn<ApplyFormValues>;
  resumeFile: File | null;
  onResumeChange: (file: File | null) => void;
  resumeError: string | null;
  portfolioFile: File | null;
  onPortfolioChange: (file: File | null) => void;
  onSubmit: (values: ApplyFormValues) => void;
}

export function ApplyInputStep({
  job,
  form,
  resumeFile,
  onResumeChange,
  resumeError,
  portfolioFile,
  onPortfolioChange,
  onSubmit,
}: ApplyInputStepProps) {
  const canSubmit = form.formState.isValid && !!resumeFile;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <ApplyDetailsCard />
          <ApplyResumeCard
            form={form}
            resumeFile={resumeFile}
            onResumeChange={onResumeChange}
            resumeError={resumeError}
            portfolioFile={portfolioFile}
            onPortfolioChange={onPortfolioChange}
          />
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8 flex flex-col gap-5">
            <JobSummaryCard job={job} />
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                size="lg"
                className="w-full bg-careers-accent text-careers hover:bg-careers-accent/90"
                disabled={!canSubmit}
              >
                <UploadIcon />
                Upload & Parse Resume
              </Button>
              <Link to={`/careers/${job._id}`}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      </form>
    </FormProvider>
  );
}
