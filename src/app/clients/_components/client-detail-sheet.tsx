import { TagsSelector } from '@/components/tags-selector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTagIds } from '@/lib/tags';
import { cn } from '@/lib/utils';
import {
  useApplicationStore,
  useClientStore,
  useTagStore,
  useUserStore,
} from '@/store';
import type { Client } from '@/store/types';
import {
  PencilIcon,
  ShieldCheckIcon,
  Trash2Icon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ActivityTab } from './client-detail/activity-tab';
import { healthConfig, statusConfig } from './client-detail/config';
import { ContactsTab } from './client-detail/contacts-tab';
import { CrmTab } from './client-detail/crm-tab';
import { JobsTab } from './client-detail/jobs-tab';
import { NotesTab } from './client-detail/notes-tab';
import { OverviewTab } from './client-detail/overview-tab';
import { CompanyAvatar } from './client-detail/primitives';

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
  // The null check deliberately sits OUTSIDE the hooks. `client` is derived from
  // the live store array by the caller, so it can become null while the sheet is
  // already mounted — e.g. another user deletes the client and the
  // `client:deleted` socket event patches it out of `items`. Returning null from
  // a component that had already mounted its hooks crashed React with
  // "Rendered fewer hooks than expected", so the hooks live in a child that is
  // only ever rendered with a real client.
  if (!client) return null;

  return (
    <ClientDetailSheetContent
      client={client}
      open={open}
      onOpenChange={onOpenChange}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

interface ContentProps {
  client: Client;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

function ClientDetailSheetContent({
  client,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ContentProps) {
  const { provisionClient, revokeCrmAccess } = useUserStore();
  const allUsers = useUserStore(s => s.items);
  const apps = useApplicationStore(s => s.items);
  const fetchAppsMerge = useApplicationStore(s => s.fetchScopedMerge);
  const [provisioning, setProvisioning] = useState(false);

  // Determine CRM provision status for this client
  const crmUser = allUsers.find(
    u => u.clientRef === client._id && u.appAccess?.includes('crm')
  );
  const hasCrmAccess = !!crmUser;

  // Fetch applications for this client when the sheet opens, so we can check
  // hires. Merges into the shared list rather than replacing it, so screens
  // that depend on the full dataset are unaffected.
  useEffect(() => {
    if (open) void fetchAppsMerge({ clientId: client._id, limit: 9999 });
  }, [open, client._id, fetchAppsMerge]);

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
          <SheetDescription className="sr-only">
            Client company details, contacts, jobs and activity.
          </SheetDescription>
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
