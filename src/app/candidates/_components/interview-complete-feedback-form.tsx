import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { InterviewRecommendation } from '@/store/types';
import { CalendarIcon, CheckCircle2Icon, Loader2Icon, StarIcon, XCircleIcon } from 'lucide-react';
import { useState } from 'react';

export function InterviewCompleteFeedbackForm({
  interviewId,
  onComplete,
  onReschedule,
  onCancel,
}: {
  interviewId: string;
  onComplete: (
    id: string,
    data: {
      rating: number;
      notes: string;
      recommendation: InterviewRecommendation;
    }
  ) => Promise<void>;
  onReschedule: () => void;
  onCancel: (id: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<'buttons' | 'feedback'>('buttons');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] =
    useState<InterviewRecommendation>('yes');
  const [submitting, setSubmitting] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  if (mode === 'feedback') {
    return (
      <div className="rounded-md border p-3 flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Complete & Feedback
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 text-[10px] px-1.5 text-muted-foreground"
            onClick={() => setMode('buttons')}
          >
            Cancel
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground w-12 shrink-0">
            Rating
          </span>
          <div
            role="group"
            aria-label="Interview rating"
            className="flex items-center gap-0.5"
          >
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className="text-sm"
                aria-label={`${i} of 5 stars`}
                aria-pressed={i === rating}
              >
                <StarIcon
                  className={cn(
                    'size-4',
                    i <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground w-12 shrink-0">
            Decision
          </span>
          <Select
            value={recommendation}
            onValueChange={setRecommendation as (v: string) => void}
          >
            <SelectTrigger className="h-7 text-[10px] flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strong_yes">Strong Yes</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="strong_no">Strong No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          placeholder="Feedback notes…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="text-xs h-16 resize-none"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            className="h-7 text-[11px] px-3"
            disabled={!rating || submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onComplete(interviewId, {
                  rating,
                  notes,
                  recommendation,
                });
                setRating(0);
                setNotes('');
                setMode('buttons');
              } catch {
                // toast handled by store
                setMode('buttons');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting && <Loader2Icon className="size-3 mr-1 animate-spin" />}
            Submit & Complete
          </Button>
        </div>
      </div>
    );
  }

  if (cancelConfirm) {
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <Button
          size="sm"
          variant="destructive"
          className="h-6 text-[10px] px-2"
          onClick={async () => {
            setCancelConfirm(false);
            await onCancel(interviewId);
          }}
        >
          Confirm Cancel
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] px-2"
          onClick={() => setCancelConfirm(false)}
        >
          Keep
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 mt-1 flex-wrap">
      <Button
        size="sm"
        className="h-7 text-[11px] px-2.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => setMode('feedback')}
      >
        <CheckCircle2Icon className="size-3.5" />
        Complete & Feedback
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-[11px] px-2.5 gap-1.5"
        onClick={onReschedule}
      >
        <CalendarIcon className="size-3.5" />
        Reschedule
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-[11px] px-2.5 gap-1.5 text-muted-foreground hover:text-destructive"
        onClick={() => setCancelConfirm(true)}
      >
        <XCircleIcon className="size-3.5" />
        Cancel
      </Button>
    </div>
  );
}
