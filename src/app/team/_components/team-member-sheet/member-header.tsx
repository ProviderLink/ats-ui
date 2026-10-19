import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ROLE_LABELS } from '@/lib/role-labels';
import { cn } from '@/lib/utils';
import { usePresenceStore } from '@/store/slices/presence.store';
import type { User } from '@/store/types/user.types';
import { memberAvatarClass } from '../../_utils/member-avatar';
import {
  BadgeCheckIcon,
  CircleCheckIcon,
  CircleOffIcon,
  ClockIcon,
  PencilIcon,
} from 'lucide-react';

interface MemberHeaderProps {
  member: User;
  onEdit: () => void;
}

/** Account state as an icon pill, so it is not mistaken for the online dot. */
function AccountStatus({ member }: { member: User }) {
  const invited = member.isActive && !member.isInviteAccepted;
  const [Icon, label, tone] = invited
    ? [
        ClockIcon,
        'Invite pending',
        'border-amber-400/60 text-amber-600 dark:text-amber-400',
      ]
    : member.isActive
      ? [
          CircleCheckIcon,
          'Active account',
          'border-border text-foreground',
        ]
      : [
          CircleOffIcon,
          'Inactive account',
          'border-rose-400/60 text-rose-600 dark:text-rose-400',
        ];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tone
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

export function MemberHeader({ member, onEdit }: MemberHeaderProps) {
  const first = member.firstName ?? '';
  const last = member.lastName ?? '';
  const initials = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || '?';

  const isOnline = usePresenceStore(st => Boolean(st.online[member._id]));
  const roles = member.roles ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div
            className={cn(
              'size-16 rounded-full flex items-center justify-center text-xl font-semibold select-none overflow-hidden',
              !member.avatar && memberAvatarClass(first, last)
            )}
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
          {isOnline && (
            <span
              role="img"
              aria-label="Online"
              className="absolute bottom-0.5 right-0.5 size-3.5 rounded-full bg-green-500 ring-2 ring-background"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold leading-tight truncate">
            {first} {last}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
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
        </div>
        <Button
          variant="outline"
          className="h-9 shrink-0 gap-2 px-3.5 text-sm font-medium"
          onClick={onEdit}
        >
          <PencilIcon className="size-4" />
          Edit
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-muted/40 px-4 py-3 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Account</dt>
          <dd>
            <AccountStatus member={member} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Right now</dt>
          <dd className="flex h-5 items-center gap-1.5 text-xs font-medium">
            <span
              className={cn(
                'size-2 rounded-full',
                isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'
              )}
            />
            {isOnline ? 'Online now' : 'Offline'}
          </dd>
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">
            {roles.length === 1 ? 'Role' : 'Roles'}
          </dt>
          <dd className="flex flex-wrap gap-1.5">
            {roles.length === 0 ? (
              <span className="text-xs text-muted-foreground">None</span>
            ) : (
              roles.map(r => (
                <Badge key={r} variant="secondary" className="text-xs">
                  {ROLE_LABELS[r] ?? r}
                </Badge>
              ))
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
