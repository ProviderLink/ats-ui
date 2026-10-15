import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Interview } from '@/store/types';
import {
  getEventsOnDate,
  toISO,
  WEEKDAY_LABELS,
} from '../_utils/calendar-helpers';
import { EventCard } from './event-card';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

interface MonthViewProps {
  currentDate: Date;
  events: Interview[];
  onEventClick: (event: Interview) => void;
}

export function MonthView({
  currentDate,
  events,
  onEventClick,
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
        {WEEKDAY_LABELS.map(d => (
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
          // The API returns `scheduledAt: -1`; sorted so a cell's first three are the earliest.
          const dayEvents = getEventsOnDate(events, toISO(date));
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
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="text-xs text-left text-muted-foreground/70 px-1.5 hover:text-foreground hover:underline"
                    >
                      +{more} more
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-2">
                    <div className="text-xs font-medium text-muted-foreground px-1 pb-1.5">
                      {date.toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                      {dayEvents.map(e => (
                        <EventCard
                          key={e._id}
                          event={e}
                          onClick={onEventClick}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
