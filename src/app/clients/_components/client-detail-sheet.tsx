'use client';

import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { ActivityTimeline } from '@/components/activity-timeline';
import { TagsSelector } from '@/components/tags-selector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logOptimisticActivity } from '@/lib/activity';
import { getTagIds } from '@/lib/tags';
import { cn } from '@/lib/utils';
import {
  useApplicationStore,
  useClientStore,
  useJobStore,
  useTagStore,
  useUserStore,
} from '@/store';
import { useActivityLogStore } from '@/store/slices/activity-logs.store';
import type {
  Client,
  ClientContact,
  ClientCrmProfile,
  ClientNote,
  ClientStatus,
  CrmHealth,
  NoteMethod,
} from '@/store/types';
import {
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  GlobeIcon,
  Loader2Icon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  PencilIcon,
  PhoneCallIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  StarIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
  XCircleIcon,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// ─── Config ────────────────────────────────────────────────────────────────

const AVATAR_BG = [
  'bg-pine-teal-100 text-pine-teal-800 dark:bg-pine-teal-900 dark:text-pine-teal-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
];

const statusConfig: Record<
  ClientStatus,
  { label: string; cls: string; dot: string }
> = {
  active: {
    label: 'Active',
    dot: 'bg-[#69c58a]',
    cls: 'border-[#69c58a]/60 text-[#2d8a51] dark:text-[#69c58a]',
  },
  inactive: {
    label: 'Inactive',
    dot: 'bg-silver-400 dark:bg-white/30',
    cls: 'border-silver-400/60 text-muted-foreground',
  },
  suspended: {
    label: 'Suspended',
    dot: 'bg-rose-500 dark:bg-rose-400',
    cls: 'border-rose-400/60 text-rose-600 dark:text-rose-400',
  },
};

const healthConfig: Record<
  CrmHealth,
  { label: string; dot: string; cls: string }
> = {
  green: {
    label: 'Healthy',
    dot: 'bg-[#69c58a]',
    cls: 'text-[#2d8a51] dark:text-[#69c58a]',
  },
  yellow: {
    label: 'At Risk',
    dot: 'bg-[#f3a64a]',
    cls: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    label: 'Critical',
    dot: 'bg-rose-500 dark:bg-rose-400',
    cls: 'text-rose-600 dark:text-rose-400',
  },
};

const jobStatusConfig: Record<string, { label: string; cls: string }> = {
  open: {
    label: 'Open',
    cls: 'border-pine-teal-600/50 text-pine-teal-700 dark:border-pine-teal-400/50 dark:text-pine-teal-300',
  },
  draft: { label: 'Draft', cls: 'border-silver-400/50 text-muted-foreground' },
  on_hold: {
    label: 'On Hold',
    cls: 'border-amber-500/50 text-amber-600 dark:text-amber-400',
  },
  closed: {
    label: 'Closed',
    cls: 'border-rose-400/50 text-rose-600 dark:text-rose-400',
  },
};

const noteMethodConfig: Record<
  NoteMethod,
  { label: string; icon: React.ReactNode }
> = {
  call: { label: 'Call', icon: <PhoneCallIcon className="size-3.5" /> },
  email: { label: 'Email', icon: <MailIcon className="size-3.5" /> },
  meeting: { label: 'Meeting', icon: <CalendarIcon className="size-3.5" /> },
  message: {
    label: 'Message',
    icon: <MessageSquareIcon className="size-3.5" />,
  },
  other: { label: 'Other', icon: <PencilIcon className="size-3.5" /> },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function avatarColor(name: string) {
  return AVATAR_BG[name.charCodeAt(0) % AVATAR_BG.length];
}

function nameInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Primitives ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {children}
    </p>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

function BoolIndicator({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        value ? 'text-[#2d8a51] dark:text-[#69c58a]' : 'text-muted-foreground'
      )}
    >
      {value ? (
        <CheckCircleIcon className="size-3.5" />
      ) : (
        <XCircleIcon className="size-3.5" />
      )}
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function StarRating({ score }: { score?: number | null }) {
  if (score == null) return <Dash />;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={cn(
            'size-3.5',
            i < score
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
      <span className="ml-1.5 text-sm text-muted-foreground">{score}/5</span>
    </div>
  );
}

function CompanyAvatar({ name, logo }: { name: string; logo?: string | null }) {
  const bg = avatarColor(name);
  if (logo)
    return (
      <img
        src={logo}
        alt={name}
        className="size-14 rounded-xl object-cover shrink-0"
      />
    );
  return (
    <div
      className={cn(
        'size-14 rounded-xl flex items-center justify-center shrink-0 select-none text-base font-semibold',
        bg
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Contact Form ──────────────────────────────────────────────────────────

type ContactDraft = {
  name: string;
  email: string;
  phone: string;
  position: string;
  isPrimary: boolean;
};
const emptyDraft = (): ContactDraft => ({
  name: '',
  email: '',
  phone: '',
  position: '',
  isPrimary: false,
});

/** Strip empty strings so optional fields are truly undefined for the API. */
function sanitizeDraft(d: ContactDraft): {
  name: string;
  email: string;
  phone?: string;
  position?: string;
  isPrimary?: boolean;
} {
  return {
    name: d.name,
    email: d.email,
    ...(d.phone.trim() ? { phone: d.phone } : {}),
    ...(d.position.trim() ? { position: d.position } : {}),
    isPrimary: d.isPrimary,
  };
}

function ContactForm({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial?: ContactDraft;
  saving?: boolean;
  onSave: (d: ContactDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ContactDraft>(initial ?? emptyDraft());
  const set = (k: keyof ContactDraft, v: string | boolean) =>
    setDraft(p => ({ ...p, [k]: v }));
  const valid = draft.name.trim() && draft.email.trim();

  return (
    <div className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Name *</Label>
          <Input
            value={draft.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Position</Label>
          <Input
            value={draft.position}
            onChange={e => set('position', e.target.value)}
            placeholder="e.g. HR Director"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Email *</Label>
          <Input
            type="email"
            value={draft.email}
            onChange={e => set('email', e.target.value)}
            placeholder="email@company.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Phone</Label>
          <Input
            value={draft.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="isPrimary"
          checked={draft.isPrimary}
          onCheckedChange={v => set('isPrimary', Boolean(v))}
        />
        <Label htmlFor="isPrimary" className="cursor-pointer">
          Set as primary contact
        </Label>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!valid || saving}
          onClick={() => onSave(draft)}
        >
          {saving ? <Loader2Icon className="size-4 animate-spin" /> : 'Save'}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Contacts Tab ──────────────────────────────────────────────────────────

function ContactsTab({
  clientId,
  contacts,
}: {
  clientId: string;
  contacts: ClientContact[];
}) {
  const addContact = useClientStore(s => s.addContact);
  const updateContact = useClientStore(s => s.updateContact);
  const removeContact = useClientStore(s => s.removeContact);
  const mutating = useClientStore(s => s.mutating);

  const sorted = [...contacts].sort(
    (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [composeFor, setComposeFor] = useState<ClientContact | null>(null);

  async function handleSaveEdit(id: string, draft: ContactDraft) {
    try {
      const wasPrimary = contacts.find(c => c._id === id)?.isPrimary ?? false;
      await updateContact(clientId, id, sanitizeDraft(draft));

      // Enforce "always one primary" rule: if unchecking primary on a contact
      // that was primary, promote the next contact to primary automatically.
      if (wasPrimary && !draft.isPrimary) {
        const other = contacts.find(c => c._id !== id);
        if (other) {
          await updateContact(clientId, other._id, {
            name: other.name,
            email: other.email,
            phone: other.phone,
            position: other.position,
            isPrimary: true,
          });
          toast.success(`Primary reassigned to ${other.name}`);
        }
      }

      logOptimisticActivity(
        'client',
        clientId,
        'contact_updated',
        `Updated contact ${draft.name}`
      );
      toast.success('Contact updated');
      setEditingId(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDelete(id: string, isPrimary: boolean) {
    if (contacts.length <= 1) {
      toast.error(
        'Cannot delete the only contact. A client must have at least one contact.'
      );
      setDeleteConfirmId(null);
      return;
    }
    if (isPrimary) {
      toast.error(
        'Cannot delete the primary contact. Set another contact as primary first.'
      );
      setDeleteConfirmId(null);
      return;
    }
    try {
      await removeContact(clientId, id);
      logOptimisticActivity(
        'client',
        clientId,
        'contact_removed',
        'Removed a contact'
      );
      toast.success('Contact removed');
      setDeleteConfirmId(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleAdd(draft: ContactDraft) {
    try {
      await addContact(clientId, sanitizeDraft(draft));
      logOptimisticActivity(
        'client',
        clientId,
        'contact_added',
        `Added contact ${draft.name}`
      );
      toast.success('Contact added');
      setShowAdd(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-3 py-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
        </p>
        {!showAdd && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => {
              setEditingId(null);
              setShowAdd(true);
            }}
          >
            <PlusIcon className="size-3" />
            Add Contact
          </Button>
        )}
      </div>

      {contacts.length === 0 && !showAdd && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No contacts added yet.
        </div>
      )}

      {sorted.map(c =>
        editingId === c._id ? (
          <ContactForm
            key={c._id}
            initial={{
              name: c.name,
              email: c.email,
              phone: c.phone ?? '',
              position: c.position ?? '',
              isPrimary: c.isPrimary,
            }}
            saving={mutating}
            onSave={d => handleSaveEdit(c._id, d)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={c._id}
            className="rounded-lg border bg-card p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0 text-muted-foreground">
                  {nameInitials(c.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">
                    {c.name}
                  </p>
                  {c.position && (
                    <p className="text-xs text-muted-foreground truncate">
                      {c.position}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {c.isPrimary && (
                  <Badge
                    variant="outline"
                    className="text-xs h-6 px-2 border-pine-teal-600/50 text-pine-teal-700 dark:border-pine-teal-400/50 dark:text-pine-teal-300"
                  >
                    Primary
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setComposeFor(c)}
                >
                  <MailIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setShowAdd(false);
                    setEditingId(c._id);
                  }}
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={mutating}
                  onClick={() => setDeleteConfirmId(c._id)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={`mailto:${c.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MailIcon className="size-4 shrink-0" />
                <span className="truncate">{c.email}</span>
              </a>
              {c.phone && (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PhoneIcon className="size-4 shrink-0" />
                  {c.phone}
                </span>
              )}
            </div>
            {deleteConfirmId === c._id && <Separator />}
            {deleteConfirmId === c._id && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Delete this contact?
                </span>
                <Button
                  variant="destructive"
                  size="xs"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={mutating}
                  onClick={() => handleDelete(c._id, c.isPrimary)}
                >
                  Yes
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  No
                </Button>
              </div>
            )}
          </div>
        )
      )}

      {showAdd && (
        <ContactForm
          saving={mutating}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <ComposeEmailSheet
        open={!!composeFor}
        onOpenChange={v => !v && setComposeFor(null)}
        mode={
          composeFor
            ? {
                type: 'prefill',
                to: composeFor.email,
                subject: '',
                body: '',
                templateType: 'general',
                context: { type: 'general' },
                variables: {
                  candidateName: composeFor.name,
                  candidateEmail: composeFor.email,
                  candidatePhone: composeFor.phone ?? '',
                  jobTitle: '',
                  clientName: '',
                  currentStage: '',
                  companyName: '',
                  senderName: '',
                },
              }
            : { type: 'new' }
        }
      />
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────

function UserCell({ userId }: { userId?: string }) {
  const users = useUserStore(s => s.items);
  const fetchUsers = useUserStore(s => s.fetch);

  useEffect(() => {
    if (users.length === 0) fetchUsers();
  }, []);

  if (!userId)
    return <span className="text-sm text-muted-foreground">System</span>;

  const user = users.find(u => u._id === userId);
  if (!user) return <span className="text-sm">{userId}</span>;

  return (
    <span className="text-sm">
      {user.firstName} {user.lastName}
    </span>
  );
}

function OverviewTab({ client }: { client: Client }) {
  const shortAddress = client.address
    ? [client.address.city, client.address.state, client.address.country]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <div className="flex flex-col gap-6 py-5">
      <div className="flex flex-col gap-4">
        <SectionTitle>Contact Info</SectionTitle>
        <InfoRow icon={<MailIcon className="size-4" />} label="Email">
          <a
            href={`mailto:${client.email}`}
            className="underline underline-offset-4 decoration-border hover:text-primary transition-colors break-all"
          >
            {client.email}
          </a>
        </InfoRow>
        <InfoRow icon={<PhoneIcon className="size-4" />} label="Phone">
          {client.phone || <Dash />}
        </InfoRow>
        <InfoRow icon={<GlobeIcon className="size-4" />} label="Website">
          {client.website ? (
            <a
              href={
                client.website.startsWith('http')
                  ? client.website
                  : `https://${client.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 decoration-border hover:text-primary transition-colors"
            >
              {client.website}
            </a>
          ) : (
            <Dash />
          )}
        </InfoRow>
        <InfoRow icon={<MapPinIcon className="size-4" />} label="Address">
          {shortAddress || <Dash />}
        </InfoRow>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <SectionTitle>Company</SectionTitle>
        <InfoRow icon={<BuildingIcon className="size-4" />} label="Industry">
          {client.industry ? (
            client.industry.charAt(0).toUpperCase() + client.industry.slice(1)
          ) : (
            <Dash />
          )}
        </InfoRow>
        <InfoRow icon={<UserIcon className="size-4" />} label="Company Size">
          {client.companySize ? `${client.companySize} employees` : <Dash />}
        </InfoRow>
        {client.description && (
          <InfoRow
            icon={<BuildingIcon className="size-4" />}
            label="Description"
          >
            <span className="leading-relaxed break-words whitespace-pre-wrap">
              {client.description}
            </span>
          </InfoRow>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <SectionTitle>Record Info</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-sm">{formatDate(client.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Updated</p>
            <p className="text-sm">{formatDate(client.updatedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created by</p>
            <UserCell userId={client.createdBy} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Updated by</p>
            <UserCell userId={client.updatedBy} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CRM Tab ───────────────────────────────────────────────────────────────

function CrmEditForm({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  draft: ClientCrmProfile;
  onChange: (d: ClientCrmProfile) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  function set<K extends keyof ClientCrmProfile>(k: K, v: ClientCrmProfile[K]) {
    onChange({ ...draft, [k]: v });
  }

  return (
    <div className="flex flex-col gap-5 py-5">
      <div className="flex flex-col gap-2">
        <Label>Health Status</Label>
        <Select
          value={draft.healthStatus ?? ''}
          onValueChange={v => set('healthStatus', v as CrmHealth)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="green">Healthy</SelectItem>
            <SelectItem value="yellow">At Risk</SelectItem>
            <SelectItem value="red">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Satisfaction Score (1–5)</Label>
          <Input
            type="number"
            min={1}
            max={5}
            value={draft.satisfactionScore ?? ''}
            onChange={e =>
              set(
                'satisfactionScore',
                e.target.value ? Number(e.target.value) : null
              )
            }
            placeholder="e.g. 4"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Open Issues</Label>
          <Input
            type="number"
            min={0}
            value={draft.openIssuesCount ?? 0}
            onChange={e => set('openIssuesCount', Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Last Check-in</Label>
        <Input
          type="date"
          value={
            draft.lastClientCheckin ? draft.lastClientCheckin.split('T')[0] : ''
          }
          onChange={e =>
            set(
              'lastClientCheckin',
              e.target.value ? new Date(e.target.value).toISOString() : null
            )
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>EMR System</Label>
        <Input
          value={draft.emrSystem ?? ''}
          onChange={e => set('emrSystem', e.target.value)}
          placeholder="e.g. Epic"
        />
      </div>

      <Separator />
      <SectionTitle>Onboarding</SectionTitle>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="editOnboarding"
            checked={!!draft.onboardingComplete}
            onCheckedChange={v => set('onboardingComplete', Boolean(v))}
          />
          <Label htmlFor="editOnboarding" className="cursor-pointer">
            Onboarding Complete
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="editSop"
            checked={!!draft.sopReceived}
            onCheckedChange={v => set('sopReceived', Boolean(v))}
          />
          <Label htmlFor="editSop" className="cursor-pointer">
            SOP Received
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="editBaa"
            checked={!!draft.baaSign}
            onCheckedChange={v => set('baaSign', Boolean(v))}
          />
          <Label htmlFor="editBaa" className="cursor-pointer">
            BAA Signed
          </Label>
        </div>
        {draft.baaSign && (
          <div className="flex flex-col gap-2">
            <Label>BAA Signed Date</Label>
            <Input
              type="date"
              value={
                draft.baaSignedDate ? draft.baaSignedDate.split('T')[0] : ''
              }
              onChange={e =>
                set(
                  'baaSignedDate',
                  e.target.value ? new Date(e.target.value).toISOString() : null
                )
              }
            />
          </div>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label>Notes</Label>
        <textarea
          rows={4}
          value={draft.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="Internal notes about this client..."
          className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring resize-none dark:bg-input/30"
        />
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1 hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            'Save Changes'
          )}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function CrmTab({
  clientId,
  crm: initialCrm,
}: {
  clientId: string;
  crm: ClientCrmProfile;
}) {
  const updateCrmProfile = useClientStore(s => s.updateCrmProfile);
  const mutating = useClientStore(s => s.mutating);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ClientCrmProfile>(initialCrm);

  async function handleSave() {
    try {
      await updateCrmProfile(clientId, draft);
      logOptimisticActivity(
        'client',
        clientId,
        'crm_profile_updated',
        'Updated CRM profile'
      );
      toast.success('CRM profile updated');
      setEditing(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (editing) {
    return (
      <CrmEditForm
        draft={draft}
        onChange={setDraft}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
        saving={mutating}
      />
    );
  }

  const health = initialCrm.healthStatus
    ? healthConfig[initialCrm.healthStatus]
    : null;

  return (
    <div className="flex flex-col gap-6 py-5">
      <div className="flex items-center justify-between">
        <SectionTitle>Health &amp; Satisfaction</SectionTitle>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => {
            setDraft(initialCrm);
            setEditing(true);
          }}
        >
          <PencilIcon className="size-3" />
          Edit
        </Button>
      </div>

      {health && (
        <div className="flex items-center gap-2">
          <span className={cn('size-2.5 rounded-full shrink-0', health.dot)} />
          <span className={cn('text-sm font-medium', health.cls)}>
            {health.label}
          </span>
        </div>
      )}

      <InfoRow
        icon={<StarIcon className="size-4" />}
        label="Satisfaction Score"
      >
        <StarRating score={initialCrm.satisfactionScore} />
      </InfoRow>
      <InfoRow icon={<XCircleIcon className="size-4" />} label="Open Issues">
        <span
          className={cn(
            'font-medium',
            (initialCrm.openIssuesCount ?? 0) > 0
              ? 'text-rose-600 dark:text-rose-400'
              : ''
          )}
        >
          {initialCrm.openIssuesCount ?? 0}
        </span>
      </InfoRow>
      <InfoRow icon={<CalendarIcon className="size-4" />} label="Last Check-in">
        {initialCrm.lastClientCheckin ? (
          formatDate(initialCrm.lastClientCheckin)
        ) : (
          <Dash />
        )}
      </InfoRow>

      <Separator />

      <div className="flex flex-col gap-4">
        <SectionTitle>Onboarding</SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Onboarding</span>
            <BoolIndicator
              value={!!initialCrm.onboardingComplete}
              trueLabel="Complete"
              falseLabel="Pending"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">SOP Received</span>
            <BoolIndicator
              value={!!initialCrm.sopReceived}
              trueLabel="Received"
              falseLabel="Pending"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">BAA Signed</span>
            <BoolIndicator
              value={!!initialCrm.baaSign}
              trueLabel="Signed"
              falseLabel="Not signed"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">BAA Date</span>
            <span className="text-sm">
              {initialCrm.baaSignedDate ? (
                formatDate(initialCrm.baaSignedDate)
              ) : (
                <Dash />
              )}
            </span>
          </div>
        </div>
        {initialCrm.emrSystem && (
          <InfoRow
            icon={<BuildingIcon className="size-4" />}
            label="EMR System"
          >
            {initialCrm.emrSystem}
          </InfoRow>
        )}
      </div>

      {initialCrm.notes && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <SectionTitle>Notes</SectionTitle>
            <p className="text-sm leading-relaxed text-foreground/80">
              {initialCrm.notes}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Jobs Tab ──────────────────────────────────────────────────────────────

function JobsTab({ clientId }: { clientId: string }) {
  const navigate = useNavigate();
  const jobs = useJobStore(s => s.items);
  const apps = useApplicationStore(s => s.items);
  const fetchApps = useApplicationStore(s => s.fetch);
  const clientJobs = jobs.filter(j => j.clientId === clientId);

  useEffect(() => {
    void fetchApps({ clientId, limit: 9999 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const appCountsByJob = useMemo(() => {
    const map = new Map<string, { total: number; approved: number }>();
    for (const a of apps) {
      const entry = map.get(a.jobId) ?? { total: 0, approved: 0 };
      entry.total++;
      if (a.phase === 'approved' || a.phase === 'hired') entry.approved++;
      map.set(a.jobId, entry);
    }
    return map;
  }, [apps]);

  if (clientJobs.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No jobs found for this client.
      </div>
    );
  }

  const open = clientJobs.filter(j => j.status === 'open');
  const other = clientJobs.filter(j => j.status !== 'open');

  return (
    <div className="flex flex-col gap-3 py-5">
      <p className="text-xs text-muted-foreground">
        {clientJobs.length} {clientJobs.length === 1 ? 'job' : 'jobs'} total ·{' '}
        {open.length} open
      </p>
      {open.length > 0 && (
        <>
          <SectionTitle>Active</SectionTitle>
          {open.map(j => {
            const cfg = jobStatusConfig[j.status] ?? jobStatusConfig.draft;
            const counts = appCountsByJob.get(j._id);
            return (
              <div
                key={j._id}
                className="rounded-lg border bg-card p-4 flex flex-col gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/ats/jobs?job=${j._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ')
                    navigate(`/ats/jobs?job=${j._id}`);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">
                      {j.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {j.jobType.replace('_', ' ')} · {j.locationType}
                      {j.openings > 1 && ` · ${j.openings} openings`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0 text-xs bg-transparent', cfg.cls)}
                  >
                    {cfg.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2">
                  <span className="flex items-center gap-1">
                    <UsersIcon className="size-3.5" />
                    {j.openings} opening{j.openings !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="size-3.5" />
                    {counts?.total ?? 0} candidate
                    {counts?.total !== 1 ? 's' : ''}
                  </span>
                  {(counts?.approved ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-pine-teal-700 dark:text-pine-teal-400">
                      <CheckCircleIcon className="size-3.5" />
                      {counts!.approved} approved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
      {other.length > 0 && (
        <>
          {open.length > 0 && <Separator />}
          <SectionTitle>Other</SectionTitle>
          {other.map(j => {
            const cfg = jobStatusConfig[j.status] ?? jobStatusConfig.draft;
            const counts = appCountsByJob.get(j._id);
            return (
              <div
                key={j._id}
                className="rounded-lg border bg-card p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/ats/jobs?job=${j._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ')
                    navigate(`/ats/jobs?job=${j._id}`);
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{j.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {j.startDate
                      ? formatDate(j.startDate)
                      : formatDate(j.createdAt)}
                    {(counts?.total ?? 0) > 0 && (
                      <>
                        {' '}
                        · {counts!.total} candidate
                        {counts!.total !== 1 ? 's' : ''}
                      </>
                    )}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn('shrink-0 text-xs bg-transparent', cfg.cls)}
                >
                  {cfg.label}
                </Badge>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── Notes Tab ─────────────────────────────────────────────────────────────

function NoteAuthor({ authorId }: { authorId?: string }) {
  const users = useUserStore(s => s.items);
  const fetchUsers = useUserStore(s => s.fetch);

  useEffect(() => {
    if (users.length === 0) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authorId) return 'Unknown';

  const user = users.find(u => u._id === authorId);
  if (user) return `${user.firstName} ${user.lastName}`;

  return authorId;
}

function NoteCard({
  note,
  onEdit,
  onDelete,
  mutating,
}: {
  note: ClientNote;
  onEdit: () => void;
  onDelete: () => void;
  mutating: boolean;
}) {
  const method = noteMethodConfig[note.method];
  const date = formatDate(note.createdAt);
  const authorName = <NoteAuthor authorId={note.author} />;

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0 text-muted-foreground">
            {method.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight truncate">
              {authorName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className="text-xs h-6 px-2 border-pine-teal-600/50 text-pine-teal-700 dark:border-pine-teal-400/50 dark:text-pine-teal-300"
          >
            {method.label}
          </Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={onEdit}
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            disabled={mutating}
            onClick={onDelete}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>
      <Separator />
      <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
        {note.content}
      </p>
    </div>
  );
}

function NoteForm({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial?: { method: NoteMethod; content: string };
  saving?: boolean;
  onSave: (data: { method: NoteMethod; content: string }) => void;
  onCancel: () => void;
}) {
  const [method, setMethod] = useState<NoteMethod>(initial?.method ?? 'call');
  const [content, setContent] = useState(initial?.content ?? '');
  const valid = content.trim().length > 0;

  return (
    <div className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Method</Label>
        <Select value={method} onValueChange={v => setMethod(v as NoteMethod)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(noteMethodConfig) as NoteMethod[]).map(m => (
              <SelectItem key={m} value={m}>
                {noteMethodConfig[m].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Note *</Label>
        <textarea
          rows={3}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Brief note about the interaction..."
          className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring resize-none dark:bg-input/30"
        />
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!valid || saving}
          onClick={() => onSave({ method, content: content.trim() })}
        >
          {saving ? <Loader2Icon className="size-4 animate-spin" /> : 'Save'}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ActivityTab({ clientId }: { clientId: string }) {
  const fetchForEntity = useActivityLogStore(s => s.fetchForEntity);

  useEffect(() => {
    void fetchForEntity('client', clientId, { force: true });
  }, [clientId, fetchForEntity]);

  return (
    <div className="py-5">
      <p className="mb-3 text-xs text-muted-foreground">
        Audit trail of every change made to this client — contacts, CRM profile,
        status changes, and more.
      </p>
      <ActivityTimeline resourceType="client" resourceId={clientId} compact />
    </div>
  );
}

function NotesTab({ clientId }: { clientId: string }) {
  const emptyArr = useRef<ClientNote[]>([]);
  const notes = useClientStore(s => s.notes[clientId]) ?? emptyArr.current;
  const notesLoading = useClientStore(s => s.notesLoading);
  const fetchNotes = useClientStore(s => s.fetchNotes);
  const addNote = useClientStore(s => s.addNote);
  const updateNote = useClientStore(s => s.updateNote);
  const deleteNote = useClientStore(s => s.deleteNote);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void fetchNotes(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function handleAdd(data: { method: NoteMethod; content: string }) {
    setSaving(true);
    try {
      await addNote(clientId, data);
      logOptimisticActivity('client', clientId, 'note_added', 'Added a note');
      toast.success('Note added');
      setShowAdd(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: { method: NoteMethod; content: string }) {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateNote(clientId, editingId, data);
      logOptimisticActivity(
        'client',
        clientId,
        'note_updated',
        'Updated a note'
      );
      toast.success('Note updated');
      setEditingId(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await deleteNote(clientId, noteId);
      logOptimisticActivity(
        'client',
        clientId,
        'note_deleted',
        'Deleted a note'
      );
      toast.success('Note deleted');
      setDeleteConfirmId(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4 py-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </p>
        {!showAdd && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => {
              setEditingId(null);
              setShowAdd(true);
            }}
          >
            <PlusIcon className="size-3" />
            Add Note
          </Button>
        )}
      </div>

      {showAdd && (
        <NoteForm
          saving={saving}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {notesLoading && notes.length === 0 ? (
        <div className="py-8 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : notes.length === 0 && !showAdd ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No notes yet. Log a call, email, or meeting.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map(n => (
            <div key={n._id}>
              {editingId === n._id ? (
                <NoteForm
                  initial={{ method: n.method, content: n.content }}
                  saving={saving}
                  onSave={handleUpdate}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <NoteCard
                    note={n}
                    mutating={saving}
                    onEdit={() => {
                      setShowAdd(false);
                      setEditingId(n._id);
                    }}
                    onDelete={() => setDeleteConfirmId(n._id)}
                  />
                  {deleteConfirmId === n._id && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        Delete this note?
                      </span>
                      <Button
                        variant="destructive"
                        size="xs"
                        className="h-6 gap-1 px-2 text-xs"
                        disabled={saving}
                        onClick={() => handleDelete(n._id)}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        className="h-6 gap-1 px-2 text-xs"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        No
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sheet ─────────────────────────────────────────────────────────────────

type Props = {
  client: Client | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
};

export function ClientDetailSheet({
  client,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: Props) {
  if (!client) return null;

  const { provisionClient, revokeCrmAccess } = useUserStore();
  const allUsers = useUserStore(s => s.items);
  const apps = useApplicationStore(s => s.items);
  const fetchApps = useApplicationStore(s => s.fetch);
  const [provisioning, setProvisioning] = useState(false);

  // Determine CRM provision status for this client
  const crmUser = allUsers.find(
    u => u.clientRef === client._id && u.appAccess?.includes('crm')
  );
  const hasCrmAccess = !!crmUser;

  // Fetch applications for this client when the sheet opens, so we can check hires
  useEffect(() => {
    if (open) void fetchApps({ clientId: client._id, limit: 9999 });
  }, [open, client._id, fetchApps]);

  // Only show provision button if this client has ≥1 hired candidate
  const hasHiredCandidate = apps.some(
    a => a.clientId === client._id && a.phase === 'hired'
  );
  const canProvisionCrm = client.status === 'active' && hasHiredCandidate;

  async function handleProvision() {
    setProvisioning(true);
    try {
      await provisionClient(client!._id);
      toast.success('CRM access provisioned. Invite email will be sent.');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to provision CRM access');
    } finally {
      setProvisioning(false);
    }
  }

  async function handleRevoke() {
    if (!crmUser) return;
    setProvisioning(true);
    try {
      await revokeCrmAccess(crmUser._id);
      toast.success('CRM access revoked');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to revoke CRM access');
    } finally {
      setProvisioning(false);
    }
  }

  const status = statusConfig[client.status];
  const crmHealth = client.crmProfile?.healthStatus
    ? healthConfig[client.crmProfile.healthStatus]
    : null;

  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);
  const updateClient = useClientStore(s => s.update);

  useEffect(() => {
    if (open) void fetchTags();
  }, [open, fetchTags]);

  async function handleUpdateTags(tagIds: string[]) {
    if (!client) return;
    try {
      await updateClient(client._id, { tags: tagIds });
    } catch {
      // toast handled by store
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 w-full sm:!max-w-[500px]"
      >
        <SheetHeader className="border-b px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Client Details</SheetTitle>
            <div className="flex items-center gap-1.5">
              {canProvisionCrm && !hasCrmAccess && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={handleProvision}
                  disabled={provisioning}
                  title="Send CRM portal invite to this client's primary contact"
                >
                  <ShieldCheckIcon className="size-3 text-muted-foreground" />
                  {provisioning ? '…' : 'Give CRM Access'}
                </Button>
              )}
              {hasCrmAccess && (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full border border-pine-teal-500/40 bg-pine-teal-50 px-2 py-0.5 text-[11px] font-medium text-pine-teal-700 dark:bg-pine-teal-950/50 dark:text-pine-teal-400">
                    <ShieldCheckIcon className="size-3" />
                    CRM Active
                    {!crmUser?.isInviteAccepted && (
                      <span className="text-amber-600 dark:text-amber-400 ml-0.5">
                        (invited)
                      </span>
                    )}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                    onClick={handleRevoke}
                    disabled={provisioning}
                    title="Remove CRM portal access from this client"
                  >
                    <XCircleIcon className="size-3" />
                    {provisioning ? '…' : 'Revoke'}
                  </Button>
                </>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(client);
                  }}
                >
                  <PencilIcon className="size-3" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                  onClick={() => {
                    onOpenChange(false);
                    onDelete(client);
                  }}
                >
                  <Trash2Icon className="size-3" />
                  Delete
                </Button>
              )}
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TagsSelector
              allTags={allTags}
              selectedIds={getTagIds(client.tags)}
              onChange={handleUpdateTags}
              compact
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Identity */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-4">
              <CompanyAvatar name={client.companyName} logo={client.logo} />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-tight truncate">
                  {client.companyName}
                </p>
                {client.address && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[
                      client.address.city,
                      client.address.state,
                      client.address.country,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
                      status.cls
                    )}
                  >
                    <span className={cn('size-1.5 rounded-full', status.dot)} />
                    {status.label}
                  </span>
                  {crmHealth && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium',
                        crmHealth.cls
                      )}
                    >
                      <span
                        className={cn('size-1.5 rounded-full', crmHealth.dot)}
                      />
                      {crmHealth.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <div className="border-b px-6 py-3">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="contacts">
                  Contacts
                  {client.contacts.length > 0 && (
                    <Badge
                      variant="outline"
                      className="h-4 px-1.5 text-[10px] rounded-full border-border"
                    >
                      {client.contacts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                {client.crmProfile && (
                  <TabsTrigger value="crm">CRM</TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-0 px-6">
              <OverviewTab client={client} />
            </TabsContent>

            <TabsContent value="contacts" className="mt-0 px-6">
              <ContactsTab clientId={client._id} contacts={client.contacts} />
            </TabsContent>

            <TabsContent value="jobs" className="mt-0 px-6">
              <JobsTab clientId={client._id} />
            </TabsContent>

            <TabsContent value="activity" className="mt-0 px-6">
              <ActivityTab clientId={client._id} />
            </TabsContent>

            <TabsContent value="notes" className="mt-0 px-6">
              <NotesTab clientId={client._id} />
            </TabsContent>

            {client.crmProfile && (
              <TabsContent value="crm" className="mt-0 px-6">
                <CrmTab clientId={client._id} crm={client.crmProfile} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
