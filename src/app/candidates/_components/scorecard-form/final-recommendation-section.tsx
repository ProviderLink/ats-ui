import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FINAL_RECOMMENDATION_LABELS } from '@/store/types/interview-scorecard.types';
import { Controller, useFormContext } from 'react-hook-form';
import {
  RECOMMENDATION_OPTIONS,
  type ScorecardFormValues,
} from '../../_utils/scorecard-form';

export function FinalRecommendationSection() {
  const {
    control,
    formState: { errors },
  } = useFormContext<ScorecardFormValues>();

  return (
    <section className="flex flex-col gap-3">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Final Recommendation
        <span className="text-destructive"> *</span>
      </Label>
      <Controller
        control={control}
        name="finalRecommendation"
        render={({ field }) => (
          <Select value={field.value ?? ''} onValueChange={field.onChange}>
            <SelectTrigger
              className="w-full"
              aria-invalid={!!errors.finalRecommendation}
            >
              <SelectValue placeholder="Select a recommendation" />
            </SelectTrigger>
            <SelectContent position="popper">
              {RECOMMENDATION_OPTIONS.map(r => (
                <SelectItem key={r} value={r}>
                  {FINAL_RECOMMENDATION_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors.finalRecommendation && (
        <p className="text-xs text-destructive">
          {errors.finalRecommendation.message}
        </p>
      )}
    </section>
  );
}
