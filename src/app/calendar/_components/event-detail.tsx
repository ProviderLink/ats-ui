import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Interview } from '@/store/types';
import { useState } from 'react';
import { useEventActions, type FeedbackInput } from '../_hooks/use-event-actions';
import { EventDetailInfo } from './event-detail-info';
import { EventFeedbackForm } from './event-feedback-form';
import { EventFeedbackList } from './event-feedback-list';

const EMPTY_FEEDBACK: FeedbackInput = {
  rating: 0,
  notes: '',
  recommendation: 'yes',
};

interface EventDetailProps {
  event: Interview;
  candidateName?: string;
  jobTitle?: string;
  interviewerNames: Record<string, string>;
  onEdit: () => void;
}

export function EventDetail({
  event,
  candidateName,
  jobTitle,
  interviewerNames,
  onEdit,
}: EventDetailProps) {
  const actions = useEventActions(event);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [draft, setDraft] = useState<FeedbackInput>(EMPTY_FEEDBACK);

  async function handleSubmitFeedback() {
    if (!draft.rating) return;
    if (await actions.submitFeedback(draft)) {
      setFeedbackOpen(false);
      setDraft(d => ({ ...d, rating: 0, notes: '' }));
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <EventDetailInfo
        event={event}
        candidateName={candidateName}
        jobTitle={jobTitle}
        interviewerNames={interviewerNames}
      />
      <EventFeedbackList
        feedbacks={event.feedbacks}
        interviewerNames={interviewerNames}
      />

      {feedbackOpen && (
        <EventFeedbackForm
          draft={draft}
          submitting={actions.busy.feedback}
          onDraftChange={setDraft}
          onSubmit={handleSubmitFeedback}
          onCancel={() => setFeedbackOpen(false)}
        />
      )}

      {event.status === 'scheduled' && (
        <>
          <Separator />
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFeedbackOpen(v => !v)}
            >
              Feedback
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={actions.complete}
              disabled={actions.busy.complete}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {actions.busy.complete ? 'Completing...' : 'Mark as Complete'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={actions.markNoShow}
              disabled={actions.busy.no_show}
              className="text-warning border-warning/40 hover:bg-warning/10"
            >
              {actions.busy.no_show ? 'Saving...' : 'No Show'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={actions.cancel}
              disabled={actions.busy.cancel}
            >
              {actions.busy.cancel ? 'Cancelling...' : 'Cancel Interview'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
