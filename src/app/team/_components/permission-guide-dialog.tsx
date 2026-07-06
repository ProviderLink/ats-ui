'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  BookOpenIcon,
  CalendarIcon,
  CheckIcon,
  EyeIcon,
  MinusIcon,
  PencilIcon,
  ShieldCheckIcon,
  TrashIcon,
} from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  manage: <TrashIcon className="size-3" />,
  write: <PencilIcon className="size-3" />,
  read: <EyeIcon className="size-3" />,
  schedule: <CalendarIcon className="size-3" />,
  approve: <CheckIcon className="size-3" />,
};

const ACTION_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  manage: 'default',
  write: 'secondary',
  read: 'outline',
  schedule: 'secondary',
  approve: 'secondary',
};

type CellValue = string | string[] | null;

const PERMISSION_MATRIX: Record<string, Record<string, CellValue>> = {
  candidates: {
    admin: 'manage',
    hiring_manager: 'manage',
    recruiter: 'manage',
    coordinator: 'write',
    interviewer: 'read',
    account_manager: null,
    client: null,
    va: null,
  },
  jobs: {
    admin: 'manage',
    hiring_manager: 'manage',
    recruiter: 'read',
    coordinator: 'read',
    interviewer: null,
    account_manager: null,
    client: null,
    va: null,
  },
  interviews: {
    admin: 'schedule',
    hiring_manager: 'write',
    recruiter: 'write',
    coordinator: ['write', 'schedule'],
    interviewer: 'write',
    account_manager: null,
    client: null,
    va: null,
  },
  clients: {
    admin: 'manage',
    hiring_manager: 'read',
    recruiter: 'read',
    coordinator: 'read',
    interviewer: null,
    account_manager: 'write',
    client: 'read',
    va: null,
  },
  emails: {
    admin: 'write',
    hiring_manager: 'write',
    recruiter: 'write',
    coordinator: 'write',
    interviewer: null,
    account_manager: null,
    client: null,
    va: null,
  },
  tags: {
    admin: 'manage',
    hiring_manager: 'write',
    recruiter: 'read',
    coordinator: 'read',
    interviewer: 'read',
    account_manager: null,
    client: null,
    va: null,
  },
  settings: {
    admin: 'write',
    hiring_manager: 'read',
    recruiter: 'read',
    coordinator: 'read',
    interviewer: null,
    account_manager: null,
    client: null,
    va: null,
  },
  dashboard: {
    admin: 'read',
    hiring_manager: 'read',
    recruiter: 'read',
    coordinator: 'read',
    interviewer: null,
    account_manager: 'read',
    client: null,
    va: null,
  },
  team: {
    admin: 'manage',
    hiring_manager: null,
    recruiter: null,
    coordinator: null,
    interviewer: null,
    account_manager: null,
    client: null,
    va: null,
  },
  pipelineTemplates: {
    admin: 'write',
    hiring_manager: 'read',
    recruiter: 'read',
    coordinator: 'read',
    interviewer: null,
    account_manager: null,
    client: null,
    va: null,
  },
  emailTemplates: {
    admin: 'write',
    hiring_manager: 'read',
    recruiter: 'read',
    coordinator: 'read',
    interviewer: null,
    account_manager: null,
    client: null,
    va: null,
  },
  activityLogs: {
    admin: 'read',
    hiring_manager: null,
    recruiter: null,
    coordinator: null,
    interviewer: null,
    account_manager: 'read',
    client: null,
    va: null,
  },
  assignments: {
    admin: 'manage',
    hiring_manager: null,
    recruiter: null,
    coordinator: null,
    interviewer: null,
    account_manager: 'manage',
    client: 'read',
    va: 'read',
  },
  reports: {
    admin: 'manage',
    hiring_manager: null,
    recruiter: null,
    coordinator: null,
    interviewer: null,
    account_manager: 'manage',
    client: 'read',
    va: null,
  },
  eod: {
    admin: 'approve',
    hiring_manager: null,
    recruiter: null,
    coordinator: null,
    interviewer: null,
    account_manager: 'approve',
    client: 'read',
    va: 'write',
  },
  performanceReview: {
    admin: 'approve',
    hiring_manager: null,
    recruiter: null,
    coordinator: null,
    interviewer: null,
    account_manager: 'approve',
    client: null,
    va: null,
  },
};

const ROLES = [
  'admin',
  'hiring_manager',
  'recruiter',
  'coordinator',
  'interviewer',
  'account_manager',
  'client',
  'va',
] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  hiring_manager: 'Hiring Mgr',
  recruiter: 'Recruiter',
  coordinator: 'Coordinator',
  interviewer: 'Interviewer',
  account_manager: 'Acct Mgr',
  client: 'Client',
  va: 'VA',
};

