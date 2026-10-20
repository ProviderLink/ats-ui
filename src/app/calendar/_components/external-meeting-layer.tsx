import { useInterviewerOptions } from '@/hooks/use-interviewer-options';
import { DEFAULT_TIMEZONE } from '@/lib/timezones';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import type { ExternalMeeting } from '@/store/types';
import { useEffect, useMemo } from 'react';
import { toISO } from '../_utils/calendar-helpers';
import { ExternalEventSheet } from './external-event-sheet';
import { ExternalMeetingDialog } from './external-meeting-dialog';

export type ExternalDialogState =
  | { mode: 'create'; date: string }
  | { mode: 'edit'; event: ExternalMeeting }
  | null;

interface ExternalMeetingLayerProps {
  /** Meeting whose detail sheet is open, or null. */
  selected: ExternalMeeting | null;
  onSelectedChange: (event: ExternalMeeting | null) => void;
  dialog: ExternalDialogState;
  onDialogChange: (state: ExternalDialogState) => void;
  onMutate: () => void;
}

/**
 * Detail sheet + create/edit dialog for external meetings. Lives beside
 * `EventSheet` so the interview flow is untouched.
 */
export function ExternalMeetingLayer({
  selected,
  onSelectedChange,
  dialog,
  onDialogChange,
  onMutate,
}: ExternalMeetingLayerProps) {
  const needsPeople = dialog !== null;
  const { interviewers } = useInterviewerOptions(needsPeople);
  const jobs = useJobStore(s => s.items);
  const clients = useClientStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const settings = useSettingsStore(s => s.settings);
  const timezone = settings?.companyTimezone || DEFAULT_TIMEZONE;

  useEffect(() => {
    if (needsPeople && jobs.length === 0) fetchJobs({ limit: 200 });
  }, [needsPeople, jobs.length, fetchJobs]);

  const jobOptions = useMemo(() => {
    const clientNames = new Map(clients.map(c => [c._id, c.companyName]));
    return jobs
      .filter(j => j.status === 'open')
      .map(j => ({
        title: j.title,
        clientName: clientNames.get(j.clientId) ?? null,
      }));
  }, [jobs, clients]);

  return (
    <>
      <ExternalEventSheet
        open={selected !== null && dialog === null}
        onOpenChange={v => !v && onSelectedChange(null)}
        event={selected}
        onEdit={() =>
          selected && onDialogChange({ mode: 'edit', event: selected })
        }
      />

      {dialog && (
        <ExternalMeetingDialog
          event={dialog.mode === 'edit' ? dialog.event : undefined}
          users={interviewers.map(u => ({
            _id: u._id,
            firstName: u.firstName,
            lastName: u.lastName,
          }))}
          jobOptions={jobOptions}
          timezone={timezone}
          defaultDate={
            dialog.mode === 'create' ? dialog.date : toISO(new Date())
          }
          onSaved={() => {
            onDialogChange(null);
            if (dialog.mode === 'create') onSelectedChange(null);
            onMutate();
          }}
          onClose={() => onDialogChange(null)}
        />
      )}
    </>
  );
}
