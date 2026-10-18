import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const OPTIONS = [
  ['basic', 'Basic'],
  ['conversational', 'Conversational'],
  ['professional', 'Professional Working'],
  ['fluent', 'Fluent'],
  ['native', 'Native / Bilingual'],
] as const;

interface EnglishProficiencySelectProps {
  value: string | undefined;
  onChange: (value: string | null) => void;
}

export function EnglishProficiencySelect({
  value,
  onChange,
}: EnglishProficiencySelectProps) {
  return (
    <Select value={value ?? ''} onValueChange={v => onChange(v || null)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select level..." />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map(([val, label]) => (
          <SelectItem key={val} value={val}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
