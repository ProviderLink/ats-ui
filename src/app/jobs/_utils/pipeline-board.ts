import type { Application, Candidate } from '@/store';

export interface AppWithCandidate {
  application: Application;
  candidate: Candidate;
}

export function pairWithCandidates(
  applications: Application[],
  candidates: Candidate[]
): AppWithCandidate[] {
  return applications.flatMap(application => {
    const candidate = candidates.find(c => c._id === application.candidateId);
    return candidate ? [{ application, candidate }] : [];
  });
}

export function buildStageMap(
  pairs: AppWithCandidate[],
  firstStageId?: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { application } of pairs) {
    result[application._id] =
      application.currentStage?.stageId || firstStageId || '';
  }
  return result;
}

export function candidateFullName(candidate: Candidate): string {
  return `${candidate.firstName} ${candidate.lastName}`;
}
