import { Switch } from '@/components/ui/switch';
import { AlertCircleIcon } from 'lucide-react';

interface StatusSwitchesProps {
  isDefault: boolean;
  isActive: boolean;
  wasDefault: boolean;
  existingDefaultName?: string | null;
  onDefaultChange: (v: boolean) => void;
  onActiveChange: (v: boolean) => void;
}

function SwitchRow({
  title,
  description,
  ...switchProps
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch {...switchProps} />
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1 -mt-2 px-4">
      <AlertCircleIcon className="size-3.5 mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function StatusSwitches({
  isDefault,
  isActive,
  wasDefault,
  existingDefaultName,
  onDefaultChange,
  onActiveChange,
}: StatusSwitchesProps) {
  const becomingDefault = isDefault && !wasDefault;
  return (
    <>
      <SwitchRow
        title="Default template"
        description="Auto-applied to new jobs"
        checked={isDefault}
        onCheckedChange={onDefaultChange}
      />
      {becomingDefault && existingDefaultName && (
        <Warning>
          Saving will replace <b>{existingDefaultName}</b> as the default. New
          jobs will use this template instead.
        </Warning>
      )}
      {becomingDefault && !existingDefaultName && (
        <p className="text-xs text-muted-foreground -mt-2 px-4">
          This will be set as the only default template.
        </p>
      )}

      <SwitchRow
        title="Active"
        description="Available for selection when creating jobs"
        checked={isActive}
        onCheckedChange={onActiveChange}
        disabled={isDefault}
      />
      {isDefault && !isActive && (
        <Warning>
          A default template must remain active. Disable this by first removing
          it as default.
        </Warning>
      )}
    </>
  );
}
