import type { Application, Candidate, Client, Job } from '@/store/types';

export interface HireInfo {
  jobTitle: string;
  clientName: string;
  hiredAt: string;
}

export interface OtherActivity {
  inPipeline: number;
  inTalentPool: boolean;
}

/** candidateId -> every job the candidate was hired for, newest first. */
export function buildHireInfo(
  apps: Application[],
  jobs: Job[],
  clients: Client[]
): Map<string, HireInfo[]> {
  const jobById = new Map(jobs.map(j => [j._id, j]));
  const clientNameById = new Map(clients.map(c => [c._id, c.companyName]));
  const map = new Map<string, HireInfo[]>();
  for (const a of apps) {
    if (a.phase !== 'hired') continue;
    const job = jobById.get(a.jobId);
    const infos = map.get(a.candidateId) ?? [];
    infos.push({
      jobTitle: job?.title ?? a.jobId,
      clientName: job ? (clientNameById.get(job.clientId) ?? '') : '',
      hiredAt: a.hiredAt ?? a.createdAt,
    });
    map.set(a.candidateId, infos);
  }
  return map;
}

/**
 * candidateId -> active pipeline apps + talent pool flag, so a hired
 * candidate's additional jobs stay visible without leaving the Hired list.
 */
export function buildOtherActivity(
  apps: Application[],
  candidates: Candidate[]
): Map<string, OtherActivity> {
  const map = new Map<string, OtherActivity>();
  for (const a of apps) {
    if (a.phase !== 'approved') continue;
    const e = map.get(a.candidateId) ?? { inPipeline: 0, inTalentPool: false };
    e.inPipeline++;
    map.set(a.candidateId, e);
  }
  for (const c of candidates) {
    const e = map.get(c._id);
    if (e) e.inTalentPool = c.inTalentPool;
  }
  return map;
}

export function filterHired(
  candidates: Candidate[],
  hireInfo: Map<string, HireInfo[]>,
  query: string,
  tagFilter: string[]
): Candidate[] {
  let result = candidates.filter(c => hireInfo.has(c._id));

  const q = query.trim().toLowerCase();
  if (q) {
    result = result.filter(c => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      if (fullName.includes(q)) return true;
      if (c.email?.toLowerCase().includes(q)) return true;
      if (c.phone?.toLowerCase().includes(q)) return true;
      return (c.parsedData?.skills ?? []).join(' ').toLowerCase().includes(q);
    });
  }

  if (tagFilter.length > 0) {
    result = result.filter(c =>
      c.tags?.some(t => {
        const tagId = typeof t === 'string' ? t : (t as { _id: string })?._id;
        return tagId && tagFilter.includes(tagId);
      })
    );
  }

  return result;
}
