import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useInterviewerOptions } from '@/hooks/use-interviewer-options';
import { DEFAULT_TIMEZONE } from '@/lib/timezones';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import type { Interview } from '@/store/types';
import { useEffect, useMemo, useState } from 'react';
import { getInterviewStartTime, toISO } from '../_utils/calendar-helpers';
import { CreateEventDialog } from './create-event-dialog';
import { EditEventDialog } from './edit-event-dialog';
import { EventDetail } from './event-detail';

interface EventSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: Interview | null;
  /** Day cell that was clicked, used to pre-fill the date. `YYYY-MM-DD`. */
  defaultDate?: string;
  onMutate: () => void;
}

export function EventSheet({
  open,
  onOpenChange,
  event,
  defaultDate,
  onMutate,
}: EventSheetProps) {
  const candidates = useCandidateStore(s => s.items);
  const fetchCandidates = useCandidateStore(s => s.fetch);
  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const applications = useApplicationStore(s => s.items);
  const fetchApplications = useApplicationStore(s => s.fetch);
  const settings = useSettingsStore(s => s.settings);
  // Scoped to ATS staff — the boot-loaded list also holds CRM-only accounts.
  // Gated on `open`: the calendar mounts this sheet permanently, so an
  // unconditional fetch would hit the API on every calendar visit. The detail
  // view prefers the backend-provided `interviewerNames` anyway.
  const { interviewers } = useInterviewerOptions(open);
  const users = useMemo(
    () =>
      interviewers.map(u => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
      })),
    [interviewers]
  );

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (open) {
      if (candidates.length === 0) fetchCandidates({ limit: 200 });
      if (jobs.length === 0) fetchJobs({ limit: 200 });
      if (applications.length === 0) fetchApplications({ limit: 9999 });
    }
  }, [open]);

  const timezone = settings?.companyTimezone || DEFAULT_TIMEZONE;

  const candidate = event
    ? candidates.find(c => c._id === event.candidateId)
    : undefined;
  const candidateName = candidate
    ? `${candidate.firstName} ${candidate.lastName}`
    : undefined;
  const job = event ? (jobs.find(j => j._id === event.jobId) ?? null) : null;

  const interviewerNames: Record<string, string> = {};
  for (const u of users) {
    interviewerNames[u._id] = `${u.firstName} ${u.lastName}`;
  }

  function close() {
    setEditing(false);
    onOpenChange(false);
  }

  // Create and edit share one scheduling dialog with the candidates table and
  // the detail sheet, so there is exactly one scheduling form in the product.
  if (open && !event) {
    return (
      <CreateEventDialog
        users={users}
        timezone={timezone}
        defaultDate={defaultDate ?? toISO(new Date())}
        onCreated={() => {
          onMutate();
          onOpenChange(false);
        }}
        onClose={close}
      />
    );
  }

  if (open && event && editing) {
    return (
      <EditEventDialog
        event={event}
        candidateName={candidateName}
        job={job}
        jobs={jobs
          .filter(j => j.status === 'open')
          .map(j => ({ _id: j._id, title: j.title }))}
        users={users}
        timezone={timezone}
        defaultDate={defaultDate ?? toISO(new Date())}
        onSaved={() => {
          setEditing(false);
          onMutate();
        }}
        onClose={close}
      />
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-xl md:max-w-2xl">
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle>{event?.title ?? 'Schedule Interview'}</SheetTitle>
          {event && (
            <SheetDescription>
              {getInterviewStartTime(event.scheduledAt, event.timezone)} ·{' '}
              {event.duration} min
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="pt-4 flex-1 overflow-y-auto">
          {event && (
            <EventDetail
              event={event}
              candidateName={candidateName}
              jobTitle={job?.title}
              interviewerNames={interviewerNames}
              onEdit={() => setEditing(true)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
