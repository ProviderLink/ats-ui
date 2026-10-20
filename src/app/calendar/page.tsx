import { Skeleton } from '@/components/ui/skeleton';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useExternalMeetingStore } from '@/store/slices/external-meetings.store';
import { useInterviewStore } from '@/store/slices/interviews.store';
import type {
  CalendarEvent,
  ExternalMeeting,
  Interview,
  InterviewFilters,
  InterviewStatus,
} from '@/store/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AgendaView } from './_components/agenda-view';
import {
  CalendarHeader,
  type CalendarView,
} from './_components/calendar-header';
import { EventSheet } from './_components/event-sheet';
import {
  ExternalMeetingLayer,
  type ExternalDialogState,
} from './_components/external-meeting-layer';
import { MonthView } from './_components/month-view';
import { WeekView } from './_components/week-view';
import { isExternalMeeting, toISO } from './_utils/calendar-helpers';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Interview | null>(null);
  const [newEventDate, setNewEventDate] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | 'all'>(
    'all'
  );

  const [selectedExternal, setSelectedExternal] =
    useState<ExternalMeeting | null>(null);
  const [externalDialog, setExternalDialog] =
    useState<ExternalDialogState>(null);

  const interviews = useInterviewStore(s => s.items);
  const loading = useInterviewStore(s => s.loading);
  const fetchInterviews = useInterviewStore(s => s.fetch);
  const externalMeetings = useExternalMeetingStore(s => s.items);
  const fetchExternal = useExternalMeetingStore(s => s.fetch);

  // Interviews and external meetings share the calendar grid. External meetings
  // have no "no show" state, so that filter shows interviews only.
  const events = useMemo<CalendarEvent[]>(
    () => [
      ...interviews,
      ...(statusFilter === 'no_show' ? [] : externalMeetings),
    ],
    [interviews, externalMeetings, statusFilter]
  );

  useSocketRoom('interviews');

  const loadInterviews = useCallback(() => {
    const params: InterviewFilters = { limit: 200 };
    if (statusFilter !== 'all') params.status = statusFilter;
    fetchInterviews(params);
    fetchExternal(
      statusFilter === 'all' || statusFilter === 'no_show'
        ? undefined
        : { status: statusFilter }
    );
  }, [fetchInterviews, fetchExternal, statusFilter]);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  function shiftDate(direction: 1 | -1) {
    setCurrentDate(d => {
      const next = new Date(d);
      if (view === 'week') next.setDate(d.getDate() + 7 * direction);
      else next.setMonth(d.getMonth() + direction);
      return next;
    });
  }

  function openEventDetail(event: CalendarEvent) {
    if (isExternalMeeting(event)) {
      setSelectedExternal(event);
      return;
    }
    setSelectedEvent(event as Interview);
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
        onPrev={() => shiftDate(-1)}
        onNext={() => shiftDate(1)}
        onToday={() => setCurrentDate(new Date())}
        onViewChange={setView}
        onStatusFilterChange={setStatusFilter}
        onNewEvent={() => openCreateEvent()}
        onNewExternalEvent={() =>
          setExternalDialog({ mode: 'create', date: toISO(new Date()) })
        }
      />

      <div className="flex flex-col flex-1 rounded-xl ring-1 ring-foreground/10 bg-card shadow-xs overflow-hidden min-h-0">
        {loading && events.length === 0 ? (
          <div className="flex flex-col flex-1 p-4 gap-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-full w-full" />
          </div>
        ) : view === 'month' ? (
          <MonthView
            currentDate={currentDate}
            events={events}
            onEventClick={openEventDetail}
          />
        ) : view === 'week' ? (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={openEventDetail}
          />
        ) : (
          <AgendaView
            currentDate={currentDate}
            events={events}
            onEventClick={openEventDetail}
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

      <ExternalMeetingLayer
        selected={selectedExternal}
        onSelectedChange={setSelectedExternal}
        dialog={externalDialog}
        onDialogChange={setExternalDialog}
        onMutate={loadInterviews}
      />
    </div>
  );
}
