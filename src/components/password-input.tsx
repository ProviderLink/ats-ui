import { Input } from '@/components/ui/input';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState } from 'react';

interface PasswordInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  toggleLabel: string;
}

export function PasswordInput({ toggleLabel, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOffIcon : EyeIcon;

  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-9" />
      <button
        type="button"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setVisible(v => !v)}
        aria-label={`${visible ? 'Hide' : 'Show'} ${toggleLabel}`}
      >
        <Icon className="size-4" />
      </button>
    </div>
  );
}