const ROLE_GROUPS: { label: string; roles: string[] }[] = [
  {
    label: 'ATS',
    roles: [
      'admin',
      'hiring_manager',
      'recruiter',
      'coordinator',
      'interviewer',
    ],
  },
  { label: 'CRM', roles: ['account_manager', 'client', 'va'] },
];

const RESOURCE_LABELS: Record<string, string> = {
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
  performanceReview: 'Perf. Review',
};

function ActionBadge({ action }: { action: string }) {
  return (
    <Badge
      variant={ACTION_VARIANT[action] ?? 'outline'}
      className="gap-1 text-[11px]"
    >
      {ACTION_ICONS[action]}
      {action}
    </Badge>
  );
}

function EmptyCell() {
  return (
    <span className="inline-flex items-center justify-center w-full">
      <MinusIcon className="size-3 text-muted-foreground/40" />
    </span>
  );
}

function ResourceLabel({ name }: { name: string }) {
  return (
    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
      {RESOURCE_LABELS[name] ?? name}
    </span>
  );
}

export function PermissionGuideDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-240 max-h-[85vh] p-0 gap-0 flex flex-col"
        showCloseButton
      >
        <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-pine-teal-100 dark:bg-pine-teal-900/40 flex items-center justify-center">
              <BookOpenIcon className="size-4 text-pine-teal-700 dark:text-pine-teal-300" />
            </div>
            <div>
              <DialogTitle className="text-base">Permission Guide</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Read-only reference — ATS & CRM role permissions at a glance
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-auto flex-1 min-h-0 px-6 py-4">
          {/* Legend */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-[11px] text-muted-foreground">Legend:</span>
            {(['manage', 'write', 'read', 'schedule', 'approve'] as const).map(
              a => (
                <ActionBadge key={a} action={a} />
              )
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <MinusIcon className="size-3 text-muted-foreground/40" />
              No access
            </span>
          </div>

          {/* Permission Matrix */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left text-[11px] font-medium text-muted-foreground border-r">
                      Resource
                    </th>
                    {ROLE_GROUPS.map(g => (
                      <th
                        key={g.label}
                        colSpan={g.roles.length}
                        className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 border-x"
                      >
                        {g.label}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-muted/30">
                    <th className="sticky left-0 z-10 bg-muted/30 px-3 py-1.5 border-r" />
                    {ROLES.map(r => (
                      <th
                        key={r}
                        className="px-1.5 py-1.5 text-center text-[11px] font-medium whitespace-nowrap"
                      >
                        {ROLE_LABELS[r]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(PERMISSION_MATRIX).map(
                    ([resource, perms], i) => (
                      <tr
                        key={resource}
                        className={cn(
                          'hover:bg-muted/20 transition-colors',
                          i % 2 === 0 && 'bg-muted/10'
                        )}
                      >
                        <td className="sticky left-0 z-10 px-3 py-2 border-r bg-inherit">
                          <ResourceLabel name={resource} />
                        </td>
                        {ROLES.map(role => {
                          const val = perms[role];
                          if (!val) {
                            return (
                              <td
                                key={role}
                                className="px-1.5 py-2 text-center"
                              >
                                <EmptyCell />
                              </td>
                            );
                          }
                          const actions = Array.isArray(val) ? val : [val];
                          return (
                            <td
                              key={role}
                              className="px-1.5 py-1.5 text-center"
                            >
                              <div className="flex flex-col items-center gap-0.5">
                                {actions.map(a => (
                                  <ActionBadge key={a} action={a} />
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Hierarchy */}
          <div className="mt-4 px-3 py-2.5 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Hierarchy:</span>{' '}
              <span className="inline-flex items-center gap-0.5">
                <ActionBadge action="manage" />
                <span className="text-muted-foreground/50 mx-0.5">→</span>
                <ActionBadge action="write" />
                <span className="text-muted-foreground/50 mx-0.5">→</span>
                <ActionBadge action="read" />
              </span>
              <span className="mx-1.5 text-border">|</span>
              <span className="inline-flex items-center gap-0.5">
                <ActionBadge action="schedule" />
                <span className="text-muted-foreground/50 mx-0.5">→</span>
                <ActionBadge action="write" />
              </span>
              <span className="mx-1.5 text-border">|</span>
              <span className="inline-flex items-center gap-0.5">
                <ActionBadge action="approve" />
                <span className="text-muted-foreground/50 mx-0.5">→</span>
                <ActionBadge action="write" />
              </span>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheckIcon className="size-3.5 shrink-0" />
            <span>
              Source:{' '}
              <code className="text-[11px] bg-muted px-1 py-0.5 rounded">
                buildPermissionsForRoles()
              </code>{' '}
              • admin bypasses all checks • ATS + CRM share roles
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
