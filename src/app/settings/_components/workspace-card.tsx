import { TimezoneSelect } from '@/components/timezone-select';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useSettingsStore } from '@/store';
import { CheckIcon } from 'lucide-react';
import { getTimezoneOffsetLabel } from '@/lib/timezones';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function WorkspaceCard() {
  const settings = useSettingsStore(s => s.settings);
  const loading = useSettingsStore(s => s.loading);
  const mutating = useSettingsStore(s => s.mutating);
  const fetch = useSettingsStore(s => s.fetch);
  const update = useSettingsStore(s => s.update);

  const [timezone, setTimezone] = useState(settings?.companyTimezone ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (settings?.companyTimezone) setTimezone(settings.companyTimezone);
  }, [settings?.companyTimezone]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!timezone) return;
    try {
      await update({ companyTimezone: timezone });
      toast.success('Workspace settings saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save workspace settings');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>
          Basic information about your organisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ws-tz">Company timezone</Label>
              <TimezoneSelect
                id="ws-tz"
                value={timezone}
                onValueChange={setTimezone}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Used for scheduled emails, reminders, background jobs and
                exports. This is a workspace-wide setting — it applies to
                everyone, not just you.
                {getTimezoneOffsetLabel(timezone)
                  ? ` Current offset: ${getTimezoneOffsetLabel(timezone)}.`
                  : ''}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={mutating || !timezone}
            >
              {saved ? <CheckIcon className="size-3.5" /> : null}
              {saved ? 'Saved' : mutating ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
