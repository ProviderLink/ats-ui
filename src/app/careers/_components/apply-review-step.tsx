import { EducationEditor } from '@/components/candidate-form/education-editor';
import { ExperienceEditor } from '@/components/candidate-form/experience-editor';
import { TagsInput } from '@/components/candidate-form/tags-input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Job } from '@/store';
import { Loader2Icon, PencilIcon } from 'lucide-react';
import type { ApplyFormValues, ReviewData } from '../_utils/apply-form';
import { JobSummaryCard } from './job-summary-card';
import { ReviewSection } from './review-section';

interface ApplyReviewStepProps {
  job: Job;
  values: ApplyFormValues;
  reviewData: ReviewData;
  onReviewChange: (patch: Partial<ReviewData>) => void;
  portfolioFileName: string | null;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}

const EXTERNAL_LINK_CLASS =
  'break-all text-xs text-primary underline-offset-2 hover:underline';

export function ApplyReviewStep({
  job,
  values,
  reviewData,
  onReviewChange,
  portfolioFileName,
  onSubmit,
  onBack,
  submitting,
}: ApplyReviewStepProps) {
  const basicInfo = [
    ['First Name', values.firstName],
    ['Last Name', values.lastName],
    ['Email', values.email],
    ['Phone', values.phone],
    ['Years of Experience', String(values.yearsOfExperience)],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
        <p className="text-sm text-white/70">
          AI has extracted the following information from your resume. Please
          review and correct any errors before submitting.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <ReviewSection title="Basic Info">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              {basicInfo.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </div>
          </ReviewSection>

          <ReviewSection title="Resume Summary">
            <Textarea
              rows={5}
              value={reviewData.summary}
              onChange={e => onReviewChange({ summary: e.target.value })}
              className="resize-none"
              placeholder="No summary extracted — you can add one manually."
            />
          </ReviewSection>

          <ReviewSection title="Skills">
            <TagsInput
              value={reviewData.skills}
              onChange={skills => onReviewChange({ skills })}
              placeholder="Add skill..."
            />
          </ReviewSection>

          <ReviewSection title="Languages">
            <TagsInput
              value={reviewData.languages}
              onChange={languages => onReviewChange({ languages })}
              placeholder="Add language..."
            />
          </ReviewSection>

          <ReviewSection title="Certifications">
            <TagsInput
              value={reviewData.certifications}
              onChange={certifications => onReviewChange({ certifications })}
              placeholder="Add certification..."
            />
          </ReviewSection>

          <ReviewSection title="Work Experience">
            <ExperienceEditor
              entries={reviewData.experience}
              onChange={experience => onReviewChange({ experience })}
            />
          </ReviewSection>

          <ReviewSection title="Education">
            <EducationEditor
              entries={reviewData.education}
              onChange={education => onReviewChange({ education })}
            />
          </ReviewSection>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8 flex flex-col gap-5">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white/80">
              <PencilIcon className="size-4 text-careers-accent" />
              Edit anything that looks wrong, then submit.
            </div>
            <JobSummaryCard job={job} />
            {values.videoIntroUrl && (
              <ReviewSection title="Video Intro" titleClassName="text-sm">
                <a
                  href={values.videoIntroUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EXTERNAL_LINK_CLASS}
                >
                  {values.videoIntroUrl}
                </a>
              </ReviewSection>
            )}
            {(values.portfolioUrl || portfolioFileName) && (
              <ReviewSection
                title="Portfolio"
                titleClassName="text-sm"
                contentClassName="flex flex-col gap-2"
              >
                {values.portfolioUrl && (
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-muted-foreground">Link</p>
                    <a
                      href={values.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={EXTERNAL_LINK_CLASS}
                    >
                      {values.portfolioUrl}
                    </a>
                  </div>
                )}
                {portfolioFileName && (
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-muted-foreground">File</p>
                    <p className="break-all text-xs font-medium">
                      {portfolioFileName}
                    </p>
                  </div>
                )}
              </ReviewSection>
            )}
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                size="lg"
                className="w-full bg-careers-accent text-careers hover:bg-careers-accent/90"
                onClick={onSubmit}
                disabled={submitting}
              >
                {submitting && <Loader2Icon className="size-4 animate-spin" />}
                {submitting ? 'Submitting…' : 'Submit application'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={onBack}
                disabled={submitting}
              >
                Back to upload
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
