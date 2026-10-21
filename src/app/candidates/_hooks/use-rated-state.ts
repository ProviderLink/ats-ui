import { useFormContext, useWatch } from 'react-hook-form';
import type { ScorecardFormValues } from '../_utils/scorecard-form';

export type RatedState = Record<
  'communication' | 'experience' | 'professionalism' | 'technology' | 'availability',
  boolean
>;

/** Which scorecard categories already have every required rating (>= 1). */
export function useRatedState(): RatedState {
  const { control } = useFormContext<ScorecardFormValues>();
  const [
    diction,
    comprehension,
    experience,
    professionalism,
    technology,
    availability,
  ] = useWatch({
    control,
    name: [
      'commEnglishDiction',
      'commEnglishComprehension',
      'experienceRating',
      'professionalismRating',
      'technologyRating',
      'availabilityRating',
    ],
  });
  return {
    communication: Number(diction) > 0 && Number(comprehension) > 0,
    experience: Number(experience) > 0,
    professionalism: Number(professionalism) > 0,
    technology: Number(technology) > 0,
    availability: Number(availability) > 0,
  };
}
