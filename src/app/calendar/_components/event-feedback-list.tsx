import { Separator } from '@/components/ui/separator';
import { RECOMMENDATION_LABELS } from '@/lib/interview-styles';
import type { Interview } from '@/store/types';

interface EventFeedbackListProps {
  feedbacks: Interview['feedbacks'];
  interviewerNames: Record<string, string>;
}

export function EventFeedbackList({
  feedbacks,
  interviewerNames,
}: EventFeedbackListProps) {
  if (feedbacks.length === 0) return null;

  return (
    <>
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Feedback ({feedbacks.length})
      </p>
      {feedbacks.map(fb => (
        <div
          key={fb._id}
          className="rounded-md border px-3 py-2 flex flex-col gap-1"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              {interviewerNames[fb.interviewerId] ?? fb.interviewerId}
            </span>
            <span className="text-muted-foreground">
              {'★'.repeat(fb.rating)}
              {'☆'.repeat(5 - fb.rating)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{fb.notes}</p>
          <span className="text-[10px] text-muted-foreground/70">
            {RECOMMENDATION_LABELS[fb.recommendation]}
          </span>
        </div>
      ))}
    </>
  );
}
