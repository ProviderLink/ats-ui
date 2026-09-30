import type { ComposeMode } from '@/app/emails/_components/compose-email-sheet';
import { useAuthStore } from '@/store/slices/auth.store';
import type { Candidate } from '@/store/types';

/** The candidate fields the compose prefill actually reads. */
export type ComposableCandidate = Pick<
  Candidate,
  '_id' | 'firstName' | 'lastName' | 'email' | 'phone'
>;

/** Display name of the signed-in user, for the `{{senderName}}` placeholder. */
export function currentSenderName(): string {
  const u = useAuthStore.getState().user;
  return u ? `${u.firstName} ${u.lastName}`.trim() : '';
}

/**
 * Build the ComposeEmailSheet "prefill" mode for ONE OR MANY candidates.
 *
 * Every address goes into the single To list, so one send reaches all of them.
 * With more than one recipient there is no correct value for the per-candidate
 * merge fields — `{{candidateName}}` would be right for one person and wrong
 * for the rest — so the bulk composer opens empty and the user writes the
 * message (or picks a template and fills the placeholders themselves). A single
 * recipient keeps the previous behaviour: the default `general` template with
 * their details substituted.
 *
 * Candidates without an email address are dropped, because the table bulk
 * actions can select a mix of both. Duplicate addresses are collapsed —
 * the same person can end up selected twice after a job change.
 */
export function buildCandidateComposeMode(
  candidates: ComposableCandidate[]
): ComposeMode {
  const seen = new Set<string>();
  const addressed: ComposableCandidate[] = [];
  const addresses: string[] = [];

  for (const c of candidates) {
    const addr = (c.email ?? '').trim();
    if (!addr) continue;
    const key = addr.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    addressed.push(c);
    addresses.push(addr);
  }

  const single = addressed.length === 1 ? addressed[0] : null;

  return {
    type: 'prefill',
    to: addresses.join(', '),
    subject: '',
    body: '',
    ...(single
      ? {
          templateType: 'general',
          context: { type: 'general', candidateId: single._id },
          variables: {
            candidateName: `${single.firstName} ${single.lastName}`,
            candidateEmail: single.email,
            candidatePhone: single.phone ?? '',
            jobTitle: '',
            clientName: '',
            currentStage: '',
            senderName: currentSenderName(),
          },
        }
      : {}),
  };
}
