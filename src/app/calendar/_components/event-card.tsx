import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUS_STYLES,
  INTERVIEW_TYPE_STYLES,
} from '@/lib/interview-styles';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/store/types';
import {
  getInterviewStartTime,
  isExternalMeeting,
} from '../_utils/calendar-helpers';
import { ExternalEventCard } from './external-event-card';

interface EventCardProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  compact?: boolean;
}

export function EventCard({ event, onClick, compact }: EventCardProps) {
  if (isExternalMeeting(event)) {
    return (
      <ExternalEventCard event={event} onClick={onClick} compact={compact} />
    );
  }
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
            'w-full text-left text-xs font-medium px-1.5 py-0.5 rounded border truncate transition-opacity hover:opacity-75',
            INTERVIEW_TYPE_STYLES[event.type],
            event.status !== 'scheduled' && 'opacity-50'
          )}
        >
          {!compact && <span className="opacity-70 mr-0.5">{startTime} </span>}
          {event.title}
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
            INTERVIEW_STATUS_STYLES[event.status],
            'bg-background dark:bg-background'
          )}
        >
          {INTERVIEW_STATUS_LABELS[event.status]}
        </Badge>
      </TooltipContent>
    </Tooltip>
  );
}
