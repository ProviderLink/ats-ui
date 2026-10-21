import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardCheckIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { ScorecardFormValues } from '../../_utils/scorecard-form';
import { CompensationField } from './compensation-field';
import { ScorecardField } from './scorecard-field';
import { SectionCard } from './section-card';

export function NotesSection() {
  const { register } = useFormContext<ScorecardFormValues>();

  return (
    <SectionCard
      id="sc-wrapup"
      icon={ClipboardCheckIcon}
      title="Wrap-up"
      subtitle="Overall impressions and logistics"
    >
      <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
        <ScorecardField label="Strengths">
          <Textarea className="resize-none" rows={3} {...register('strengths')} />
        </ScorecardField>
        <ScorecardField label="Concerns">
          <Textarea className="resize-none" rows={3} {...register('concerns')} />
        </ScorecardField>
      </div>
      <ScorecardField label="General notes">
        <Textarea className="resize-none" rows={2} {...register('generalNotes')} />
      </ScorecardField>
      <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
        <ScorecardField label="Recommended position">
          <Input {...register('recommendedPosition')} />
        </ScorecardField>
        <ScorecardField label="Earliest start date">
          <Input type="date" {...register('earliestStartDate')} />
        </ScorecardField>
        <CompensationField />
      </div>
    </SectionCard>
  );
}
