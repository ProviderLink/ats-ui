import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFormContext } from 'react-hook-form';
import type { ScorecardFormValues } from '../../_utils/scorecard-form';
import { ScorecardField } from './scorecard-field';

export function NotesSection() {
  const { register } = useFormContext<ScorecardFormValues>();

  return (
    <section className="flex flex-col gap-3">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Notes
      </Label>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ScorecardField label="Strengths">
          <Textarea
            className="resize-none"
            rows={2}
            {...register('strengths')}
          />
        </ScorecardField>
        <ScorecardField label="Concerns">
          <Textarea
            className="resize-none"
            rows={2}
            {...register('concerns')}
          />
        </ScorecardField>
        <ScorecardField label="General notes">
          <Textarea
            className="resize-none"
            rows={2}
            {...register('generalNotes')}
          />
        </ScorecardField>
        <ScorecardField label="Recommended position">
          <Input {...register('recommendedPosition')} />
        </ScorecardField>
        <ScorecardField label="Earliest start date">
          <Input type="date" {...register('earliestStartDate')} />
        </ScorecardField>
        <ScorecardField label="Compensation expectation">
          <Input {...register('compensationExpectation')} />
        </ScorecardField>
      </div>
    </section>
  );
}
