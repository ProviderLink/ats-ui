import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/slices/users.store';
import type { Interview, InterviewStatus, InterviewType } from '@/store/types';
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { useMemo } from 'react';
import {
  formatDateLabel,
  getInterviewDate,
  getInterviewEndTime,
  getInterviewStartTime,
  getMeetingLocation,
  toISO,
} from '../_utils/calendar-helpers';

const TYPE_STYLES: Record<InterviewType, string> = {
  zoom: 'bg-primary/10 text-primary border-primary/20',
  google_meet:
    'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400',
  phone_call:
    'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
  in_person:
    'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400',
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
                const location = getMeetingLocation(event);
                return (
                  <button
                    key={event._id}
                    onClick={() => onEventClick(event)}
                    className="text-left bg-card ring-1 ring-foreground/10 rounded-xl px-4 py-3 shadow-xs hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              'text-xs px-1.5 py-0.5 rounded border font-medium',
                              TYPE_STYLES[event.type]
                            )}
                          >
                            {TYPE_LABELS[event.type]}
                          </span>
                          {event.status !== 'scheduled' && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                STATUS_STYLES[event.status]
                              )}
                            >
                              {event.status === 'no_show'
                                ? 'No Show'
                                : event.status}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium truncate">
                          {event.title}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="size-3" />
                          {startTime} – {endTime}
                        </span>
                        {location && (
                          <span className="flex items-center gap-1 max-w-32 truncate">
                            <MapPinIcon className="size-3 shrink-0" />
                            {location}
                          </span>
                        )}
                      </div>
                    </div>

                    {event.interviewerIds.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <UsersIcon className="size-3 shrink-0" />
                        <span className="truncate">
                          {(
                            event.interviewerNames ??
                            event.interviewerIds.map(
                              id => interviewerNames[id] ?? id
                            )
                          ).join(', ')}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
