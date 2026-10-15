import type { Application, Candidate, Client, Job } from '@/store/types';
import { useCallback, useMemo } from 'react';
import type { CandidateTabValue } from '../_utils/candidate-tabs';

interface TabDataArgs {
  items: Candidate[];
  allApps: Application[];
  allJobs: Job[];
  allClients: Client[];
  activeTab: CandidateTabValue;
  jobIdFilter: string;
  query: string;
}

/** Tab membership, tab counts and the search/job-filtered rows for the table. */
export function useCandidateTabData({
  items,
  allApps,
  allJobs,
  allClients,
  activeTab,
  jobIdFilter,
  query,
}: TabDataArgs) {
  // Set of candidateIds who have at least one ACTIVE (approved-phase) application.
  // This is the source of truth for the "In Pipeline" tab — a candidate whose
  // only applications are rejected must not appear there even if their
  // candidate-level status hasn't been updated yet by the backend.
  const candidatesInPipelineIds = useMemo(
    () =>
      new Set(
        allApps.filter(a => a.phase === 'approved').map(a => a.candidateId)
      ),
    [allApps]
  );

  // Defensive fallback: if the application-store derived set is unexpectedly
  // empty while there are candidates with status 'approved' in the candidate
  // store, the application store has likely been corrupted by a lightweight
  // socket broadcast (e.g. triggered by a public apply).  Fall back to
  // candidate-level status so the Pipeline tab doesn't show zero.
  //
  // The fallback must never revive a candidate who has left the pipeline:
  // reject / remove-from-job leave `status` at 'approved', so anyone pooled,
  // banned, or who has application records at all is excluded.
  const pipelineIdsFallback = useMemo(() => {
    const withApplications = new Set(allApps.map(a => a.candidateId));
    return new Set(
      items
        .filter(
          c =>
            c.status === 'approved' &&
            !c.inTalentPool &&
            c.eligibilityStatus !== 'permanently_ineligible' &&
            !withApplications.has(c._id)
        )
        .map(c => c._id)
    );
  }, [items, allApps]);
  const effectivePipelineIds = useMemo(() => {
    if (candidatesInPipelineIds.size > 0) return candidatesInPipelineIds;
    if (pipelineIdsFallback.size > 0) return pipelineIdsFallback;
    return candidatesInPipelineIds;
  }, [candidatesInPipelineIds, pipelineIdsFallback]);

  // ── "In Review" membership ──────────────────────────────────────
  // A candidate is In Review when they are still pending AND not already
  // parked somewhere else. The flag exclusions are what make Reject and
  // "Add to Talent Pool" remove the row immediately: neither action changes
  // `status`, so without them the candidate would stay visible in this tab
  // with no remaining work to do.
  //
  // NOTE: public-apply candidates have NO application at this stage — the
  // application is only created at approval (see job.controller.ts). So this
  // rule must stay candidate-level; it cannot be application-derived.
  const isInReview = useCallback(
    (c: Candidate) =>
      c.status === 'pending' &&
      !c.inTalentPool &&
      c.eligibilityStatus !== 'permanently_ineligible',
    []
  );

  // candidateId → Set of jobIds the candidate is attached to, per tab.
  //  - In Review: the job they applied to (`appliedJobId`, set even though no
  //    application exists yet for public applies) plus any pending application.
  //  - In Pipeline: jobs with an approved (live) application.
  //  - Hired / other: any non-rejected application.
  // Used by both the ?jobId= filter and the job-title search so the two agree.
  const jobIdsForTab = useCallback(
    (c: Candidate, tab: string): Set<string> => {
      const ids = new Set<string>();
      for (const a of allApps) {
        if (a.candidateId !== c._id) continue;
        if (tab === 'pending') {
          if (a.phase === 'pending') ids.add(a.jobId);
        } else if (tab === 'approved') {
          if (a.phase === 'approved') ids.add(a.jobId);
        } else if (a.phase !== 'rejected') {
          ids.add(a.jobId);
        }
      }
      if (tab === 'pending' && c.appliedJobId) ids.add(c.appliedJobId);
      return ids;
    },
    [allApps]
  );

  // ── Tab counts derived from local data ──────────────────────────
  const counts = useMemo(() => {
    const inJob = (c: Candidate, tab: string) =>
      !jobIdFilter || jobIdsForTab(c, tab).has(jobIdFilter);
    return {
      pending: items.filter(c => isInReview(c) && inJob(c, 'pending')).length,
      approved: items.filter(
        c => effectivePipelineIds.has(c._id) && inJob(c, 'approved')
      ).length,
      hired: items.filter(c => c.status === 'hired' && inJob(c, 'hired'))
        .length,
    };
  }, [items, jobIdFilter, jobIdsForTab, effectivePipelineIds, isInReview]);

  // ── Client-side filtering by tab + search ────────────────────────
  // After boot, ALL candidates are in the store. We filter by activeTab
  // and search query locally — no server round-trip needed.
  const filteredData = useMemo(() => {
    // First filter by active tab
    let result = items.filter(c => {
      if (activeTab === 'approved') {
        return effectivePipelineIds.has(c._id);
      }
      if (activeTab === 'pending') {
        return isInReview(c);
      }
      return c.status === activeTab;
    });

    // Filter by job if jobId URL param is present
    if (jobIdFilter) {
      result = result.filter(c =>
        jobIdsForTab(c, activeTab).has(jobIdFilter)
      );
    }

    // Then apply search
    const q = query.trim().toLowerCase();
    if (q) {
      const jobById = new Map(allJobs.map(j => [j._id, j]));
      const clientNameById = new Map(
        allClients.map(c => [c._id, c.companyName])
      );
      result = result.filter(c => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        if (fullName.includes(q)) return true;
        if (c.email?.toLowerCase().includes(q)) return true;
        if (c.phone?.toLowerCase().includes(q)) return true;
        const skills = (c.parsedData?.skills ?? []).join(' ').toLowerCase();
        if (skills.includes(q)) return true;
        const exp = c.parsedData?.experience?.[0];
        if (exp?.title?.toLowerCase().includes(q)) return true;
        if (exp?.company?.toLowerCase().includes(q)) return true;
        for (const jobId of jobIdsForTab(c, activeTab)) {
          const job = jobById.get(jobId);
          if (!job) continue;
          if (job.title?.toLowerCase().includes(q)) return true;
          const client = clientNameById.get(job.clientId);
          if (client?.toLowerCase().includes(q)) return true;
        }
        return false;
      });
    }
    return result;
  }, [
    items,
    query,
    activeTab,
    jobIdFilter,
    jobIdsForTab,
    allJobs,
    allClients,
    effectivePipelineIds,
    isInReview,
  ]);

  return { counts, filteredData };
}
