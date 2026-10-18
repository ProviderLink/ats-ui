import type { Application, Client, Job } from '@/store/types';
import { useMemo } from 'react';

/** Per-candidate lookups derived from the shared application/job/client stores. */
export function useCandidateApplicationMaps(
  allApps: Application[],
  allJobs: Job[],
  allClients: Client[]
) {
  // candidateId → { jobTitle, clientName }[] for the Job column.
  //
  // Only live and hired applications count. A rejected application stays in the
  // database for history, so without this filter the column would keep showing
  // jobs the candidate was already rejected from — and after a job change it
  // would list the old job alongside the new one.
  const jobInfosByCandidateId = useMemo(() => {
    const jobById = new Map(allJobs.map(j => [j._id, j]));
    const clientNameById = new Map(allClients.map(c => [c._id, c.companyName]));
    const map = new Map<string, { jobTitle: string; clientName: string }[]>();
    for (const a of allApps) {
      if (a.phase === 'rejected') continue;
      const job = jobById.get(a.jobId);
      const title = job?.title ?? a.jobId;
      const clientName = job
        ? (clientNameById.get(job.clientId) ?? job.clientId)
        : '';
      const infos = map.get(a.candidateId) ?? [];
      if (!infos.some(i => i.jobTitle === title)) {
        infos.push({ jobTitle: title, clientName });
      }
      map.set(a.candidateId, infos);
    }
    return map;
  }, [allApps, allJobs, allClients]);

  // candidateId → { stageName, stageColor, assignedAt } for the Pipeline tab.
  // Only approved-phase applications count — rejected apps retain their last
  // currentStage for audit purposes but must not show in the pipeline tab.
  const stageInfoByCandidateId = useMemo(() => {
    const jobById = new Map(allJobs.map(j => [j._id, j]));
    const map = new Map<
      string,
      {
        stageName: string;
        stageColor: string;
        stageId: string;
        assignedAt: string;
        applicationId: string;
        stages: NonNullable<Job['pipeline']>['stages'];
      }
    >();
    for (const a of allApps) {
      const currentStage = a.currentStage;
      if (a.phase !== 'approved' || !currentStage || map.has(a.candidateId))
        continue;
      const job = jobById.get(a.jobId);
      const stage = job?.pipeline?.stages?.find(
        s => s._id === currentStage.stageId
      );
      map.set(a.candidateId, {
        stageName: currentStage.stageName,
        stageColor: stage?.color ?? '#3b82f6',
        stageId: currentStage.stageId,
        assignedAt: currentStage.assignedAt,
        applicationId: a._id,
        stages: job?.pipeline?.stages ?? [],
      });
    }
    return map;
  }, [allApps, allJobs]);

  // candidateId → pending application id (for the In Review tab's reject action).
  const pendingApplicationByCandidateId = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of allApps) {
      if (a.phase === 'pending' && !map.has(a.candidateId)) {
        map.set(a.candidateId, a._id);
      }
    }
    return map;
  }, [allApps]);

  /**
   * candidateId → id of ANY live application (pending or approved).
   *
   * Used to decide the reject endpoint. Keyed on phase rather than on having a
   * stage, because an approved application can have a null `currentStage` — and
   * routing that candidate to the candidate-level endpoint would be rejected
   * (they still hold a live application), producing a silent bulk failure.
   */
  const liveApplicationByCandidateId = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of allApps) {
      if (
        (a.phase === 'pending' || a.phase === 'approved') &&
        !map.has(a.candidateId)
      ) {
        map.set(a.candidateId, a._id);
      }
    }
    return map;
  }, [allApps]);

  return {
    jobInfosByCandidateId,
    stageInfoByCandidateId,
    pendingApplicationByCandidateId,
    liveApplicationByCandidateId,
  };
}
