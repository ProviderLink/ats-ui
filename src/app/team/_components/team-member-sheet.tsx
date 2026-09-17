'use client';

import { ActivityTimeline } from '@/components/activity-timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePermission } from '@/hooks/use-permission';
import { cn, formatDate } from '@/lib/utils';
import type { User, UserPermissionResource } from '@/store/types/user.types';
import {
  BadgeCheckIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  ShieldIcon,
} from 'lucide-react';
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
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {children}
    </p>
  );
}

type Props = {
  member: User | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: (member: User) => void;
};

export function TeamMemberSheet({ member, open, onOpenChange, onEdit }: Props) {
  const { hasPermission } = usePermission();
  const canViewActivity = hasPermission('activityLogs', 'read');

  // Hooks must run before this early return.
  if (!member) return null;

  const first = member.firstName ?? '';
  const last = member.lastName ?? '';
  const initials = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || '?';
  const color = avatarColor(member);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 w-full sm:max-w-sm"
      >
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Member Details</SheetTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
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

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          <div className="flex items-center gap-4">
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
                  alt={`${member.firstName} ${member.lastName}`}
                  className="size-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold leading-tight truncate">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {member.email}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
                    member.isActive
                      ? 'border-[#69c58a]/60 text-[#2d8a51] dark:text-[#69c58a]'
                      : 'border-rose-400/60 text-rose-600 dark:text-rose-400'
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      member.isActive
                        ? 'bg-[#69c58a]'
                        : 'bg-rose-500 dark:bg-rose-400'
                    )}
                  />
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
                {!member.isInviteAccepted && (
                  <span className="inline-flex items-center rounded-full border border-amber-400/60 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    Invite pending
                  </span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <SectionTitle>Contact</SectionTitle>
            <InfoRow icon={<MailIcon className="size-4" />} label="Email">
              <div className="flex items-center gap-1.5">
                <a
                  href={`mailto:${member.email}`}
                  className="text-foreground underline underline-offset-4 decoration-border hover:text-primary transition-colors"
                >
                  {member.email}
                </a>
                {member.emailVerified && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BadgeCheckIcon className="size-3.5 text-[#69c58a] shrink-0 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top">Email verified</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </InfoRow>
            <InfoRow icon={<PhoneIcon className="size-4" />} label="Phone">
              {member.phone || <span className="text-muted-foreground">—</span>}
            </InfoRow>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <SectionTitle>Role &amp; Access</SectionTitle>
            <InfoRow icon={<ShieldIcon className="size-4" />} label="Roles">
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {member.roles?.map(r => (
                  <Badge key={r} variant="secondary" className="text-xs">
                    {ROLE_LABELS[r] ?? r}
                  </Badge>
                ))}
              </div>
            </InfoRow>
            <InfoRow
              icon={<ShieldIcon className="size-4" />}
              label="App Access"
            >
              {(member.appAccess ?? []).length === 0 ? (
                <span className="text-muted-foreground">None</span>
              ) : (
                <div className="flex gap-1.5 mt-0.5">
                  {(member.appAccess ?? []).map(a => (
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
            </InfoRow>
          </div>

          {member.permissions && Object.keys(member.permissions).length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-4">
                <SectionTitle>Permissions</SectionTitle>
                <div className="flex flex-col gap-2.5">
                  {Object.entries(member.permissions)
                    .filter(([, v]) => {
                      if (typeof v === 'boolean') return v;
                      return (
                        v &&
                        typeof v === 'object' &&
                        Object.values(v).some(Boolean)
                      );
                    })
                    .map(([resource, actions]) => {
                      const label = PERMISSION_LABELS[resource] ?? resource;
                      if (typeof actions === 'boolean') {
                        return (
                          <div
                            key={resource}
                            className="flex items-center gap-2"
                          >
                            <CheckIcon className="size-3.5 text-[#69c58a] shrink-0" />
                            <span className="text-sm">{label}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={resource} className="flex flex-col gap-1">
                          <span className="text-xs font-medium">{label}</span>
                          <div className="flex flex-wrap gap-1">
                            {(
                              Object.entries(actions) as [
                                keyof UserPermissionResource,
                                boolean,
                              ][]
                            )
                              .filter(([, v]) => v)
                              .map(([action]) => (
                                <Badge
                                  key={action}
                                  variant="outline"
                                  className="text-xs border-pine-teal-200 dark:border-pine-teal-700"
                                >
                                  {ACTION_LABELS[action] ?? action}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex flex-col gap-3">
            <SectionTitle>Account Activity</SectionTitle>
            <InfoRow icon={<CalendarIcon className="size-4" />} label="Joined">
              {formatDate(member.createdAt)}
            </InfoRow>
            {member.updatedAt && (
              <InfoRow
                icon={<CalendarIcon className="size-4" />}
                label="Last updated"
              >
                {formatDate(member.updatedAt)}
              </InfoRow>
            )}
            <InfoRow
              icon={<ClockIcon className="size-4" />}
              label="Last login (ATS)"
            >
              {member.lastLoginAts ? (
                formatDate(member.lastLoginAts)
              ) : (
                <span className="text-muted-foreground">Never</span>
              )}
            </InfoRow>
            <InfoRow
              icon={<ClockIcon className="size-4" />}
              label="Last login (CRM)"
            >
              {member.lastLoginCrm ? (
                formatDate(member.lastLoginCrm)
              ) : (
                <span className="text-muted-foreground">Never</span>
              )}
            </InfoRow>
          </div>

          <Separator />

          {canViewActivity && (
            <div className="flex flex-col gap-3">
              <SectionTitle>Activity Log</SectionTitle>
              <ActivityTimeline
                resourceType="user"
                resourceId={member._id}
                compact
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
