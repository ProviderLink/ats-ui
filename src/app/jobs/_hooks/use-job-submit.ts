import { logOptimisticActivity } from '@/lib/activity';
import type { CreateJobDto, Job, UpdateJobDto } from '@/store';
import { useJobStore } from '@/store';
import { toast } from 'sonner';
import { buildJobDto, type JobFormState } from '../_utils/job-form';
import { clearAiNotesCache } from './use-job-ai';

export function useJobSubmit(
  form: JobFormState,
  job: Job | undefined,
  onDone: () => void
) {
  const create = useJobStore(s => s.create);
  const update = useJobStore(s => s.update);
  const mutating = useJobStore(s => s.mutating);
  const isEdit = !!job;

  async function submit() {
    const dto = buildJobDto(form);

    try {
      if (job) {
        const { clientId: _cid, ...updateDto } = dto;
        await update(job._id, updateDto as UpdateJobDto);
        logOptimisticActivity(
          'job',
          job._id,
          'updated',
          `Job "${dto.title}" updated`
        );
        toast.success('Job updated');
      } else {
        const created = await create(dto as CreateJobDto);
        logOptimisticActivity(
          'job',
          created._id,
          'created',
          `Job "${dto.title}" created`
        );
        toast.success('Job created');
        clearAiNotesCache();
      }
      onDone();
    } catch (e) {
      toast.error(
        (e as Error).message ||
          (isEdit ? 'Failed to update job' : 'Failed to create job')
      );
    }
  }

  return { submit, mutating };
}
