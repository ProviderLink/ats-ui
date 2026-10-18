import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { User } from '@/store/types/user.types';
import { BadgeCheckIcon, PencilIcon } from 'lucide-react';

const AVATAR_COLORS = [
  { bg: '#d4ede8', text: '#115e59' },
  { bg: '#ede9fe', text: '#5b21b6' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#ffe4e6', text: '#9f1239' },
  { bg: '#e0f2fe', text: '#0c4a6e' },
  { bg: '#d1fae5', text: '#065f46' },
];

function avatarColor(first: string, last: string) {
  const idx =
    ((first.charCodeAt(0) || 0) + (last.charCodeAt(0) || 0)) %
    AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

interface MemberHeaderProps {
  member: User;
  onEdit: () => void;
}

export function MemberHeader({ member, onEdit }: MemberHeaderProps) {
  const first = member.firstName ?? '';
  const last = member.lastName ?? '';
  const initials = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || '?';
  const color = avatarColor(first, last);

  return (
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
        onClick={onEdit}
      >
        <PencilIcon className="size-3" />
        Edit
      </Button>
    </div>
  );
}
