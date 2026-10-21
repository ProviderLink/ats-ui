import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ExperienceSelection } from '@/store/types/interview-scorecard.types';
import {
  CATEGORY_WEIGHTS,
  EXPERIENCE_SELECTION_LABELS,
  EXPERIENCE_SELECTIONS,
  type computeScorecardPreview,
} from '@/store/types/interview-scorecard.types';
import {
  BriefcaseBusinessIcon,
  CalendarCheck2Icon,
  HandshakeIcon,
  MessagesSquareIcon,
  MonitorSmartphoneIcon,
} from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import { useRatedState } from '../../_hooks/use-rated-state';
import type { ScorecardFormValues } from '../../_utils/scorecard-form';
import { BooleanRow, ChipGrid, ChipToggle } from './boolean-row';
import { CategoryNotes } from './category-notes';
import { CategorySection } from './category-section';
import { RatingRow } from './rating-row';
import { TagInput } from './tag-input';

interface RatingCategoriesProps {
  scores: ReturnType<typeof computeScorecardPreview>;
  tagSuggestions: { emr: string[]; specialty: string[] };
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </Label>
  );
}

export function RatingCategories({
  scores,
  tagSuggestions,
}: RatingCategoriesProps) {
  const { control, register } = useFormContext<ScorecardFormValues>();
  const rated = useRatedState();

  return (
    <>
      <CategorySection
        id="sc-communication"
        icon={MessagesSquareIcon}
        title="Communication"
        weight={CATEGORY_WEIGHTS.communication}
        weighted={scores.communicationWeighted}
        rated={rated.communication}
      >
        <div className="flex flex-col gap-3">
          <RatingRow label="English diction" name="commEnglishDiction" />
          <RatingRow
            label="English comprehension"
            name="commEnglishComprehension"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Section rating is the average of the two:{' '}
          <span className="font-medium text-foreground">
            {scores.communicationRating}/5
          </span>
        </p>
        <CategoryNotes name="commNotes" />
      </CategorySection>

      <CategorySection
        id="sc-experience"
        icon={BriefcaseBusinessIcon}
        title="Relevant experience"
        weight={CATEGORY_WEIGHTS.experience}
        weighted={scores.experienceWeighted}
        rated={rated.experience}
      >
        <RatingRow label="Experience rating" name="experienceRating" />
        <div className="flex flex-col gap-2">
          <SubLabel>Experience areas</SubLabel>
          <Controller
            control={control}
            name="experienceSelections"
            render={({ field }) => {
              const selected = (field.value ?? []) as ExperienceSelection[];
              return (
                <ChipGrid>
                  {EXPERIENCE_SELECTIONS.map(opt => (
                    <ChipToggle
                      key={opt}
                      label={EXPERIENCE_SELECTION_LABELS[opt]}
                      checked={selected.includes(opt)}
                      onChange={c => {
                        const next = new Set(selected);
                        if (c) next.add(opt);
                        else next.delete(opt);
                        field.onChange(Array.from(next));
                      }}
                    />
                  ))}
                </ChipGrid>
              );
            }}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 @md:grid-cols-2">
          <TagInput
            name="emrTags"
            label="EMR systems"
            placeholder="e.g. Epic — press Enter"
            suggestions={tagSuggestions.emr}
          />
          <TagInput
            name="specialtyTags"
            label="Specialities"
            placeholder="e.g. Cardiology — press Enter"
            suggestions={tagSuggestions.specialty}
          />
        </div>
        <CategoryNotes name="experienceNotes" />
      </CategorySection>

      <CategorySection
        id="sc-professionalism"
        icon={HandshakeIcon}
        title="Professionalism"
        weight={CATEGORY_WEIGHTS.professionalism}
        weighted={scores.professionalismWeighted}
        rated={rated.professionalism}
      >
        <RatingRow label="Professionalism rating" name="professionalismRating" />
        <ChipGrid>
          <BooleanRow name="profPreparedOnTime" label="Prepared & on time" />
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
            label="Interested in position"
          />
        </ChipGrid>
        <CategoryNotes name="professionalismNotes" />
      </CategorySection>

      <CategorySection
        id="sc-technology"
        icon={MonitorSmartphoneIcon}
        title="Office & technology setup"
        weight={CATEGORY_WEIGHTS.technology}
        weighted={scores.technologyWeighted}
        rated={rated.technology}
      >
        <RatingRow label="Technology rating" name="technologyRating" />
        <ChipGrid>
          <BooleanRow name="techInternetSpeed" label="Internet speed adequate" />
          <BooleanRow
            name="techHeadsetNoiseCancelling"
            label="Noise-cancelling headset"
          />
          <BooleanRow name="techTwoScreens" label="Two screens" />
          <BooleanRow name="techBackupInternet" label="Backup internet" />
          <BooleanRow name="techBackupGenerator" label="Backup generator" />
        </ChipGrid>
        <div className="flex flex-col gap-2">
          <SubLabel>Internet speed</SubLabel>
          <Input
            placeholder="e.g. 100 Mbps"
            maxLength={100}
            className="@md:max-w-xs"
            {...register('techInternetSpeedValue')}
          />
        </div>
        <CategoryNotes name="technologyNotes" />
      </CategorySection>

      <CategorySection
        id="sc-availability"
        icon={CalendarCheck2Icon}
        title="Availability & overall fit"
        weight={CATEGORY_WEIGHTS.availability}
        weighted={scores.availabilityWeighted}
        rated={rated.availability}
      >
        <RatingRow label="Availability rating" name="availabilityRating" />
        <ChipGrid>
          <BooleanRow name="availUsHours" label="Can work US hours" />
          <BooleanRow
            name="availCompensationAcceptable"
            label="Compensation acceptable"
          />
          <BooleanRow
            name="availStartAvailability"
            label="Start date works"
          />
          <BooleanRow name="availOverallFit" label="Good overall fit" />
        </ChipGrid>
        <CategoryNotes name="availabilityNotes" />
      </CategorySection>
    </>
  );
}
