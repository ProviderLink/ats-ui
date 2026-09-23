import { cn } from '@/lib/utils';
import type { Interview, InterviewType } from '@/store/types';
import { getInterviewStartTime } from '../_utils/calendar-helpers';

const TYPE_STYLES: Record<InterviewType, string> = {
  zoom: 'bg-primary/10 text-primary border-primary/20',
  google_meet:
    'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400',
  phone_call:
    'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
  in_person:
    'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400',
};

interface EventCardProps {
  event: Interview;
  onClick: (event: Interview) => void;
  compact?: boolean;
}

export function EventCard({ event, onClick, compact }: EventCardProps) {
  const startTime = getInterviewStartTime(event.scheduledAt, event.timezone);
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        onClick(event);
      }}
      className={cn(
        'w-full text-left text-xs font-medium px-1.5 py-0.5 rounded border truncate transition-opacity hover:opacity-75',
        TYPE_STYLES[event.type],
        event.status !== 'scheduled' && 'opacity-50'
      )}
    >
      {!compact && <span className="opacity-70 mr-0.5">{startTime} </span>}
      {event.title}
    </button>
  );
}
