import { usePipelineTemplateStore } from '@/store';
import type { Job } from '@/store';
import { useCallback, useEffect, useState } from 'react';
import { initialJobForm, type JobFormState } from '../_utils/job-form';

export function useJobFormState(open: boolean, job?: Job) {
  const pipelineTemplates = usePipelineTemplateStore(s => s.items);

  const activePipelines = pipelineTemplates.filter(p => p.isActive);
  const defaultPipelineId =
    activePipelines.find(p => p.isDefault)?._id ??
    activePipelines[0]?._id ??
    '';

  const [form, setForm] = useState<JobFormState>(() =>
    initialJobForm(job, defaultPipelineId)
  );

  const patch = useCallback(
    (changes: Partial<JobFormState>) =>
      setForm(prev => ({ ...prev, ...changes })),
    []
  );

  useEffect(() => {
    if (!open) return;
    if (!form.pipelineId && defaultPipelineId) {
      patch({ pipelineId: defaultPipelineId });
    }
    // Only re-seed the default when the sheet opens or the default changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultPipelineId]);

  return { form, patch, activePipelines };
}
