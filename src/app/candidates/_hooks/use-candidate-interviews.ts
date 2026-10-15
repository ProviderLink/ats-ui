import { useInterviewScorecardStore } from '@/store/slices/interview-scorecards.store';
import { useInterviewStore } from '@/store/slices/interviews.store';
import type { Application, Candidate } from '@/store/types';
import { useEffect, useMemo } from 'react';

/**
 * Interviews shown in the detail sheet.
 *
 * Two sources on purpose: `interviews` is the shared store list the calendar
 * owns, while `interviewsByApplication` is an application-scoped slice kept in
 * its own map. Reading the shared list here would be wrong (it holds every
 * job's interviews) and writing to it — which this sheet used to do — reduced
 * the calendar to a single candidate's interviews.
 */
export function useCandidateInterviews(
  open: boolean,
  candidate: Candidate | null,
  activePipelineApp: Application | null
) {
  const interviews = useInterviewStore(s => s.items);
  const interviewsByApplication = useInterviewStore(s => s.byApplication);
  const fetchInterviews = useInterviewStore(s => s.fetch);
  const fetchScopedInterviewsByApplication = useInterviewStore(
    s => s.fetchScopedByApplication
  );
  const fetchScorecardsByCandidate = useInterviewScorecardStore(
    s => s.fetchByCandidate
  );

  /**
   * Interviews belonging to the currently active application.
   *
   * Prefers the application-scoped slice, which only `fetchScoped…` populates.
   * Falls back to filtering the shared list for anything it has not loaded
   * (e.g. a socket update that arrived for an application never opened here) so
   * the section is never emptier than before.
   */
  const activeApplicationInterviews = useMemo(() => {
    if (!activePipelineApp) return [];
    const scoped = interviewsByApplication[activePipelineApp._id];
    if (scoped) return scoped;
    return interviews.filter(iv => iv.applicationId === activePipelineApp._id);
  }, [interviewsByApplication, interviews, activePipelineApp]);

  // An approved candidate always has an active application; the
  // candidate-wide filter is a fallback for the brief window before one is
  // resolved.
  const candidateInterviews = activePipelineApp
    ? activeApplicationInterviews
    : interviews.filter(iv => iv.candidateId === candidate?._id);

  useEffect(() => {
    if (open && candidate) {
      if (activePipelineApp) {
        fetchScopedInterviewsByApplication(activePipelineApp._id, {
          limit: 50,
        });
      } else {
        fetchInterviews({ candidateId: candidate._id, limit: 50 });
      }
    }
  }, [
    open,
    candidate,
    activePipelineApp,
    fetchInterviews,
    fetchScopedInterviewsByApplication,
  ]);

  useEffect(() => {
    if (open && candidate && candidate.status === 'approved') {
      void fetchScorecardsByCandidate(candidate._id);
    }
  }, [open, candidate, fetchScorecardsByCandidate]);

  /** Re-read the interviews the sheet is showing after a mutation. */
  function refreshInterviews() {
    if (activePipelineApp) {
      fetchScopedInterviewsByApplication(activePipelineApp._id, { limit: 50 });
    } else if (candidate) {
      fetchInterviews({ candidateId: candidate._id, limit: 50 });
    }
  }

  return {
    candidateInterviews,
    refreshInterviews,
    fetchScorecardsByCandidate,
  };
}
