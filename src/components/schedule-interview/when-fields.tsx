import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DurationSelect } from './duration-select';

interface WhenFieldsProps {
  date: string;
  time: string;
  duration: number;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onDurationChange: (v: number) => void;
}

export function WhenFields({
  date,
  time,
  duration,
  onDateChange,
  onTimeChange,
  onDurationChange,
}: WhenFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="si-when">Date</Label>
        <Input
          id="si-when"
          type="date"
          value={date}
          onChange={e => onDateChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="si-time">Start Time</Label>
        <Input
          id="si-time"
          type="time"
          value={time}
          onChange={e => onTimeChange(e.target.value)}
        />
      </div>
      <DurationSelect duration={duration} onChange={onDurationChange} />
    </div>
  );
}
