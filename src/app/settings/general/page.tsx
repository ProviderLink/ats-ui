import { ConfirmDialog } from '@/components/confirm-dialog';
import { TimezoneSelect } from '@/components/timezone-select';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getJson } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';
import {
  useEmailTemplateStore,
  usePipelineTemplateStore,
  useSettingsStore,
  useUserStore,
  useAuthStore,
} from '@/store';
import type { EmailTemplate, PipelineTemplate } from '@/store/types';
import {
  BotIcon,
  CheckIcon,
  EyeIcon,
  FileTextIcon,
  LayersIcon,
  ListFilterIcon,
  MailCheckIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  SlidersHorizontalIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';

import { getTimezoneOffsetLabel } from '@/lib/timezones';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EmailTemplateSheet } from '../_components/email-template-sheet';
import { EmailTemplateViewDialog } from '../_components/email-template-view-dialog';
import { PipelineTemplateSheet } from '../_components/pipeline-template-sheet';
import { PipelineTemplateViewDialog } from '../_components/pipeline-template-view-dialog';
import { DispositionReasonsCard } from '../disposition-reasons/page';
import {
  EMAIL_TEMPLATE_TYPES,
  workspaceSettings as initialWorkspace,
} from '../_data/settings';

const TYPE_MAP = Object.fromEntries(
  EMAIL_TEMPLATE_TYPES.map(t => [t.value, t.label])
) as Record<string, string>;

// ─── Workspace Card ──────────────────────────────────────────────────────────

