import { EXTERNAL_MEETING_CHIP } from '@/lib/external-meeting-styles';
import { cn } from '@/lib/utils';
import type { ExternalMeeting } from '@/store/types';
import { UserRoundIcon } from 'lucide-react';
import { getInterviewStartTime } from '../_utils/calendar-helpers';

interface ExternalEventCardProps {
  event: ExternalMeeting;
  onClick: (event: ExternalMeeting) => void;
  compact?: boolean;
}

/** Month / week chip for an external meeting: dashed teal with a person icon. */
export function ExternalEventCard({
  event,
  onClick,
  compact,
}: ExternalEventCardProps) {
  const startTime = getInterviewStartTime(event.scheduledAt, event.timezone);
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        onClick(event);
      }}
      title={`External · ${event.personName}`}
      className={cn(
        'flex w-full items-center gap-1 text-left text-xs font-medium px-1.5 py-0.5 rounded border truncate transition-opacity hover:opacity-75',
        EXTERNAL_MEETING_CHIP,
        event.status === 'cancelled' && 'opacity-50 line-through',
        event.status === 'completed' && 'opacity-60'
      )}
    >
      <UserRoundIcon className="size-3 shrink-0" aria-hidden />
      <span className="truncate">
        {!compact && <span className="opacity-70 mr-0.5">{startTime} </span>}
        {event.title}
      </span>
    </button>
  );
}
