import type { CandidateStatus } from '@/store/types';

/**
 * Tabs the candidates page actually renders. Hired deliberately has its own
 * page (`/ats/hired`), so it is not a value here — narrowing the type is what
 * keeps the `isHired` branches from silently coming back.
 */
export type CandidateTabValue = Extract<CandidateStatus, 'pending' | 'approved'>;
