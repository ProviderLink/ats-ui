import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getJson } from '@/lib/api-client';
import { useSettingsStore } from '@/store';
import type { EmailTemplate } from '@/store/types';
import { CheckIcon, MailCheckIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export function ApplicationConfirmationCard() {
  const settings = useSettingsStore(s => s.settings);
  const loading = useSettingsStore(s => s.loading);
  const mutating = useSettingsStore(s => s.mutating);
  const update = useSettingsStore(s => s.update);

  const [confirmationTemplates, setConfirmationTemplates] = useState<
    EmailTemplate[]
  >([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const [enabled, setEnabled] = useState(
    settings?.applicationConfirmation?.enabled ?? false
  );
  const [templateId, setTemplateId] = useState<string>(
    settings?.applicationConfirmation?.templateId ?? ''
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTemplatesLoading(true);
    getJson<EmailTemplate[]>(
      '/ats/email-templates?type=application_confirmation'
    )
      .then(data => setConfirmationTemplates(data.filter(t => t.isActive)))
      .catch(() => setConfirmationTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, []);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (settings?.applicationConfirmation !== undefined) {
      setEnabled(settings.applicationConfirmation.enabled);
      setTemplateId(settings.applicationConfirmation.templateId ?? '');
      initialized.current = true;
    }
  }, [settings?.applicationConfirmation]);

  async function handleSave() {
    try {
      await update({
        applicationConfirmation: {
          enabled,
          templateId: enabled && templateId ? templateId : null,
        },
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="app-confirm-template">Email template</Label>
            <Select
              value={templateId || undefined}
              onValueChange={setTemplateId}
              disabled={templatesLoading}
            >
              <SelectTrigger id="app-confirm-template" className="w-full">
                <SelectValue placeholder="Select a template…" />
              </SelectTrigger>
              <SelectContent position="popper">
                {confirmationTemplates.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No application confirmation templates found
                  </SelectItem>
                ) : (
                  confirmationTemplates.map(t => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Go to the <strong>Email Templates</strong> tab, create a template
              and set its type to{' '}
              <strong>&quot;Application Confirmation&quot;</strong>. It will
              appear here. Available variables: <code>candidateName</code>,{' '}
              <code>jobTitle</code>, <code>companyName</code>.
            </p>
          </div>
        )}
        <div className="flex justify-end">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleSave}
            disabled={mutating || (enabled && !templateId)}
          >
            {saved ? <CheckIcon className="size-3.5" /> : null}
            {saved ? 'Saved' : mutating ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
