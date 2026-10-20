import { Badge } from '@/components/ui/badge';
import {
  INTERVIEW_STATUS_STYLES,
  INTERVIEW_TYPE_ACCENTS,
  INTERVIEW_TYPE_LABELS,
} from '@/lib/interview-styles';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/store/types';
import { UsersIcon, VideoIcon } from 'lucide-react';
import {
  getInterviewEndTime,
  getInterviewStartTime,
  getMeetingLocation,
  isExternalMeeting,
} from '../_utils/calendar-helpers';
import { ExternalAgendaCard } from './external-agenda-card';

interface AgendaEventCardProps {
  event: CalendarEvent;
  interviewerNames: Record<string, string>;
  onClick: (event: CalendarEvent) => void;
}

export function AgendaEventCard({
  event,
  interviewerNames,
  onClick,
}: AgendaEventCardProps) {
  if (isExternalMeeting(event)) {
    return <ExternalAgendaCard event={event} onClick={onClick} />;
  }
  const startTime = getInterviewStartTime(event.scheduledAt, event.timezone);
  const endTime = getInterviewEndTime(
    event.scheduledAt,
    event.duration,
    event.timezone
  );
  // A raw meeting URL is long and unreadable in a card; the type already says
  // where it happens and the sheet holds the link.
  const place =
    event.type === 'phone_call' || event.type === 'in_person'
      ? getMeetingLocation(event)
      : null;
  const people = (
    event.interviewerNames ??
    event.interviewerIds.map(id => interviewerNames[id] ?? id)
  ).join(', ');
  const link = event.meetingDetails?.link;
  const joinUrl =
    link &&
    /^https?:\/\//i.test(link) &&
    event.status === 'scheduled' &&
    (event.type === 'zoom' || event.type === 'google_meet')
      ? link
      : null;
  const inactive = event.status !== 'scheduled';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(event)}
      onKeyDown={e => {
        if (
          e.target === e.currentTarget &&
          (e.key === 'Enter' || e.key === ' ')
        ) {
          e.preventDefault();
          onClick(event);
        }
      }}
      className={cn(
        'group flex w-full cursor-pointer items-stretch gap-3 text-left bg-card ring-1 ring-foreground/10 rounded-xl pl-3 pr-4 py-3 shadow-xs transition-shadow hover:shadow-sm',
        inactive && 'opacity-70'
      )}
    >
      <div className="flex w-14 shrink-0 flex-col text-xs tabular-nums">
        <span className="font-medium text-foreground">{startTime}</span>
        <span className="text-muted-foreground">{endTime}</span>
      </div>

      <span
        aria-hidden
        className={cn(
          'w-0.5 shrink-0 self-stretch rounded-full',
          INTERVIEW_TYPE_ACCENTS[event.type]
        )}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{event.title}</span>
          {inactive && (
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 text-[10px] capitalize',
                INTERVIEW_STATUS_STYLES[event.status]
              )}
            >
              {event.status === 'no_show' ? 'No show' : event.status}
            </Badge>
          )}
        </div>
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="shrink-0">{INTERVIEW_TYPE_LABELS[event.type]}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">{event.duration} min</span>
          {place && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{place}</span>
            </>
          )}
        </p>
        {people && (
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <UsersIcon className="size-3 shrink-0" />
            <span className="truncate">{people}</span>
          </p>
        )}
      </div>

      {joinUrl && (
        <a
          href={joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 self-center rounded-md border px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <VideoIcon className="size-3.5" />
          Join
        </a>
      )}
    </div>
  );
}
