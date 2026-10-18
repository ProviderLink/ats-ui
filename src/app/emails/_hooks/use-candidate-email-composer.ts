import type { Candidate } from '@/store/types';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ComposeMode } from '../_components/compose-email-sheet';
import { buildCandidateComposeMode } from '../_utils/candidate-compose';

/** Composer state for emailing one or many candidates from a list page. */
export function useCandidateEmailComposer() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>({ type: 'new' });

  /**
   * Every address goes into the single To list, so one send reaches all of
   * them. Candidates with no email are dropped: the row action is already
   * disabled for them, and a bulk selection can mix both.
   */
  function openComposeFor(candidates: Candidate[]) {
    const reachable = candidates.filter(c => (c.email ?? '').trim());
    if (reachable.length === 0) {
      toast.error('None of the selected candidates has an email address.');
      return;
    }
    setComposeMode(buildCandidateComposeMode(reachable));
    setComposeOpen(true);
  }

  return { composeOpen, setComposeOpen, composeMode, openComposeFor };
}
