import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/store/types';
import {
  getEventsOnDate,
  getWeekStart,
  toISO,
  WEEKDAY_LABELS,
} from '../_utils/calendar-helpers';
import { EventCard } from './event-card';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
  const weekStart = getWeekStart(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  function isToday(date: Date) {
    return date.getTime() === today.getTime();
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      <div className="grid grid-cols-7 border-b bg-muted/30 shrink-0">
        {days.map((day, i) => (
          <div
            key={i}
            className="py-3 flex flex-col items-center gap-0.5 border-r last:border-r-0"
          >
            <span className="text-xs font-medium text-muted-foreground select-none">
              {WEEKDAY_LABELS[day.getDay()]}
            </span>
            <span
              className={cn(
                'text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full',
                isToday(day) && 'bg-primary text-primary-foreground'
              )}
            >
              {day.getDate()}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 divide-x overflow-auto">
        {days.map((day, i) => {
          const dayEvents = getEventsOnDate(events, toISO(day));
          return (
            <div
              key={i}
              className={cn(
                'p-1.5 flex flex-col gap-1 overflow-y-auto',
                isToday(day) && 'bg-primary/10 dark:bg-primary/5'
              )}
            >
              {dayEvents.length === 0 ? (
                <div className="flex items-center justify-center h-16 text-muted-foreground/30 text-xs select-none">
                  —
                </div>
              ) : (
                dayEvents.map(e => (
                  <EventCard key={e._id} event={e} onClick={onEventClick} />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
