import { logOptimisticActivity } from '@/lib/activity';
import { useInterviewStore } from '@/store/slices/interviews.store';
import type { Interview, InterviewRecommendation } from '@/store/types';
import { useState } from 'react';

export interface FeedbackInput {
  rating: number;
  notes: string;
  recommendation: InterviewRecommendation;
}

type Action = 'feedback' | 'complete' | 'no_show' | 'cancel';

export function useEventActions(event: Interview) {
  const cancelInterview = useInterviewStore(s => s.cancel);
  const submitFeedback = useInterviewStore(s => s.submitFeedback);
  const updateInterview = useInterviewStore(s => s.update);
  const [busy, setBusy] = useState<Record<Action, boolean>>({
    feedback: false,
    complete: false,
    no_show: false,
    cancel: false,
  });

  async function run(action: Action, task: () => Promise<void>) {
    setBusy(b => ({ ...b, [action]: true }));
    try {
      await task();
      return true;
    } catch {
      // The store already toasts the failure.
      return false;
    } finally {
      setBusy(b => ({ ...b, [action]: false }));
    }
  }

  function logActivity(type: string, message: string) {
    logOptimisticActivity('application', event.applicationId, type, message);
  }

  return {
    busy,
    submitFeedback: (input: FeedbackInput) =>
      run('feedback', async () => {
        await submitFeedback(event._id, input, event.applicationId);
        logActivity(
          'interview_feedback_submitted',
          `Feedback submitted for: ${event.title}`
        );
      }),
    complete: () =>
      run('complete', async () => {
        await updateInterview(
          event._id,
          { status: 'completed' },
          event.applicationId
        );
        logActivity('interview_completed', `Interview completed: ${event.title}`);
      }),
    markNoShow: () =>
      run('no_show', async () => {
        await updateInterview(
          event._id,
          { status: 'no_show' },
          event.applicationId
        );
        logActivity(
          'interview_no_show',
          `Candidate did not show: ${event.title}`
        );
      }),
    cancel: () =>
      run('cancel', () => cancelInterview(event._id, event.applicationId)),
  };
}