function WorkspaceCard() {
  const { settings, loading, mutating, fetch, update } = useSettingsStore();

  const [timezone, setTimezone] = useState(
    settings?.companyTimezone ?? initialWorkspace.timezone
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (settings?.companyTimezone) setTimezone(settings.companyTimezone);
  }, [settings?.companyTimezone]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
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
              disabled={mutating}
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

// ─── Email Settings Card ──────────────────────────────────────────────────────

function EmailSettingsCard() {
  const { settings, loading, mutating, update } = useSettingsStore();
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

// ─── AI Settings Card ─────────────────────────────────────────────────────────

function AiSettingsCard() {
  const { settings, loading, mutating, update } = useSettingsStore();
  const [provider, setProvider] = useState(
    settings?.ai.provider ?? initialWorkspace.aiSettings.provider
  );
  const [resumeValidation, setResumeValidation] = useState(
    settings?.ai.resumeValidation ??
      initialWorkspace.aiSettings.resumeValidation
  );
  const [candidateScoring, setCandidateScoring] = useState(
    settings?.ai.candidateScoring ??
      initialWorkspace.aiSettings.candidateScoring
  );
  const [resumeParsing, setResumeParsing] = useState(
    settings?.ai.resumeParsing ?? initialWorkspace.aiSettings.resumeParsing
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings?.ai) {
      setProvider(settings.ai.provider);
      setResumeValidation(settings.ai.resumeValidation);
      setCandidateScoring(settings.ai.candidateScoring);
      setResumeParsing(settings.ai.resumeParsing);
    }
  }, [settings?.ai]);

  async function handleSave() {
    try {
      await update({
        ai: { provider, resumeValidation, candidateScoring, resumeParsing },
      });
      toast.success('AI settings saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save AI settings');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BotIcon className="size-4 text-muted-foreground" />
          AI Settings
        </CardTitle>
        <CardDescription>
          Control AI-powered features for resume processing and candidate
          evaluation
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Provider */}
        <div className="flex flex-col gap-1.5 rounded-lg border px-4 py-3">
          <Label htmlFor="ai-provider">AI Provider</Label>
          <Select
            value={provider}
            onValueChange={v => setProvider(v as 'claude' | 'openai')}
            disabled={loading}
          >
            <SelectTrigger id="ai-provider" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">Anthropic Claude</SelectItem>
              <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            All AI features will use this provider. Set the corresponding API
            key in your environment.
          </p>
        </div>
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Resume validation</p>
            <p className="text-xs text-muted-foreground">
              Automatically validate resumes against job requirements
            </p>
          </div>
          <Switch
            checked={resumeValidation}
            onCheckedChange={setResumeValidation}
            disabled={loading}
            aria-label="Resume validation"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Candidate scoring</p>
            <p className="text-xs text-muted-foreground">
              AI-powered fit scoring and recommendations for each application
            </p>
          </div>
          <Switch
            checked={candidateScoring}
            onCheckedChange={setCandidateScoring}
            disabled={loading}
            aria-label="Candidate scoring"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Resume parsing</p>
            <p className="text-xs text-muted-foreground">
              AI-powered extraction of structured data from uploaded resumes
              (skills, experience, education)
            </p>
          </div>
          <Switch
            checked={resumeParsing}
            onCheckedChange={setResumeParsing}
            disabled={loading}
            aria-label="Resume parsing"
          />
        </div>
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

// ─── Pipeline Templates Card ─────────────────────────────────────────────────

function StageChips({ stages }: { stages: PipelineTemplate['stages'] }) {
  const active = stages.filter(s => s.isActive);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {active.slice(0, 4).map(s => (
        <span
          key={s._id}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border"
          style={{
            background: `${s.color}18`,
            borderColor: `${s.color}55`,
            color: s.color,
          }}
        >
          <span
            className="size-1.5 rounded-full shrink-0"
            style={{ background: s.color }}
          />
          {s.name}
        </span>
      ))}
      {active.length > 4 && (
        <span className="text-xs text-muted-foreground">
          +{active.length - 4} more
        </span>
      )}
    </div>
  );
}

function PipelineTemplatesCard() {
  const {
    items: templates,
    loading,
    fetch,
    create,
    update,
    remove,
  } = usePipelineTemplateStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<PipelineTemplate | undefined>(
    undefined
  );
  const [viewing, setViewing] = useState<PipelineTemplate | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  function handleNew() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function handleView(tpl: PipelineTemplate) {
    setViewing(tpl);
  }

  function handleEdit(tpl: PipelineTemplate) {
    setEditing(tpl);
    setSheetOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await remove(id);
      toast.success('Pipeline template deleted');
      setConfirmId(null);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete template');
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await update(id, { isDefault: true });
      toast.success('Default pipeline template set');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to set default template');
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    try {
      await update(id, { isActive: !current });
      toast.success(`Template ${!current ? 'activated' : 'deactivated'}`);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to update template');
    }
  }

  async function handleSave(data: {
    name: string;
    description: string;
    isDefault: boolean;
    isActive: boolean;
    stages: PipelineTemplate['stages'];
  }) {
    const stagesDto = data.stages.map(({ _id: _omit, ...s }) => s);
    try {
      if (editing) {
        await update(editing._id, { ...data, stages: stagesDto });
        toast.success('Pipeline template updated');
      } else {
        await create({ ...data, stages: stagesDto });
        toast.success('Pipeline template created');
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save template');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayersIcon className="size-4 text-muted-foreground" />
            Pipeline Templates
          </CardTitle>
          <CardDescription>
            Manage hiring pipeline templates applied to jobs
          </CardDescription>
          <div className="flex justify-end mt-1">
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleNew}>
              <PlusIcon className="size-3.5" />
              New template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="flex flex-col">
            {loading && templates.length === 0 && (
              <div className="flex flex-col gap-3 px-6 py-4">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className="h-16 rounded-md bg-muted animate-pulse"
                  />
                ))}
              </div>
            )}
            {templates.map((tpl, i) => (
              <div key={tpl._id}>
                {i > 0 && <Separator />}
                <div className="flex items-start gap-3 px-6 py-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{tpl.name}</span>
                      {tpl.isDefault && (
                        <Badge
                          variant="default"
                          className="gap-1 h-5 px-2 text-[11px] font-semibold uppercase tracking-wide shadow-sm"
                        >
                          <StarIcon className="size-3 shrink-0 fill-current" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-muted-foreground">
                        {tpl.description}
                      </p>
                    )}
                    <StageChips stages={tpl.stages} />
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tpl.stages.filter(s => s.isActive).length} stages ·
                      Updated {formatDate(tpl.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleActive(tpl._id, tpl.isActive)
                          }
                          aria-label={
                            tpl.isActive
                              ? `Deactivate ${tpl.name}`
                              : `Activate ${tpl.name}`
                          }
                          className={cn(
                            'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-xs font-medium transition-colors',
                            tpl.isActive
                              ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:border-primary/60'
                              : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <PowerIcon className="size-3" />
                          {tpl.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {tpl.isActive
                          ? 'Deactivate template — it will no longer be selectable when creating jobs'
                          : 'Activate template — make it available for selection when creating jobs'}
                      </TooltipContent>
                    </Tooltip>
                    {!tpl.isDefault && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:hover:text-amber-400"
                            onClick={() => handleSetDefault(tpl._id)}
                          >
                            <StarIcon className="size-3" />
                            Set default
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-55">
                          ⚠️ This will make this the default template. The
                          current default template will be un-defaulted — only
                          one default pipeline template is allowed at a time.
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleView(tpl)}
                    >
                      <EyeIcon className="size-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      onClick={() => handleEdit(tpl)}
                    >
                      <PencilIcon className="size-3" />
                      Edit
                    </Button>
                    {confirmId === tpl._id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Delete?
                        </span>
                        <Button
                          variant="destructive"
                          size="xs"
                          className="h-7 gap-1 px-2"
                          onClick={() => handleDelete(tpl._id)}
                        >
                          <CheckIcon className="size-3" /> Yes
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          className="h-7 gap-1 px-2"
                          onClick={() => setConfirmId(null)}
                        >
                          <XIcon className="size-3" /> No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                        onClick={() => setConfirmId(tpl._id)}
                        disabled={tpl.isDefault}
                      >
                        <Trash2Icon className="size-3" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!loading && templates.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground px-6">
                <FileTextIcon className="size-8 opacity-30" />
                <p>No pipeline templates yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNew}
                  className="mt-1 gap-1"
                >
                  <PlusIcon className="size-3.5" /> Create one
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PipelineTemplateSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        template={editing}
        onSave={handleSave}
      />

      <PipelineTemplateViewDialog
        open={!!viewing}
        onOpenChange={open => !open && setViewing(null)}
        template={viewing}
        onEdit={tpl => {
          setViewing(null);
          handleEdit(tpl);
        }}
      />
    </>
  );
}

// ─── Email Templates Card ─────────────────────────────────────────────────────

function EmailTemplatesCard() {
  const {
    items: templates,
    loading,
    fetch,
    create,
    update,
    setDefault,
    remove,
  } = useEmailTemplateStore();
  const users = useUserStore(s => s.items);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | undefined>(undefined);
  const [viewing, setViewing] = useState<EmailTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  function resolveUserName(id?: string): string {
    if (!id) return 'System';
    const user = users.find(u => u._id === id);
    return user ? `${user.firstName} ${user.lastName}`.trim() : 'System';
  }

  function handleNew() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function handleView(tpl: EmailTemplate) {
    setViewing(tpl);
  }

  function handleEdit(tpl: EmailTemplate) {
    setEditing(tpl);
    setSheetOpen(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await remove(deleteId);
      toast.success('Email template deleted');
      setDeleteId(null);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleActive(tpl: EmailTemplate) {
    setTogglingId(tpl._id);
    try {
      await update(tpl._id, { isActive: !tpl.isActive });
      toast.success(
        tpl.isActive ? 'Template deactivated' : 'Template activated'
      );
    } catch (e) {
      toast.error((e as Error).message || 'Failed to update template');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSetDefault(tpl: EmailTemplate) {
    setSettingDefaultId(tpl._id);
    try {
      await setDefault(tpl._id);
      toast.success(
        `"${tpl.name}" is now the default for ${TYPE_MAP[tpl.type] ?? tpl.type} emails`
      );
    } catch (e) {
      toast.error((e as Error).message || 'Failed to set default');
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function handleSave(
    data: Omit<
      EmailTemplate,
      | '_id'
      | 'createdBy'
      | 'updatedBy'
      | 'createdAt'
      | 'updatedAt'
      | 'variables'
    > & { variables: string[] }
  ) {
    try {
      if (editing) {
        await update(editing._id, data);
        if (data.isDefault) {
          toast.success(
            `Template updated and set as default for ${TYPE_MAP[data.type] ?? data.type} emails`
          );
        } else {
          toast.success('Email template updated');
        }
      } else {
        await create(data);
        if (data.isDefault) {
          toast.success(
            `Template created and set as default for ${TYPE_MAP[data.type] ?? data.type} emails`
          );
        } else {
          toast.success('Email template created');
        }
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save template');
      throw e;
    }
  }

  const templateToDelete = deleteId
    ? templates.find(t => t._id === deleteId)
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailIcon className="size-4 text-muted-foreground" />
            Email Templates
          </CardTitle>
          <CardDescription>
            Reusable templates for automated email communications
          </CardDescription>
          <div className="flex justify-end mt-1">
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleNew}>
              <PlusIcon className="size-3.5" />
              New template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="flex flex-col">
            {loading && templates.length === 0 && (
              <div className="flex flex-col gap-3 px-6 py-4">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className="h-14 rounded-md bg-muted animate-pulse"
                  />
                ))}
              </div>
            )}
            {templates.map((tpl, i) => (
              <div key={tpl._id}>
                {i > 0 && <Separator />}
                <div className="flex items-start gap-3 px-6 py-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{tpl.name}</span>
                      <Badge variant="outline" className="text-xs h-4 px-1.5">
                        {TYPE_MAP[tpl.type] ?? tpl.type}
                      </Badge>
                      {tpl.isDefault && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="secondary"
                              className="text-xs h-4 px-1.5 gap-0.5 cursor-default"
                            >
                              <StarIcon className="size-2.5" />
                              Default for {TYPE_MAP[tpl.type] ?? tpl.type}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="text-xs max-w-52"
                          >
                            This template is auto-selected when sending a{' '}
                            <strong>{TYPE_MAP[tpl.type] ?? tpl.type}</strong>{' '}
                            email.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-sm">
                      {tpl.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By {resolveUserName(tpl.createdBy)} ·{' '}
                      {formatDate(tpl.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Set as default */}
                    {!tpl.isDefault && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleSetDefault(tpl)}
                            disabled={settingDefaultId === tpl._id}
                          >
                            <StarIcon className="size-3" />
                            Set default
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-52">
                          Make this the default template for{' '}
                          <strong>{TYPE_MAP[tpl.type] ?? tpl.type}</strong>{' '}
                          emails. The current default will be replaced.
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Active toggle */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            'h-7 gap-1 px-2 text-xs',
                            tpl.isActive
                              ? 'text-muted-foreground hover:text-foreground'
                              : 'text-muted-foreground/50 hover:text-foreground'
                          )}
                          onClick={() => handleToggleActive(tpl)}
                          disabled={togglingId === tpl._id}
                        >
                          <PowerIcon className="size-3" />
                          {tpl.isActive ? 'Active' : 'Inactive'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {tpl.isActive
                          ? 'Click to deactivate'
                          : 'Click to activate'}
                      </TooltipContent>
                    </Tooltip>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleView(tpl)}
                    >
                      <EyeIcon className="size-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      onClick={() => handleEdit(tpl)}
                    >
                      <PencilIcon className="size-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                      onClick={() => setDeleteId(tpl._id)}
                    >
                      <Trash2Icon className="size-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && templates.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground px-6">
                <MailIcon className="size-8 opacity-30" />
                <p>No email templates yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNew}
                  className="mt-1 gap-1"
                >
                  <PlusIcon className="size-3.5" /> Create one
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EmailTemplateSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        template={editing}
        onSave={handleSave}
      />

      <EmailTemplateViewDialog
        open={!!viewing}
        onOpenChange={open => !open && setViewing(null)}
        template={viewing}
        onEdit={tpl => {
          setViewing(null);
          handleEdit(tpl);
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Delete email template?"
        description={
          templateToDelete ? (
            <span>
              <strong>{templateToDelete.name}</strong> will be permanently
              deleted. This action cannot be undone.
            </span>
          ) : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Application Confirmation Card ──────────────────────────────────────────

function ApplicationConfirmationCard() {
  const { settings, loading, mutating, update } = useSettingsStore();

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
          <MailCheckIcon className="size-4 text-muted-foreground" />
          Application Confirmation
        </CardTitle>
        <CardDescription>
          Automatically send a confirmation email when a candidate submits an
          application
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
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

export default function SettingsGeneralPage() {
  // The rejection-reason editor is admin-only, matching its own route guard,
  // because only admins may write to `/ats/disposition-reasons`.
  const isAdmin = useAuthStore(s => s.user?.roles.includes('admin') ?? false);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto">
      <div>
        <h1 className="text-base font-semibold">General Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace and pipeline configuration
        </p>
      </div>
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general">
            <SlidersHorizontalIcon className="size-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="pipelines">
            <LayersIcon className="size-4" />
            Pipeline Templates
          </TabsTrigger>
          <TabsTrigger value="emails">
            <MailIcon className="size-4" />
            Email Templates
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="rejection-reasons">
              <ListFilterIcon className="size-4" />
              Rejection Reasons
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="general" className="flex flex-col gap-6 mt-4">
          <WorkspaceCard />
          <EmailSettingsCard />
          <AiSettingsCard />
          <ApplicationConfirmationCard />
        </TabsContent>
        <TabsContent value="pipelines" className="mt-4">
          <PipelineTemplatesCard />
        </TabsContent>
        <TabsContent value="emails" className="mt-4">
          <EmailTemplatesCard />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="rejection-reasons" className="mt-4">
            <DispositionReasonsCard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
