import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AuthEmailFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function AuthEmailField({ value, onChange }: AuthEmailFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={value}
        onChange={e => onChange(e.target.value)}
        required
      />
    </div>
  );
}
