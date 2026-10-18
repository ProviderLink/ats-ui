import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { ExperienceSelection } from '@/store/types/interview-scorecard.types';
import {
  CATEGORY_WEIGHTS,
  computeScorecardPreview,
  EXPERIENCE_SELECTIONS,
  EXPERIENCE_SELECTION_LABELS,
} from '@/store/types/interview-scorecard.types';
import { Controller, useFormContext } from 'react-hook-form';
import type { ScorecardFormValues } from '../../_utils/scorecard-form';
import { BooleanRow } from './boolean-row';
import { CategorySection } from './category-section';
import { RatingRow } from './rating-row';

interface RatingCategoriesProps {
  scores: ReturnType<typeof computeScorecardPreview>;
}

export function RatingCategories({ scores }: RatingCategoriesProps) {
  const { control } = useFormContext<ScorecardFormValues>();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <CategorySection
        title="Communication"
        weight={CATEGORY_WEIGHTS.communication}
        weighted={scores.communicationWeighted}
      >
        <RatingRow label="English Diction" name="commEnglishDiction" />
        <RatingRow
          label="English Comprehension"
          name="commEnglishComprehension"
        />
        <p className="text-xs text-muted-foreground">
          Communication rating:{' '}
          <span className="font-medium text-foreground">
            {scores.communicationRating}/5
          </span>{' '}
          (auto-computed from the two sub-ratings above)
        </p>
      </CategorySection>

      <CategorySection
        title="Relevant Experience"
        weight={CATEGORY_WEIGHTS.experience}
        weighted={scores.experienceWeighted}
      >
        <div className="flex flex-col gap-2">
          <Label>Relevant experience areas (informational)</Label>
          <Controller
            control={control}
            name="experienceSelections"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                {EXPERIENCE_SELECTIONS.map(opt => {
                  const selected = (field.value ??
                    []) as ExperienceSelection[];
                  return (
                    <label
                      key={opt}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={selected.includes(opt)}
                        onCheckedChange={c => {
                          const next = new Set(selected);
                          if (c) next.add(opt);
                          else next.delete(opt);
                          field.onChange(Array.from(next));
                        }}
                      />
                      {EXPERIENCE_SELECTION_LABELS[opt]}
                    </label>
                  );
                })}
              </div>
            )}
          />
        </div>
        <RatingRow label="Experience rating" name="experienceRating" />
      </CategorySection>

      <CategorySection
        title="Professionalism"
        weight={CATEGORY_WEIGHTS.professionalism}
        weighted={scores.professionalismWeighted}
      >
        <div className="flex flex-col gap-2">
          <BooleanRow name="profPreparedOnTime" label="Prepared on time" />
          <BooleanRow
            name="profAppearanceDemeanor"
            label="Appearance & demeanor"
          />
          <BooleanRow
            name="profAttitudeReliability"
            label="Attitude & reliability"
          />
          <BooleanRow
            name="profInterestInPosition"
            label="Interest in position"
          />
        </div>
        <RatingRow label="Professionalism rating" name="professionalismRating" />
      </CategorySection>

      <CategorySection
        title="Office & Technology Setup"
        weight={CATEGORY_WEIGHTS.technology}
        weighted={scores.technologyWeighted}
      >
        <div className="flex flex-col gap-2">
          <BooleanRow
            name="techInternetSpeed"
            label="Internet speed adequate"
          />
          <BooleanRow
            name="techHeadsetNoiseCancelling"
            label="Noise-cancelling headset"
          />
          <BooleanRow name="techTwoScreens" label="Two screens" />
          <BooleanRow name="techBackupInternet" label="Backup internet" />
          <BooleanRow name="techBackupGenerator" label="Backup generator" />
        </div>
        <RatingRow label="Technology rating" name="technologyRating" />
      </CategorySection>

      <CategorySection
        title="Availability & Overall Fit"
        weight={CATEGORY_WEIGHTS.availability}
        weighted={scores.availabilityWeighted}
      >
        <div className="flex flex-col gap-2">
          <BooleanRow name="availUsHours" label="Can work US hours" />
          <BooleanRow
            name="availCompensationAcceptable"
            label="Compensation acceptable"
          />
          <BooleanRow
            name="availStartAvailability"
            label="Start availability acceptable"
          />
          <BooleanRow name="availOverallFit" label="Overall fit" />
        </div>
        <RatingRow label="Availability rating" name="availabilityRating" />
      </CategorySection>
    </div>
  );
}
