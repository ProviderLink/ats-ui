import { cn } from '@/lib/utils';
import type { User } from '@/store/types/user.types';
import { memberAvatarClass } from '../_utils/member-avatar';

export function MemberCell({
  member,
  onClick,
}: {
  member: User;
  onClick: () => void;
}) {
  const first = member.firstName ?? '';
  const last = member.lastName ?? '';
  const initials = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || '?';
  const bg = memberAvatarClass(first, last);
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div
        className={cn(
          'size-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 select-none overflow-hidden',
          !member.avatar && bg
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
      <div className="flex flex-col gap-1.5 min-w-0 pt-1.5">
        <button
          type="button"
          onClick={onClick}
          className="text-sm font-medium leading-tight truncate text-left hover:text-primary hover:underline underline-offset-4 transition-colors cursor-pointer"
        >
          {first} {last}
        </button>
        {!member.isInviteAccepted && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:border-amber-500/50 dark:text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
            Invite pending
          </span>
        )}
      </div>
    </div>
  );
}
