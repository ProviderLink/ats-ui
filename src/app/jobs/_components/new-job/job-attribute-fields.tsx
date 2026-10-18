import { Input } from '@/components/ui/input';
import {
  experienceLevelLabel,
  jobPriorityLabel,
  jobTypeLabel,
  locationTypeLabel,
} from '@/lib/job-format';
import type { JobFormState } from '../../_utils/job-form';
import { FormField } from './form-field';
import { LabelSelect } from './label-select';

interface JobAttributeFieldsProps {
  form: JobFormState;
  patch: (changes: Partial<JobFormState>) => void;
}

export function JobAttributeFields({ form, patch }: JobAttributeFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Job Type" required>
          <LabelSelect
            value={form.jobType}
            onChange={jobType => patch({ jobType })}
            options={jobTypeLabel}
          />
        </FormField>
        <FormField label="Location Type" required>
          <LabelSelect
            value={form.locationType}
            onChange={locationType => patch({ locationType })}
            options={locationTypeLabel}
          />
        </FormField>
      </div>

      <FormField label="Location">
        <Input
          placeholder="e.g. New York, NY (leave blank if remote)"
          value={form.location}
          onChange={e => patch({ location: e.target.value })}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Experience Level" required>
          <LabelSelect
            value={form.experienceLevel}
            onChange={experienceLevel => patch({ experienceLevel })}
            options={experienceLevelLabel}
          />
        </FormField>
        <FormField label="Priority">
          <LabelSelect
            value={form.priority}
            onChange={priority => patch({ priority })}
            options={jobPriorityLabel}
          />
        </FormField>
      </div>
    </>
  );
}
