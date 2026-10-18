import { ScheduleInterviewDialog } from '@/components/schedule-interview-dialog';
import type { ScheduleInterviewInput } from '@/components/schedule-interview/schedule-interview-types';
import { getZonedDate, getZonedTime } from '@/lib/timezones';
import { useInterviewStore } from '@/store/slices/interviews.store';
import type { Interview, Job } from '@/store/types';
import { useState } from 'react';
import { toast } from 'sonner';
import { resolveScheduleInput } from '../_utils/resolve-schedule-input';
import { withToast } from '@/lib/with-toast';

interface EditEventDialogProps {
  event: Interview;
  candidateName?: string;
  job: Job | null;
  jobs: { _id: string; title: string }[];
  users: { _id: string; firstName: string; lastName: string }[];
  timezone: string;
  defaultDate: string;
  onSaved: () => void;
  onClose: () => void;
}

export function EditEventDialog({
  event,
  candidateName,
  job,
  jobs,
  users,
  timezone,
  defaultDate,
  onSaved,
  onClose,
}: EditEventDialogProps) {
  const updateInterview = useInterviewStore(s => s.update);
  const [saving, setSaving] = useState(false);

  async function handleEdit(data: ScheduleInterviewInput) {
    const resolved = resolveScheduleInput(data, timezone);
    if (resolved.error !== undefined) {
      toast.error(resolved.error);
      return;
    }

    setSaving(true);
    try {
      await withToast('Interview updated — notifications sent', () =>
        updateInterview(
        event._id,
        {
          title: data.title,
          type: resolved.type,
          scheduledAt: resolved.scheduledAt,
          duration: data.duration,
          interviewerIds: data.interviewerIds,
          meetingDetails: resolved.meetingDetails,
        },
        event.applicationId
        )
      );
      onSaved();
    } catch {
      // withToast already reported the failure.
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScheduleInterviewDialog
      open
      mode="edit"
      onClose={onClose}
      loading={saving}
      candidateName={candidateName ?? ''}
      job={job}
      jobs={jobs}
      users={users}
      defaultDate={defaultDate}
      initial={{
        title: event.title,
        type: event.type,
        date: getZonedDate(event.scheduledAt, event.timezone),
        time: getZonedTime(event.scheduledAt, event.timezone),
        duration: event.duration,
        meetingLink: event.meetingDetails?.link ?? '',
        phoneNumber: event.meetingDetails?.phoneNumber ?? '',
        address: event.meetingDetails?.address ?? '',
        interviewerIds: event.interviewerIds,
      }}
      onConfirm={handleEdit}
    />
  );
}
