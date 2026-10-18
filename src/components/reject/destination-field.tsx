import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type RejectDestination = 'candidate_pool' | 'permanently_ineligible';

interface DestinationFieldProps {
  value: RejectDestination;
  locked: boolean;
  onChange: (value: RejectDestination) => void;
}

export function DestinationField({
  value,
  locked,
  onChange,
}: DestinationFieldProps) {
  return (
    <div className="space-y-2">
      <Label>Final Destination</Label>
      <Select
        value={value}
        onValueChange={v => onChange(v as RejectDestination)}
        disabled={locked}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="candidate_pool">
            Talent Pool — keep for future roles
          </SelectItem>
          <SelectItem value="permanently_ineligible">
            Permanently Ineligible — never hire again
          </SelectItem>
        </SelectContent>
      </Select>
      {locked && (
        <p className="text-xs text-muted-foreground">
          Destination locked to Permanently Ineligible due to the selected
          reason.
        </p>
      )}
    </div>
  );
}
