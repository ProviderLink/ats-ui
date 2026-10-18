import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LabelSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
}

/** A select over a `{ value: label }` record, in the record's key order. */
export function LabelSelect({ value, onChange, options }: LabelSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(options).map(([val, label]) => (
          <SelectItem key={val} value={val}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
