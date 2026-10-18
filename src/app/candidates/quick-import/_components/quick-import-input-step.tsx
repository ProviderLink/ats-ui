import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UploadIcon } from 'lucide-react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import type { JobOption, QuickImportValues } from '../_utils/quick-import-form';
import { ImportDetailsCard } from './import-details-card';
import { ImportResumeCard } from './import-resume-card';
import { JobSearchSelect } from './job-search-select';

interface QuickImportInputStepProps {
  form: UseFormReturn<QuickImportValues>;
  resumeFile: File | null;
  onResumeChange: (file: File | null) => void;
  resumeError: string | null;
  openJobs: JobOption[];
  onSubmit: (values: QuickImportValues) => void;
}

export function QuickImportInputStep({
  form,
  resumeFile,
  onResumeChange,
  resumeError,
  openJobs,
  onSubmit,
}: QuickImportInputStepProps) {
  const navigate = useNavigate();
  const canSubmit = form.formState.isValid && !!resumeFile;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <ImportDetailsCard />
            <ImportResumeCard
              resumeFile={resumeFile}
              onResumeChange={onResumeChange}
              resumeError={resumeError}
            />
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Assignment</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <JobSearchSelect
                  jobs={openJobs}
                  control={form.control}
                  name="jobId"
                  error={form.formState.errors.jobId?.message}
                />

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="font-medium">Internal Upload</p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={!canSubmit}>
                <UploadIcon />
                Upload & Parse Resume
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/ats/candidates')}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
