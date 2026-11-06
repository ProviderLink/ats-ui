import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/store';
import { CheckIcon, MailCheckIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export function ApplicationConfirmationCard() {
  const settings = useSettingsStore(s => s.settings);
  const loading = useSettingsStore(s => s.loading);
  const mutating = useSettingsStore(s => s.mutating);
  const update = useSettingsStore(s => s.update);

  const [enabled, setEnabled] = useState(
    settings?.applicationConfirmation?.enabled ?? false
  );
  const [saved, setSaved] = useState(false);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (settings?.applicationConfirmation !== undefined) {
      setEnabled(settings.applicationConfirmation.enabled);
      initialized.current = true;
    }
  }, [settings?.applicationConfirmation]);

  async function handleSave() {
    try {
      await update({
        // The email is fixed now, so no template is used.
        applicationConfirmation: { enabled, templateId: null },
      });
      toast.success('Application confirmation settings saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error(
        (e as Error).message || 'Failed to save confirmation settings'
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailCheckIcon className="size-4 text-pine-teal-700 dark:text-muted-foreground" />
          Application Confirmation
        </CardTitle>
        <CardDescription>
          Automatically send a confirmation email when a candidate submits an
          application
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 dark:border-border dark:bg-transparent">
          <div>
            <p className="text-sm font-medium">Enable confirmation email</p>
            <p className="text-xs text-muted-foreground">
              Automatically send confirmation email when application is received
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={loading}
            aria-label="Enable application confirmation email"
          />
        </div>
        {enabled && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-border px-4 py-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email the candidate receives
            </p>
            <p className="font-medium">Thank you for your application</p>
            <p className="text-muted-foreground">
              Hi [first name], thank you for applying for the [job title]
              position. We have received your application and will be in touch
              if your profile is a good match.
            </p>
            <p className="text-muted-foreground">
              {settings?.email?.fromName || 'Arista ATS'}
            </p>
            <p className="text-xs text-muted-foreground">
              The client is never named. It is signed with the sender name from Email settings.
            </p>
          </div>
        )}
        <div className="flex justify-end">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleSave}
            disabled={mutating}
          >
            {saved ? <CheckIcon className="size-3.5" /> : null}
            {saved ? 'Saved' : mutating ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
