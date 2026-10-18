import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InterviewTypeSelectProps {
  value: string;
  onChange: (type: string) => void;
}

export function InterviewTypeSelect({
  value,
  onChange,
}: InterviewTypeSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>How</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="zoom">Zoom (link auto-created)</SelectItem>
          <SelectItem value="google_meet">Google Meet</SelectItem>
          <SelectItem value="phone_call">Phone Call</SelectItem>
          <SelectItem value="in_person">In Person</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
