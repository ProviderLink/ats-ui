import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';
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

interface ChipToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Pill-style on/off toggle — one tap, no tiny checkbox to hit. */
export function ChipToggle({ label, checked, onChange }: ChipToggleProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
        checked
          ? 'border-primary/40 bg-primary/10 font-medium text-foreground'
          : 'bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      )}
    >
      <span
        className={cn(
          'grid size-4 shrink-0 place-items-center rounded-full border transition-colors',
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/40'
        )}
      >
        {checked && <CheckIcon className="size-3" />}
      </span>
      {label}
    </button>
  );
}

/** Two-up grid for chip toggles; collapses to one column when the panel is narrow. */
export function ChipGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-2 @md:grid-cols-2">{children}</div>;
}

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
        <ChipToggle
          label={label}
          checked={!!field.value}
          onChange={field.onChange}
        />
      )}
    />
  );
}
