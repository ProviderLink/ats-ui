import { Checkbox } from '@/components/ui/checkbox';
import { Controller, useFormContext } from 'react-hook-form';
import type { ScorecardFormValues } from '../../_utils/scorecard-form';

type BooleanName =
  | 'profPreparedOnTime'
  | 'profAppearanceDemeanor'
  | 'profAttitudeReliability'
  | 'profInterestInPosition'
  | 'techInternetSpeed'
  | 'techHeadsetNoiseCancelling'
  | 'techTwoScreens'
  | 'techBackupInternet'
  | 'techBackupGenerator'
  | 'availUsHours'
  | 'availCompensationAcceptable'
  | 'availStartAvailability'
  | 'availOverallFit';

interface BooleanRowProps {
  label: string;
  name: BooleanName;
}

export function BooleanRow({ label, name }: BooleanRowProps) {
  const { control } = useFormContext<ScorecardFormValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={!!field.value}
            onCheckedChange={c => field.onChange(!!c)}
          />
          {label}
        </label>
      )}
    />
  );
}
