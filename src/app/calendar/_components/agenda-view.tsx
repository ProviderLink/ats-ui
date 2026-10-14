import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/slices/users.store';
import type { Interview, InterviewStatus, InterviewType } from '@/store/types';
import { CalendarIcon, UsersIcon, VideoIcon } from 'lucide-react';
import { useMemo } from 'react';
import {
  formatDateLabel,
  getInterviewDate,
  getInterviewEndTime,
  getInterviewStartTime,
  getMeetingLocation,
  toISO,
} from '../_utils/calendar-helpers';

const TYPE_ACCENT: Record<InterviewType, string> = {
  zoom: 'bg-primary',
  google_meet: 'bg-green-500',
  phone_call: 'bg-amber-500',
  in_person: 'bg-violet-500',
};

const TYPE_LABELS: Record<InterviewType, string> = {
  zoom: 'Zoom',
  google_meet: 'Google Meet',
  phone_call: 'Phone Call',
  in_person: 'In Person',
};

const STATUS_STYLES: Record<InterviewStatus, string> = {
  scheduled: 'text-primary border-primary/30',
  completed: 'text-green-600 border-green-500/30 dark:text-green-400',
  cancelled: 'text-destructive border-destructive/30',
  no_show: 'text-orange-600 border-orange-500/30 dark:text-orange-400',
};

interface AgendaViewProps {
  currentDate: Date;
  events: Interview[];
  onEventClick: (event: Interview) => void;
  onSlotClick?: (date: string) => void;
}

export function AgendaView({
  currentDate,
  events,
  onEventClick,
  onSlotClick: _onSlotClick,
}: AgendaViewProps) {
  const todayISO = toISO(new Date());

  // `interviewerIds` holds bare User ObjectIds; the API never sends display
  // names. Resolve them the same way `EventSheet` does, falling back to the id.
  const users = useUserStore(s => s.items);
  const interviewerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const u of users) map[u._id] = `${u.firstName} ${u.lastName}`;
    return map;
  }, [users]);

  const startISO = (() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return toISO(d);
  })();
  const endISO = (() => {
    const d = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    return toISO(d);
  })();

  const grouped = new Map<string, Interview[]>();
  events
    .filter(e => {
      const d = getInterviewDate(e.scheduledAt, e.timezone);
      return d >= startISO && d <= endISO;
    })
    .forEach(e => {
      const d = getInterviewDate(e.scheduledAt, e.timezone);
      if (!grouped.has(d)) grouped.set(d, []);
      grouped.get(d)!.push(e);
    });

  const sortedDates = Array.from(grouped.keys()).sort();

  if (sortedDates.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <CalendarIcon className="size-8 opacity-30" />
          <p className="text-sm">No interviews this month</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto p-4 gap-5">
      {sortedDates.map(dateStr => {
        const dayEvents = (grouped.get(dateStr) ?? []).sort((a, b) =>
          getInterviewStartTime(a.scheduledAt, a.timezone).localeCompare(
            getInterviewStartTime(b.scheduledAt, b.timezone)
          )
        );
        const isToday = dateStr === todayISO;
        const { primary, secondary } = formatDateLabel(dateStr);

        return (
          <div key={dateStr} className="flex gap-4">
            <div className="w-24 shrink-0 pt-1">
              <p
                className={cn(
                  'text-xs font-semibold',
                  isToday ? 'text-primary' : 'text-foreground'
                )}
              >
                {isToday ? 'Today' : primary}
              </p>
              <p className="text-xs text-muted-foreground">{secondary}</p>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              {dayEvents.map(event => {
                const startTime = getInterviewStartTime(
                  event.scheduledAt,
                  event.timezone
                );
                const endTime = getInterviewEndTime(
                  event.scheduledAt,
                  event.duration,
                  event.timezone
                );
                // A raw meeting URL is long and unreadable in a card; the type
                // already says where it happens and the sheet holds the link.
                // Only show short, human-readable places (phone / address).
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
                    key={event._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onEventClick(event)}
                    onKeyDown={e => {
                      if (
                        e.target === e.currentTarget &&
                        (e.key === 'Enter' || e.key === ' ')
                      ) {
                        e.preventDefault();
                        onEventClick(event);
                      }
                    }}
                    className={cn(
                      'group flex w-full cursor-pointer items-stretch gap-3 text-left bg-card ring-1 ring-foreground/10 rounded-xl pl-3 pr-4 py-3 shadow-xs transition-shadow hover:shadow-sm',
                      inactive && 'opacity-70'
                    )}
                  >
                    <div className="flex w-14 shrink-0 flex-col text-xs tabular-nums">
                      <span className="font-medium text-foreground">
                        {startTime}
                      </span>
                      <span className="text-muted-foreground">{endTime}</span>
                    </div>

                    <span
                      aria-hidden
                      className={cn(
                        'w-0.5 shrink-0 self-stretch rounded-full',
                        TYPE_ACCENT[event.type]
                      )}
                    />

                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {event.title}
                        </span>
                        {inactive && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'shrink-0 text-[10px] capitalize',
                              STATUS_STYLES[event.status]
                            )}
                          >
                            {event.status === 'no_show'
                              ? 'No show'
                              : event.status}
                          </Badge>
                        )}
                      </div>
                      <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="shrink-0">
                          {TYPE_LABELS[event.type]}
                        </span>
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
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
