import { MeetingTypeLabel } from '@/components/meeting-type-logo';
import { Badge } from '@/components/ui/badge';
import {
  EXTERNAL_MEETING_ACCENT,
  EXTERNAL_MEETING_BADGE,
  EXTERNAL_MEETING_STATUS_LABELS,
  EXTERNAL_MEETING_STATUS_STYLES,
} from '@/lib/external-meeting-styles';
import { cn } from '@/lib/utils';
import type { ExternalMeeting } from '@/store/types';
import { UserRoundIcon, UsersIcon, VideoIcon } from 'lucide-react';
import {
  getInterviewEndTime,
  getInterviewStartTime,
  getMeetingLocation,
} from '../_utils/calendar-helpers';

interface ExternalAgendaCardProps {
  event: ExternalMeeting;
  onClick: (event: ExternalMeeting) => void;
}

/** Agenda row for an external meeting: dashed card, teal accent, "External" tag. */
export function ExternalAgendaCard({
  event,
  onClick,
}: ExternalAgendaCardProps) {
  const startTime = getInterviewStartTime(event.scheduledAt, event.timezone);
  const endTime = getInterviewEndTime(
    event.scheduledAt,
    event.duration,
    event.timezone,
  );
  const place =
    event.type === 'phone_call' || event.type === 'in_person'
      ? getMeetingLocation(event)
      : null;
  const link = event.meetingDetails.link;
  const joinUrl =
    link &&
    /^https?:\/\//i.test(link) &&
    event.status === 'scheduled' &&
    event.type === 'video'
      ? link
      : null;
  const inactive = event.status !== 'scheduled';
  const team = (event.attendeeNames ?? []).join(', ');

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
        'group flex w-full cursor-pointer items-stretch gap-3 text-left bg-teal-50 border border-dashed border-teal-500 dark:bg-teal-500/5 dark:border-teal-500/40 rounded-xl pl-3 pr-4 py-3 transition-shadow hover:shadow-sm',
      )}
    >
      <div
        className={cn(
          'flex w-14 shrink-0 flex-col text-xs tabular-nums',
          inactive && 'opacity-70',
        )}
      >
        <span className="font-medium text-foreground">{startTime}</span>
        <span className="text-muted-foreground">{endTime}</span>
      </div>

      <span
        aria-hidden
        className={cn(
          'w-0.5 shrink-0 self-stretch rounded-full',
          EXTERNAL_MEETING_ACCENT,
          inactive && 'opacity-70',
        )}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 gap-1 text-[10px] uppercase tracking-wide',
              EXTERNAL_MEETING_BADGE,
            )}
          >
            <UserRoundIcon className="size-3" aria-hidden />
            External
          </Badge>
          <span
            className={cn(
              'truncate text-sm font-medium',
              event.status === 'cancelled' && 'line-through',
              inactive && 'opacity-70',
            )}
          >
            {event.title}
          </span>
          {inactive && (
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 text-[10px]',
                EXTERNAL_MEETING_STATUS_STYLES[event.status],
              )}
            >
              {EXTERNAL_MEETING_STATUS_LABELS[event.status]}
            </Badge>
          )}
        </div>
        <p
          className={cn(
            'flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground',
            inactive && 'opacity-70',
          )}
        >
          <span className="shrink-0 font-medium text-foreground/80">
            {event.personName}
          </span>
          <span aria-hidden>·</span>
          <MeetingTypeLabel
            type={event.type}
            className="shrink-0 text-xs"
            iconClassName="size-3.5"
          />
          <span aria-hidden>·</span>
          <span className="shrink-0">{event.duration} min</span>
          {place && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{place}</span>
            </>
          )}
        </p>
        {team && (
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <UsersIcon className="size-3 shrink-0" />
            <span className="truncate">{team}</span>
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
