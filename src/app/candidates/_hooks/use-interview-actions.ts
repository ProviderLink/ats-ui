import { logOptimisticActivity } from '@/lib/activity';
import { withToast } from '@/lib/with-toast';
import { useInterviewStore } from '@/store/slices/interviews.store';
import type { Application, CreateFeedbackDto, Interview } from '@/store/types';
import { useState } from 'react';

export interface RescheduleTarget {
  _id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  /** IANA zone so the form shows/edits the wall clock in the same zone. */
  timezone?: string | null;
}

/** Complete / cancel / reschedule actions for the interviews in the sheet. */
export function useInterviewActions(
  activePipelineApp: Application | null,
  refreshInterviews: () => void
) {
  const cancelInterview = useInterviewStore(s => s.cancel);
  const completeAndFeedback = useInterviewStore(s => s.completeAndFeedback);
  const updateInterview = useInterviewStore(s => s.update);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleInterview, setRescheduleInterview] =
    useState<RescheduleTarget | null>(null);

  function logIfPipeline(action: string, message: string) {
    if (activePipelineApp) {
      logOptimisticActivity(
        'application',
        activePipelineApp._id,
        action,
        message
      );
    }
  }

  async function completeInterview(
    iv: Interview,
    id: string,
    data: CreateFeedbackDto
  ) {
    await withToast('Interview completed & feedback submitted', () =>
      completeAndFeedback(id, data, activePipelineApp?._id)
    );
    refreshInterviews();
    logIfPipeline('interview_completed', `Interview completed: ${iv.title}`);
  }

  async function cancelScheduledInterview(iv: Interview, id: string) {
    await withToast('Interview cancelled — notifications sent', () =>
      cancelInterview(id, activePipelineApp?._id)
    );
    refreshInterviews();
    logIfPipeline('interview_cancelled', `Interview cancelled: ${iv.title}`);
  }

  function startReschedule(iv: Interview) {
    setRescheduleInterview({
      _id: iv._id,
      title: iv.title,
      scheduledAt: iv.scheduledAt,
      duration: iv.duration,
      timezone: iv.timezone,
    });
    setRescheduleOpen(true);
  }

  function closeReschedule() {
    setRescheduleOpen(false);
    setRescheduleInterview(null);
  }

  async function confirmReschedule(data: { scheduledAt: string }) {
    if (!rescheduleInterview) return;
    await withToast('Interview updated — notifications sent', () =>
      updateInterview(
        rescheduleInterview._id,
        { scheduledAt: data.scheduledAt },
        activePipelineApp?._id
      )
    );
    refreshInterviews();
    logIfPipeline(
      'interview_updated',
      `Interview rescheduled: ${rescheduleInterview.title}`
    );
    closeReschedule();
  }

  return {
    rescheduleOpen,
    rescheduleInterview,
    completeInterview,
    cancelScheduledInterview,
    startReschedule,
    closeReschedule,
    confirmReschedule,
  };
}
