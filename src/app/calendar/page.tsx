import { Skeleton } from '@/components/ui/skeleton';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useInterviewStore } from '@/store/slices/interviews.store';
import type { Interview, InterviewStatus } from '@/store/types';
import { useCallback, useEffect, useState } from 'react';
import { AgendaView } from './_components/agenda-view';
import {
  CalendarHeader,
  type CalendarView,
} from './_components/calendar-header';
import { EventSheet } from './_components/event-sheet';
import { MonthView } from './_components/month-view';
import { WeekView } from './_components/week-view';
import { toISO } from './_utils/calendar-helpers';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Interview | null>(null);
  const [newEventDate, setNewEventDate] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | 'all'>(
    'all'
  );

  const interviews = useInterviewStore(s => s.items);
  const loading = useInterviewStore(s => s.loading);
  const fetchInterviews = useInterviewStore(s => s.fetch);

  useSocketRoom('interviews');

  const loadInterviews = useCallback(() => {
    const params: Record<string, unknown> = { limit: 200 };
    if (statusFilter !== 'all') params.status = statusFilter;
    fetchInterviews(params as Parameters<typeof fetchInterviews>[0]);
  }, [fetchInterviews, statusFilter]);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  function handlePrev() {
    setCurrentDate(d => {
      const next = new Date(d);
      if (view === 'week') next.setDate(d.getDate() - 7);
      else next.setMonth(d.getMonth() - 1);
      return next;
    });
  }

  function handleNext() {
    setCurrentDate(d => {
      const next = new Date(d);
      if (view === 'week') next.setDate(d.getDate() + 7);
      else next.setMonth(d.getMonth() + 1);
      return next;
    });
  }

  function openEventDetail(event: Interview) {
    setSelectedEvent(event);
    setNewEventDate(undefined);
    setSheetOpen(true);
  }

  function openCreateEvent(date?: string) {
    setSelectedEvent(null);
    setNewEventDate(date ?? toISO(new Date()));
    setSheetOpen(true);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden min-h-0">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        statusFilter={statusFilter}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={() => setCurrentDate(new Date())}
        onViewChange={setView}
        onStatusFilterChange={setStatusFilter}
        onNewEvent={() => openCreateEvent()}
      />

      <div className="flex flex-col flex-1 rounded-xl ring-1 ring-foreground/10 bg-card shadow-xs overflow-hidden min-h-0">
        {loading && interviews.length === 0 ? (
          <div className="flex flex-col flex-1 p-4 gap-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-full w-full" />
          </div>
        ) : view === 'month' ? (
          <MonthView
            currentDate={currentDate}
            events={interviews}
            onEventClick={openEventDetail}
            onSlotClick={date => openCreateEvent(date)}
          />
        ) : view === 'week' ? (
          <WeekView
            currentDate={currentDate}
            events={interviews}
            onEventClick={openEventDetail}
            onSlotClick={date => openCreateEvent(date)}
          />
        ) : (
          <AgendaView
            currentDate={currentDate}
            events={interviews}
            onEventClick={openEventDetail}
            onSlotClick={date => openCreateEvent(date)}
          />
        )}
      </div>

      <EventSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        event={selectedEvent}
        defaultDate={newEventDate}
        onMutate={loadInterviews}
      />
    </div>
  );
}
