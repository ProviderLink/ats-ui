import { Input } from '@/components/ui/input';
import type { JobFormState } from '../../_utils/job-form';
import { FormField } from './form-field';
import { LabelSelect } from './label-select';

const SALARY_PERIODS: Record<string, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  bi_weekly: 'Bi-Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

interface ScheduleCompensationFieldsProps {
  form: JobFormState;
  patch: (changes: Partial<JobFormState>) => void;
}

export function ScheduleCompensationFields({
  form,
  patch,
}: ScheduleCompensationFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Openings">
          <Input
            type="number"
            min={1}
            placeholder="1"
            value={form.openings}
            onChange={e => patch({ openings: e.target.value })}
          />
        </FormField>
        <FormField label="Application Deadline">
          <Input
            type="date"
            value={form.applicationDeadline}
            onChange={e => patch({ applicationDeadline: e.target.value })}
          />
        </FormField>
      </div>

      <FormField label="Start Date">
        <Input
          type="date"
          value={form.startDate}
          onChange={e => patch({ startDate: e.target.value })}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Min Salary">
          <Input
            type="number"
            placeholder="e.g. 80000"
            value={form.salaryMin}
            onChange={e => patch({ salaryMin: e.target.value })}
          />
        </FormField>
        <FormField label="Max Salary">
          <Input
            type="number"
            placeholder="e.g. 110000"
            value={form.salaryMax}
            onChange={e => patch({ salaryMax: e.target.value })}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Currency">
          <Input
            placeholder="USD"
            value={form.currency}
            onChange={e => patch({ currency: e.target.value })}
          />
        </FormField>
        <FormField label="Salary Period">
          <LabelSelect
            value={form.salaryPeriod}
            onChange={salaryPeriod => patch({ salaryPeriod })}
            options={SALARY_PERIODS}
          />
        </FormField>
      </div>
    </>
  );
}
