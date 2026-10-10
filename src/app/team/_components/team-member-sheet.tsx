'use client';

import {
  ActivityTimeline,
  type ActivityFilter,
} from '@/components/activity-timeline';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatDate } from '@/lib/utils';
import type { User, UserPermissionResource } from '@/store/types/user.types';
import { BadgeCheckIcon, PencilIcon } from 'lucide-react';
import { ROLE_LABELS } from '../_data/team';

const PERMISSION_LABELS: Record<string, string> = {
  candidates: 'Candidates',
  jobs: 'Jobs',
  interviews: 'Interviews',
  clients: 'Clients',
  emails: 'Emails',
  tags: 'Tags',
  settings: 'Settings',
  dashboard: 'Dashboard',
  team: 'Team',
  pipelineTemplates: 'Pipeline Templates',
  emailTemplates: 'Email Templates',
  activityLogs: 'Activity Logs',
  assignments: 'Assignments',
  reports: 'Reports',
  eod: 'EOD',
  performanceReview: 'Performance Review',
};

const ACTION_LABELS: Record<keyof UserPermissionResource, string> = {
  read: 'Read',
  write: 'Write',
  manage: 'Manage',
  schedule: 'Schedule',
  approve: 'Approve',
};

const AVATAR_COLORS = [
  { bg: '#d4ede8', text: '#115e59' },
  { bg: '#ede9fe', text: '#5b21b6' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#ffe4e6', text: '#9f1239' },
  { bg: '#e0f2fe', text: '#0c4a6e' },
  { bg: '#d1fae5', text: '#065f46' },
];

function avatarColor(member: User) {
  const first = member.firstName ?? '';
  const last = member.lastName ?? '';
  const idx =
    ((first.charCodeAt(0) || 0) + (last.charCodeAt(0) || 0)) %
    AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}

const Empty = ({ text = '—' }: { text?: string }) => (
  <span className="text-muted-foreground">{text}</span>
);

function activeActions(value: boolean | UserPermissionResource | undefined) {
  if (typeof value === 'boolean') return value ? [] : null;
  if (!value) return null;
  const actions = (
    Object.entries(value) as [keyof UserPermissionResource, boolean][]
  )
    .filter(([, on]) => on)
    .map(([action]) => ACTION_LABELS[action] ?? action);
  return actions.length ? actions : null;
}

type Props = {
  member: User | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: (member: User) => void;
};

/** Sign-ins are the most frequent entries, so they get their own view. */
const SIGN_IN_ACTIONS = new Set([
  'login',
  'login_failed',
  'password_changed',
  'password_reset',
  'invite_accepted',
]);

const MEMBER_ACTIVITY_FILTERS: ActivityFilter[] = [
  {
    id: 'signins',
    label: 'Sign-ins',
    match: log => SIGN_IN_ACTIONS.has(String(log.action)),
  },
  {
    id: 'changes',
    label: 'Changes',
    match: log => !SIGN_IN_ACTIONS.has(String(log.action)),
  },
];

export function TeamMemberSheet({ member, open, onOpenChange, onEdit }: Props) {
  if (!member) return null;

  const first = member.firstName ?? '';
  const last = member.lastName ?? '';
  const initials = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || '?';
  const color = avatarColor(member);
  const permissions = Object.entries(member.permissions ?? {}).flatMap(
    ([resource, value]) => {
      const actions = activeActions(value);
      return actions
        ? [{ label: PERMISSION_LABELS[resource] ?? resource, actions }]
        : [];
    }
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 w-full sm:max-w-md"
      >
        <SheetHeader className="gap-4 px-6 pt-6 pb-4">
          <SheetTitle className="sr-only">Member details</SheetTitle>
          <SheetDescription className="sr-only">
            Team member profile, access and activity.
          </SheetDescription>
          <div className="flex items-center gap-4 pr-8">
            <div
              className="size-14 rounded-full flex items-center justify-center text-lg font-semibold shrink-0 select-none overflow-hidden"
              style={
                !member.avatar
                  ? { backgroundColor: color.bg, color: color.text }
                  : undefined
              }
            >
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={`${first} ${last}`}
                  className="size-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-tight truncate">
                {first} {last}
              </p>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="truncate">{member.email}</span>
                {member.emailVerified && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BadgeCheckIcon className="size-3.5 text-[#69c58a] shrink-0 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top">Email verified</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-medium',
                    member.isActive
                      ? 'text-[#2d8a51] dark:text-[#69c58a]'
                      : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      member.isActive ? 'bg-[#69c58a]' : 'bg-rose-500'
                    )}
                  />
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
                {!member.isInviteAccepted && (
                  <Badge
                    variant="outline"
                    className="text-xs text-amber-600 dark:text-amber-400"
                  >
                    Invite pending
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2.5 text-xs"
              onClick={() => {
                onOpenChange(false);
                onEdit(member);
              }}
            >
              <PencilIcon className="size-3" />
              Edit
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="min-h-0 flex-1 gap-0">
          <TabsList variant="line" className="w-full justify-start px-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="overview" className="divide-y">
              <DetailRow label="Phone">{member.phone || <Empty />}</DetailRow>
              <DetailRow label="Joined">
                {formatDate(member.createdAt)}
              </DetailRow>
              <DetailRow label="Last updated">
                {member.updatedAt ? formatDate(member.updatedAt) : <Empty />}
              </DetailRow>
              <DetailRow label="Last sign-in (ATS)">
                {member.lastLoginAts ? (
                  formatDate(member.lastLoginAts)
                ) : (
                  <Empty text="Never" />
                )}
              </DetailRow>
              <DetailRow label="Last sign-in (CRM)">
                {member.lastLoginCrm ? (
                  formatDate(member.lastLoginCrm)
                ) : (
                  <Empty text="Never" />
                )}
              </DetailRow>
            </TabsContent>

            <TabsContent value="access" className="flex flex-col gap-5">
              <div className="divide-y">
                <DetailRow label="Roles">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {member.roles?.map(r => (
                      <Badge key={r} variant="secondary" className="text-xs">
                        {ROLE_LABELS[r] ?? r}
                      </Badge>
                    ))}
                  </div>
                </DetailRow>
                <DetailRow label="App access">
                  {(member.appAccess ?? []).length === 0 ? (
                    <Empty text="None" />
                  ) : (
                    <div className="flex justify-end gap-1.5">
                      {member.appAccess.map(a => (
                        <Badge
                          key={a}
                          variant="outline"
                          className="uppercase text-xs"
                        >
                          {a}
                        </Badge>
                      ))}
                    </div>
                  )}
                </DetailRow>
              </div>

              {permissions.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium">Permissions</p>
                  <div className="divide-y">
                    {permissions.map(({ label, actions }) => (
                      <DetailRow key={label} label={label}>
                        {actions.length ? (
                          <span className="text-xs text-muted-foreground">
                            {actions.join(' · ')}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Allowed
                          </span>
                        )}
                      </DetailRow>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity">
              <ActivityTimeline
                resourceType="user"
                resourceId={member._id}
                filters={MEMBER_ACTIVITY_FILTERS}
                compact
              />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
