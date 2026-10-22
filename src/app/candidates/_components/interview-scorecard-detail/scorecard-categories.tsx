import type {
  ExperienceSelection,
  InterviewScorecard,
} from '@/store/types/interview-scorecard.types';
import { EXPERIENCE_SELECTION_LABELS } from '@/store/types/interview-scorecard.types';
import { Badge } from '@/components/ui/badge';
import { CategoryDetail } from './category-detail';

function TagList({ label, tags }: { label: string; tags?: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <Badge key={t} variant="secondary" className="font-normal">
            {t}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function ScorecardCategories({ sc }: { sc: InterviewScorecard }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Category details
      </h3>
      <div className="flex flex-col gap-3">
        <CategoryDetail
          title="Communication"
          rating={sc.communicationRating}
          facts={[
            { label: 'English diction', value: `${sc.commEnglishDiction}/5` },
            {
              label: 'English comprehension',
              value: `${sc.commEnglishComprehension}/5`,
            },
          ]}
          notes={sc.commNotes}
        />

        <CategoryDetail
          title="Relevant experience"
          rating={sc.experienceRating}
          notes={sc.experienceNotes}
          extra={
            <>
              {sc.experienceSelections.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    Experience areas
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sc.experienceSelections.map(s => (
                      <Badge key={s} variant="outline" className="font-normal">
                        {EXPERIENCE_SELECTION_LABELS[
                          s as ExperienceSelection
                        ] ?? s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <TagList label="EMR systems" tags={sc.emrTags} />
              <TagList label="Specialities" tags={sc.specialtyTags} />
            </>
          }
        />

        <CategoryDetail
          title="Professionalism"
          rating={sc.professionalismRating}
          notes={sc.professionalismNotes}
          checks={[
            { label: 'Prepared on time', value: sc.profPreparedOnTime },
            {
              label: 'Appearance & demeanor',
              value: sc.profAppearanceDemeanor,
            },
            {
              label: 'Attitude & reliability',
              value: sc.profAttitudeReliability,
            },
            { label: 'Interest in position', value: sc.profInterestInPosition },
          ]}
        />

        <CategoryDetail
          title="Office & technology setup"
          rating={sc.technologyRating}
          notes={sc.technologyNotes}
          facts={
            sc.techInternetSpeedValue
              ? [{ label: 'Internet speed', value: sc.techInternetSpeedValue }]
              : []
          }
          checks={[
            { label: 'Internet speed adequate', value: sc.techInternetSpeed },
            {
              label: 'Noise-cancelling headset',
              value: sc.techHeadsetNoiseCancelling,
            },
            { label: 'Two screens', value: sc.techTwoScreens },
            { label: 'Backup internet', value: sc.techBackupInternet },
            { label: 'Backup generator', value: sc.techBackupGenerator },
          ]}
        />

        <CategoryDetail
          title="Availability & overall fit"
          rating={sc.availabilityRating}
          notes={sc.availabilityNotes}
          checks={[
            { label: 'Can work US hours', value: sc.availUsHours },
            {
              label: 'Compensation acceptable',
              value: sc.availCompensationAcceptable,
            },
            {
              label: 'Start availability acceptable',
              value: sc.availStartAvailability,
            },
            { label: 'Overall fit', value: sc.availOverallFit },
          ]}
        />
      </div>
    </section>
  );
}
