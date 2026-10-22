import { formatDate } from '@/lib/utils';
import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';

function Block({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-xs font-medium text-muted-foreground">{label}</h4>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || '—'}</dd>
    </div>
  );
}

export function ScorecardNotes({ sc }: { sc: InterviewScorecard }) {
  const hasNotes = sc.strengths || sc.concerns || sc.generalNotes;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Assessment
      </h3>
      <div className="flex flex-col gap-4 rounded-lg border p-4">
        {hasNotes && (
          <div className="flex flex-col gap-4">
            <Block label="Strengths" value={sc.strengths} />
            <Block label="Concerns" value={sc.concerns} />
            <Block label="General notes" value={sc.generalNotes} />
          </div>
        )}
        <dl
          className={
            hasNotes
              ? 'grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3'
              : 'grid grid-cols-1 gap-3 sm:grid-cols-3'
          }
        >
          <Fact label="Recommended position" value={sc.recommendedPosition} />
          <Fact
            label="Earliest start date"
            value={sc.earliestStartDate ? formatDate(sc.earliestStartDate) : ''}
          />
          <Fact
            label="Compensation expectation"
            value={sc.compensationExpectation}
          />
        </dl>
      </div>
    </section>
  );
}
