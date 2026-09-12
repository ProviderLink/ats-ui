import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TIMEZONE_GROUPS,
  getTimezoneOffsetLabel,
  timezoneOptionLabel,
} from '@/lib/timezones';
import { cn } from '@/lib/utils';

interface TimezoneSelectProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  /** Placeholder shown when the value is empty. */
  placeholder?: string;
  className?: string;
}

/**
 * Grouped IANA timezone picker.
 *
 * Values that are not part of the curated list are still rendered (as an extra
 * option) so an existing saved value can never appear blank or silently reset.
 */
export function TimezoneSelect({
  id,
  value,
  onValueChange,
  disabled,
  placeholder = 'Select a timezone',
  className,
}: TimezoneSelectProps) {
  const isKnown = TIMEZONE_GROUPS.some(g =>
    g.options.some(o => o.value === value)
  );
  const offset = value ? getTimezoneOffsetLabel(value) : null;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {!isKnown && value ? (
          <SelectGroup>
            <SelectLabel>Current value</SelectLabel>
            <SelectItem value={value}>
              {value}
              {offset ? ` · ${offset}` : ' · unknown offset'}
            </SelectItem>
          </SelectGroup>
        ) : null}

        {TIMEZONE_GROUPS.map(({ group, options }) => (
          <SelectGroup key={group}>
            <SelectLabel>{group}</SelectLabel>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {timezoneOptionLabel(option)}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
