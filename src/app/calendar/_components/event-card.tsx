import { INTERVIEW_TYPE_STYLES } from '@/lib/interview-styles';
import { cn } from '@/lib/utils';
import type { Interview } from '@/store/types';
import { getInterviewStartTime } from '../_utils/calendar-helpers';

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
        INTERVIEW_TYPE_STYLES[event.type],
        event.status !== 'scheduled' && 'opacity-50'
      )}
    >
      {!compact && <span className="opacity-70 mr-0.5">{startTime} </span>}
      {event.title}
    </button>
  );
}
