import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DURATION_OPTIONS } from './schedule-interview-types';

interface DurationSelectProps {
  duration: number;
  onChange: (duration: number) => void;
}

export function DurationSelect({ duration, onChange }: DurationSelectProps) {
  // Legacy records may hold a length outside the current list.
  const options = DURATION_OPTIONS.some(d => d === duration)
    ? [...DURATION_OPTIONS]
    : [...DURATION_OPTIONS, duration].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="si-duration">Duration</Label>
      <Select value={String(duration)} onValueChange={v => onChange(Number(v))}>
        <SelectTrigger id="si-duration" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(d => (
            <SelectItem key={d} value={String(d)}>
              {d} min
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
