import { cn } from '@/lib/utils';
import type { Interview } from '@/store/types';
import { getInterviewDate, toISO } from '../_utils/calendar-helpers';
import { EventCard } from './event-card';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

interface MonthViewProps {
  currentDate: Date;
  events: Interview[];
  onEventClick: (event: Interview) => void;
  onSlotClick?: (date: string) => void;
}

export function MonthView({
  currentDate,
  events,
  onEventClick,
  onSlotClick,
}: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekDay = new Date(year, month, 1).getDay();
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  type Cell = { date: Date; current: boolean };
  const cells: Cell[] = [];

  for (let i = firstWeekDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      current: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, nextDay++), current: false });
  }

  function eventsFor(date: Date) {
    const iso = toISO(date);
    return events.filter(
      e => getInterviewDate(e.scheduledAt, e.timezone) === iso
    );
  }

  function isToday(date: Date) {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      <div className="grid grid-cols-7 border-b bg-muted/30 shrink-0">
        {WEEK_DAYS.map(d => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-muted-foreground select-none"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6 flex-1 overflow-auto">
        {cells.map(({ date, current }, idx) => {
          const dayEvents = eventsFor(date);
          const visible = dayEvents.slice(0, 3);
          const more = dayEvents.length - visible.length;

          return (
            <div
              key={idx}
              className={cn(
                'border-b border-r p-1.5 flex flex-col gap-0.5 min-h-20',
                !current && 'bg-muted/20',
                idx % 7 === 6 && 'border-r-0'
              )}
              onClick={() => {
                if (dayEvents.length === 0 && onSlotClick) {
                  onSlotClick(toISO(date));
                }
              }}
              role={
                dayEvents.length === 0 && onSlotClick ? 'button' : undefined
              }
            >
              <span
                className={cn(
                  'text-xs font-medium self-start w-6 h-6 flex items-center justify-center rounded-full select-none mb-0.5',
                  !current && 'text-muted-foreground/40',
                  isToday(date) &&
                    'bg-primary text-primary-foreground font-semibold'
                )}
              >
                {date.getDate()}
              </span>

              {visible.map(e => (
                <EventCard
                  key={e._id}
                  event={e}
                  onClick={onEventClick}
                  compact
                />
              ))}
              {more > 0 && (
                <span className="text-xs text-muted-foreground/70 px-1.5 cursor-default">
                  +{more} more
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
