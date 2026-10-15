import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/slices/users.store';
import type { Interview } from '@/store/types';
import { CalendarIcon } from 'lucide-react';
import { useMemo } from 'react';
import {
  formatDateLabel,
  getInterviewDate,
  sortByStartTime,
  toISO,
} from '../_utils/calendar-helpers';
import { AgendaEventCard } from './agenda-event-card';

interface AgendaViewProps {
  currentDate: Date;
  events: Interview[];
  onEventClick: (event: Interview) => void;
}

export function AgendaView({
  currentDate,
  events,
  onEventClick,
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startISO = toISO(new Date(year, month, 1));
  const endISO = toISO(new Date(year, month + 1, 0));

  const grouped = new Map<string, Interview[]>();
  for (const e of events) {
    const d = getInterviewDate(e.scheduledAt, e.timezone);
    if (d < startISO || d > endISO) continue;
    grouped.set(d, [...(grouped.get(d) ?? []), e]);
  }

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
              {sortByStartTime(grouped.get(dateStr) ?? []).map(event => (
                <AgendaEventCard
                  key={event._id}
                  event={event}
                  interviewerNames={interviewerNames}
                  onClick={onEventClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
