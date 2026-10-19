import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { User } from '@/store/types/user.types';
import { CircleCheckIcon, CircleOffIcon, ClockIcon } from 'lucide-react';

type AccountState = Pick<User, 'isActive' | 'isInviteAccepted'>;

const STATES = {
  active: {
    Icon: CircleCheckIcon,
    label: 'Active account',
    hint: 'Accepted the invite and can sign in.',
    tone: 'border-border text-foreground',
  },
  invited: {
    Icon: ClockIcon,
    label: 'Invite pending',
    hint: 'Invite sent, not accepted yet. They cannot sign in until they set a password.',
    tone: 'border-amber-400/60 text-amber-600 dark:text-amber-400',
  },
  inactive: {
    Icon: CircleOffIcon,
    label: 'Inactive account',
    hint: 'Deactivated. They cannot sign in.',
    tone: 'border-rose-400/60 text-rose-600 dark:text-rose-400',
  },
} as const;

/**
 * Account state (not presence) as an icon pill, so it is never mistaken for the
 * green online dot. Hover explains what the state means.
 */
export function AccountStatus({ member }: { member: AccountState }) {
  const key = !member.isActive
    ? 'inactive'
    : member.isInviteAccepted
      ? 'active'
      : 'invited';
  const { Icon, label, hint, tone } = STATES[key];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex cursor-default items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            tone
          )}
        >
          <Icon className="size-3" />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56">
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}
