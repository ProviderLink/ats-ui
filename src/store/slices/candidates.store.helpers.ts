import type { Candidate, CreateCandidateDto } from '../types';
import type { CandidateState } from './candidates.store.types';

type CandidateLists = Pick<
  CandidateState,
  'items' | 'detail' | 'ineligibleItems'
>;

export function buildCandidateFormData(data: CreateCandidateDto): FormData {
  const fd = new FormData();
  fd.append('firstName', data.firstName);
  fd.append('lastName', data.lastName);
  fd.append('email', data.email);
  fd.append('phone', data.phone);
  fd.append('file', data.file);
  if (data.yearsOfExperience !== undefined)
    fd.append('yearsOfExperience', String(data.yearsOfExperience));
  if (data.tags) fd.append('tags', JSON.stringify(data.tags));
  if (data.videoIntroUrl) fd.append('videoIntroUrl', data.videoIntroUrl);
  if (data.videoIntroSource)
    fd.append('videoIntroSource', data.videoIntroSource);
  return fd;
}

/** Put a fresh candidate into the list row and, when cached, the detail entry. */
export function replaceCandidate(
  s: Pick<CandidateLists, 'items' | 'detail'>,
  id: string,
  c: Candidate
) {
  const idx = s.items.findIndex(x => x._id === id);
  if (idx !== -1) s.items[idx] = c;
  if (s.detail[id]) s.detail[id] = c;
}

// Socket updates often ship lightweight payloads that omit the heavy fields the
// table renders (parsedData, aiScore, aiValidation, appliedJobId). Replacing the
// whole object would blank those columns seconds after the enriched data
// loaded, so the previous value is kept when the patch doesn't supply one.
//
// status is preserved too: a lightweight candidate:updated payload (e.g. from a
// public apply triggering related-job broadcasts) must not overwrite an
// existing candidate's status with undefined, which would make them invisible
// in every tab.
function mergeCandidate<T extends Candidate>(prev: T, patch: Candidate): T {
  const merged: Candidate = {
    ...prev,
    ...patch,
    parsedData: patch.parsedData ?? prev.parsedData,
    aiScore: patch.aiScore ?? prev.aiScore,
    aiValidation: patch.aiValidation ?? prev.aiValidation,
    appliedJobId: patch.appliedJobId ?? prev.appliedJobId,
    status: patch.status ?? prev.status,
  };
  return merged as T;
}

/** Apply a socket-delivered candidate to the list, detail cache and ineligible list. */
export function applyCandidatePatch(s: CandidateLists, c: Candidate) {
  const idx = s.items.findIndex(x => x._id === c._id);
  if (idx !== -1) s.items[idx] = mergeCandidate(s.items[idx], c);
  else s.items.unshift(c);
  if (s.detail[c._id]) s.detail[c._id] = mergeCandidate(s.detail[c._id], c);

  // Keep the admin Ineligible list in step with the same event. The patch is
  // only trusted when it actually carries eligibilityStatus — lightweight
  // socket payloads omit it, and guessing would either drop a row or
  // resurrect a restored one.
  if (c.eligibilityStatus === undefined) return;
  const iIdx = s.ineligibleItems.findIndex(x => x._id === c._id);
  const isIneligible = c.eligibilityStatus === 'permanently_ineligible';
  // `mergeCandidate` dereferences its base, so a brand-new row is inserted
  // as-is rather than merged against a non-existent previous value.
  if (isIneligible && iIdx === -1) s.ineligibleItems.unshift({ ...c } as Candidate);
  else if (!isIneligible && iIdx !== -1) s.ineligibleItems.splice(iIdx, 1);
  else if (iIdx !== -1)
    s.ineligibleItems[iIdx] = mergeCandidate(s.ineligibleItems[iIdx], c);
}
