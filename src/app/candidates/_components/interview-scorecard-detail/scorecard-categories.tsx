import type {
  ExperienceSelection,
  InterviewScorecard,
} from '@/store/types/interview-scorecard.types';
import { EXPERIENCE_SELECTION_LABELS } from '@/store/types/interview-scorecard.types';
import { CategoryDetail } from './category-detail';

const yesNo = (v: boolean) => (v ? 'Yes' : 'No');

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
      />

      <CategoryDetail
        title="Relevant Experience"
        rating={sc.experienceRating}
        weighted={sc.experienceWeighted}
        weight={25}
        extra={
          sc.experienceSelections.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Experience areas:
              </span>
              <ul className="text-xs list-disc list-inside text-muted-foreground">
                {sc.experienceSelections.map(s => (
                  <li key={s}>
                    {EXPERIENCE_SELECTION_LABELS[s as ExperienceSelection] ?? s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        }
      />

      <CategoryDetail
        title="Professionalism"
        rating={sc.professionalismRating}
        weighted={sc.professionalismWeighted}
        weight={15}
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
        subRows={[
          {
            label: 'Internet speed adequate',
            value: yesNo(sc.techInternetSpeed),
          },
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
