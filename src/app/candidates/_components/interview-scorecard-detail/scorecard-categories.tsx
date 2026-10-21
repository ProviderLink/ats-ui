import type {
  ExperienceSelection,
  InterviewScorecard,
} from '@/store/types/interview-scorecard.types';
import { EXPERIENCE_SELECTION_LABELS } from '@/store/types/interview-scorecard.types';
import { Badge } from '@/components/ui/badge';
import { CategoryDetail } from './category-detail';

const yesNo = (v: boolean) => (v ? 'Yes' : 'No');

function TagList({ label, tags }: { label: string; tags?: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <Badge key={t} variant="secondary">
            {t}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function ScorecardCategories({ sc }: { sc: InterviewScorecard }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <CategoryDetail
        title="Communication"
        rating={sc.communicationRating}
        weighted={sc.communicationWeighted}
        weight={30}
        subRows={[
          { label: 'English Diction', value: `${sc.commEnglishDiction}/5` },
          {
            label: 'English Comprehension',
            value: `${sc.commEnglishComprehension}/5`,
          },
        ]}
        note="Communication rating is auto-computed from the two sub-ratings."
        notes={sc.commNotes}
      />

      <CategoryDetail
        title="Relevant Experience"
        rating={sc.experienceRating}
        weighted={sc.experienceWeighted}
        weight={25}
        notes={sc.experienceNotes}
        extra={
          <>
            {sc.experienceSelections.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Experience areas:
                </span>
                <ul className="text-xs list-disc list-inside text-muted-foreground">
                  {sc.experienceSelections.map(s => (
                    <li key={s}>
                      {EXPERIENCE_SELECTION_LABELS[s as ExperienceSelection] ??
                        s}
                    </li>
                  ))}
                </ul>
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
        weighted={sc.professionalismWeighted}
        weight={15}
        notes={sc.professionalismNotes}
        subRows={[
          { label: 'Prepared on time', value: yesNo(sc.profPreparedOnTime) },
          {
            label: 'Appearance & demeanor',
            value: yesNo(sc.profAppearanceDemeanor),
          },
          {
            label: 'Attitude & reliability',
            value: yesNo(sc.profAttitudeReliability),
          },
          {
            label: 'Interest in position',
            value: yesNo(sc.profInterestInPosition),
          },
        ]}
      />

      <CategoryDetail
        title="Office & Technology Setup"
        rating={sc.technologyRating}
        weighted={sc.technologyWeighted}
        weight={20}
        notes={sc.technologyNotes}
        subRows={[
          {
            label: 'Internet speed adequate',
            value: yesNo(sc.techInternetSpeed),
          },
          ...(sc.techInternetSpeedValue
            ? [{ label: 'Internet speed', value: sc.techInternetSpeedValue }]
            : []),
          {
            label: 'Noise-cancelling headset',
            value: yesNo(sc.techHeadsetNoiseCancelling),
          },
          { label: 'Two screens', value: yesNo(sc.techTwoScreens) },
          { label: 'Backup internet', value: yesNo(sc.techBackupInternet) },
          { label: 'Backup generator', value: yesNo(sc.techBackupGenerator) },
        ]}
      />

      <CategoryDetail
        title="Availability & Overall Fit"
        rating={sc.availabilityRating}
        weighted={sc.availabilityWeighted}
        weight={10}
        notes={sc.availabilityNotes}
        subRows={[
          { label: 'Can work US hours', value: yesNo(sc.availUsHours) },
          {
            label: 'Compensation acceptable',
            value: yesNo(sc.availCompensationAcceptable),
          },
          {
            label: 'Start availability acceptable',
            value: yesNo(sc.availStartAvailability),
          },
          { label: 'Overall fit', value: yesNo(sc.availOverallFit) },
        ]}
      />
    </div>
  );
}
