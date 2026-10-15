import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RECOMMENDATION_LABELS } from '@/lib/interview-styles';
import { cn } from '@/lib/utils';
import type { InterviewRecommendation } from '@/store/types';
import { StarIcon } from 'lucide-react';
import type { FeedbackInput } from '../_hooks/use-event-actions';

interface EventFeedbackFormProps {
  draft: FeedbackInput;
  submitting: boolean;
  onDraftChange: (draft: FeedbackInput) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function EventFeedbackForm({
  draft,
  submitting,
  onDraftChange,
  onSubmit,
  onCancel,
}: EventFeedbackFormProps) {
  return (
    <div className="rounded-md border p-3 flex flex-col gap-3">
      <p className="text-xs font-semibold">Submit Feedback</p>
      <div
        role="group"
        aria-label="Interview rating"
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onDraftChange({ ...draft, rating: i })}
            className="text-lg"
            aria-label={`${i} of 5 stars`}
            aria-pressed={i === draft.rating}
          >
            <StarIcon
              className={cn(
                'size-5',
                i <= draft.rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30'
              )}
            />
          </button>
        ))}
      </div>
      <Select
        value={draft.recommendation}
        onValueChange={v =>
          onDraftChange({
            ...draft,
            recommendation: v as InterviewRecommendation,
          })
        }
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(RECOMMENDATION_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        placeholder="Notes..."
        value={draft.notes}
        onChange={e => onDraftChange({ ...draft, notes: e.target.value })}
        className="text-xs"
        rows={2}
      />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!draft.rating || submitting}
        >
          {submitting ? 'Sending...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}
