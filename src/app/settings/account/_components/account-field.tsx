import { Label } from '@/components/ui/label';

interface AccountFieldProps {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function AccountField({ id, label, hint, children }: AccountFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </Label>
        {hint && (
          <span className="text-[11px] text-muted-foreground/70">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}
