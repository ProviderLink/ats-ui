import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { INTERVIEW_STATUS_LABELS } from '@/lib/interview-styles';
import type { InterviewStatus } from '@/store/types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  PlusIcon,
} from 'lucide-react';
import { getWeekStart } from '../_utils/calendar-helpers';

export type CalendarView = 'month' | 'week' | 'agenda';

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'agenda', label: 'Agenda' },
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getTitle(date: Date, view: CalendarView): string {
  if (view === 'week') {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    if (start.getMonth() === end.getMonth()) {
      return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  statusFilter: InterviewStatus | 'all';
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
  onStatusFilterChange: (status: InterviewStatus | 'all') => void;
  onNewEvent: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  statusFilter,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  onStatusFilterChange,
  onNewEvent,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 shrink-0 flex-wrap">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onPrev}
            aria-label="Previous"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onNext}
            aria-label="Next"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <h2 className="text-base font-semibold min-w-44">
          {getTitle(currentDate, view)}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={v => onStatusFilterChange(v as InterviewStatus | 'all')}
        >
          <SelectTrigger className="h-8 w-36 text-xs">
            <FilterIcon className="size-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(INTERVIEW_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToggleGroup
          type="single"
          value={view}
          onValueChange={v => v && onViewChange(v as CalendarView)}
          className="hidden sm:flex"
        >
          {VIEW_OPTIONS.map(({ value, label }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="text-xs px-3 h-8 rounded-md"
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Button size="sm" onClick={onNewEvent}>
          <PlusIcon className="size-4" />
          New Event
        </Button>
      </div>
    </div>
  );
}
