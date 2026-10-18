import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettingsStore } from '@/store';
import { CheckIcon, MailIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { workspaceSettings as initialWorkspace } from '../_data/settings';

export function EmailSettingsCard() {
  const settings = useSettingsStore(s => s.settings);
  const loading = useSettingsStore(s => s.loading);
  const mutating = useSettingsStore(s => s.mutating);
  const update = useSettingsStore(s => s.update);
  const [fromName, setFromName] = useState(
    settings?.email.fromName ?? initialWorkspace.emailSettings.fromName
  );
  const [saved, setSaved] = useState(false);

  // The sender address is fixed by the backend: Resend only sends from a
  // verified domain, and every outbound email sets Reply-To to this same
  // mailbox so candidate replies land in the inbound webhook. It is shown for
  // transparency but is not editable.
  const fromEmail =
    settings?.email.fromEmail ?? initialWorkspace.emailSettings.fromEmail;

  useEffect(() => {
    if (settings?.email) {
      setFromName(settings.email.fromName);
    }
  }, [settings?.email]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update({ email: { fromName } });
      toast.success('Email sender settings saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save email settings');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailIcon className="size-4 text-muted-foreground" />
          Email Sender Settings
        </CardTitle>
        <CardDescription>
          The sender identity used for all outbound emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="es-from-name">From name</Label>
              <Input
                id="es-from-name"
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                placeholder="e.g. Acme Staffing"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                The display name recipients see next to the address.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="es-from-email">From email</Label>
              <Input
                id="es-from-email"
                type="email"
                value={fromEmail}
                readOnly
                disabled
                placeholder="hello@company.com"
              />
              <p className="text-xs text-muted-foreground">
                Fixed by the server: the domain must be verified with the email
                provider, and replies are delivered here. Contact your
                administrator to change it.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={mutating || loading}
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
