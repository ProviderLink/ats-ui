import { formatDate } from '@/lib/utils';
import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';

function NoteField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export function ScorecardNotes({ sc }: { sc: InterviewScorecard }) {
  return (
    <section className="flex flex-col gap-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Notes
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NoteField label="Strengths" value={sc.strengths} />
        <NoteField label="Concerns" value={sc.concerns} />
        <NoteField label="General notes" value={sc.generalNotes} />
        <NoteField label="Recommended position" value={sc.recommendedPosition} />
        <NoteField
          label="Earliest start date"
          value={sc.earliestStartDate ? formatDate(sc.earliestStartDate) : '—'}
        />
        <NoteField
          label="Compensation expectation"
          value={sc.compensationExpectation || '—'}
        />
      </div>
    </section>
  );
}
