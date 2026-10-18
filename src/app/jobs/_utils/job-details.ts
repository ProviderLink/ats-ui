import { splitBullets } from '@/lib/job-format';
import type { Job, PipelineTemplate } from '@/store';

export function normalizeBullets(items: string[] | undefined): string[] {
  if (!items?.length) return [];
  return items
    .flatMap(item => splitBullets(item))
    .filter(s => s.length > 1 || Number.isNaN(Number(s)));
}

/**
 * The template a job's pipeline came from. When `templateId` is missing but
 * stages exist, match by comparing the job's stage ids to each template's
 * active stage ids.
 */
export function resolveCurrentTemplateId(
  job: Job,
  templates: PipelineTemplate[]
): string | null | undefined {
  if (job.pipeline?.templateId) return job.pipeline.templateId;
  const stages = job.pipeline?.stages;
  if (!stages?.length) return null;
  const jobStageIds = new Set(stages.map(s => s._id));
  return templates.find(t => {
    const templateStageIds = new Set(
      t.stages.filter(s => s.isActive).map(s => s._id)
    );
    return (
      templateStageIds.size === jobStageIds.size &&
      [...templateStageIds].every(id => jobStageIds.has(id))
    );
  })?._id;
}
