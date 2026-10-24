import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { PANEL_CLS, SectionHeading } from '../template-ui';
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
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        {...switchProps}
        className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-primary dark:data-[state=unchecked]:bg-input"
      />
    </div>
  );
}

function Note({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warning';
  children: React.ReactNode;
}) {
  return (
    <p
      className={
        tone === 'warning'
          ? 'flex items-start gap-2 border-t border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
          : 'flex items-start gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground'
      }
    >
      <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
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
    <section className="flex flex-col gap-3">
      <SectionHeading>Settings</SectionHeading>
      <div className={cn(PANEL_CLS, 'divide-y overflow-hidden')}>
        <div>
          <SwitchRow
            title="Default template"
            description="Auto-applied to new jobs"
            checked={isDefault}
            onCheckedChange={onDefaultChange}
          />
          {becomingDefault && existingDefaultName && (
            <Note tone="warning">
              Saving will replace <b>{existingDefaultName}</b> as the default.
              New jobs will use this template instead.
            </Note>
          )}
          {becomingDefault && !existingDefaultName && (
            <Note>This will be set as the only default template.</Note>
          )}
        </div>
        <div>
          <SwitchRow
            title="Active"
            description="Available for selection when creating jobs"
            checked={isActive}
            onCheckedChange={onActiveChange}
            disabled={isDefault}
          />
          {isDefault && !isActive && (
            <Note tone="warning">
              A default template must remain active. Disable this by first
              removing it as default.
            </Note>
          )}
        </div>
      </div>
    </section>
  );
}
