import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  EXTERNAL_MEETING_CHIP,
  EXTERNAL_MEETING_STATUS_LABELS,
  EXTERNAL_MEETING_STATUS_STYLES,
} from '@/lib/external-meeting-styles';
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
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={e => {
            e.stopPropagation();
            onClick(event);
          }}
          className={cn(
            'flex w-full items-center gap-1 text-left text-xs font-medium px-1.5 py-0.5 rounded border truncate transition-opacity hover:opacity-75',
            EXTERNAL_MEETING_CHIP,
            event.status === 'cancelled' && 'opacity-50 line-through',
            event.status === 'completed' && 'opacity-60'
          )}
        >
          <UserRoundIcon className="size-3 shrink-0" aria-hidden />
          <span className="truncate">
            {!compact && (
              <span className="opacity-70 mr-0.5">{startTime} </span>
            )}
            {event.title}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={4}
        className="bg-transparent p-0 shadow-md [&_svg]:hidden!"
      >
        <Badge
          variant="outline"
          className={cn(
            'text-[10px]',
            EXTERNAL_MEETING_STATUS_STYLES[event.status],
            'bg-background dark:bg-background'
          )}
        >
          {EXTERNAL_MEETING_STATUS_LABELS[event.status]}
        </Badge>
      </TooltipContent>
    </Tooltip>
  );
}
