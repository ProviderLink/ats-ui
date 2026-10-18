import { EducationEditor } from '@/components/candidate-form/education-editor';
import { ExperienceEditor } from '@/components/candidate-form/experience-editor';
import { TagsInput } from '@/components/candidate-form/tags-input';
import type { ReviewData } from '@/components/candidate-form/review-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { JobOption, QuickImportValues } from '../_utils/quick-import-form';
import { ReviewCard } from './review-card';

interface QuickImportReviewStepProps {
  values: QuickImportValues;
  reviewData: ReviewData;
  onReviewChange: (patch: Partial<ReviewData>) => void;
  openJobs: JobOption[];
  onImport: () => void;
  onCancel: () => void;
}

export function QuickImportReviewStep({
  values,
  reviewData,
  onReviewChange,
  openJobs,
  onImport,
  onCancel,
}: QuickImportReviewStepProps) {
  const selectedJob = openJobs.find(j => j._id === values.jobId);

  const basicInfo = [
    ['First Name', values.firstName],
    ['Last Name', values.lastName],
    ['Email', values.email],
    ['Phone', values.phone],
    ['Years of Experience', String(values.yearsOfExperience)],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-accent/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          AI has extracted the following information from the resume. Please
          review and correct any errors before importing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <ReviewCard title="Basic Info">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              {basicInfo.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </div>
          </ReviewCard>

          <ReviewCard title="Resume Summary">
            <Textarea
              rows={5}
              value={reviewData.summary}
              onChange={e => onReviewChange({ summary: e.target.value })}
              className="resize-none"
              placeholder="No summary extracted — you can add one manually."
            />
          </ReviewCard>

          <ReviewCard title="Skills">
            <TagsInput
              value={reviewData.skills}
              onChange={skills => onReviewChange({ skills })}
              placeholder="Add skill..."
            />
          </ReviewCard>

          <ReviewCard title="Languages">
            <TagsInput
              value={reviewData.languages}
              onChange={languages => onReviewChange({ languages })}
              placeholder="Add language..."
            />
          </ReviewCard>

          <ReviewCard title="Certifications">
            <TagsInput
              value={reviewData.certifications}
              onChange={certifications => onReviewChange({ certifications })}
              placeholder="Add certification..."
            />
          </ReviewCard>

          <ReviewCard title="Work Experience">
            <ExperienceEditor
              entries={reviewData.experience}
              onChange={experience => onReviewChange({ experience })}
            />
          </ReviewCard>

          <ReviewCard title="Education">
            <EducationEditor
              entries={reviewData.education}
              onChange={education => onReviewChange({ education })}
            />
          </ReviewCard>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground">
                  Assigning to Job
                </p>
                <p className="text-sm font-medium">
                  {selectedJob?.title ?? values.jobId}
                </p>
                {selectedJob && (
                  <p className="text-xs text-muted-foreground">
                    {selectedJob.clientName}
                  </p>
                )}
              </div>

              {values.videoIntroUrl && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-muted-foreground">
                      Video Intro URL
                    </p>
                    <a
                      href={values.videoIntroUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-xs text-primary underline-offset-2 hover:underline"
                    >
                      {values.videoIntroUrl}
                    </a>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="font-medium">Internal Upload</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onImport}>
              Import Candidate
            </Button>
            <Button variant="outline" className="w-full" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
