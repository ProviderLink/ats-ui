import { getJson } from '@/lib/api-client';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface DispositionReason {
  _id: string;
  label: string;
  category: DispositionReasonCategory;
  isActive: boolean;
  order: number;
  applicableStages: string[];
  defaultEligibility: 'eligible' | 'permanently_ineligible';
  requireInternalNotes: boolean;
}

export type DispositionReasonCategory =
  | 'experience_and_qualifications'
  | 'interview_performance'
  | 'availability_and_employment'
  | 'recruiter_or_client_selection'
  | 'candidate_actions'
  | 'permanently_ineligible_reasons'
  | 'other';

export const CATEGORY_LABELS: Record<DispositionReasonCategory, string> = {
  experience_and_qualifications: 'Experience and Qualifications',
  interview_performance: 'Interview Performance',
  availability_and_employment: 'Availability and Employment Requirements',
  recruiter_or_client_selection: 'Recruiter or Client Selection',
  candidate_actions: 'Candidate Actions',
  permanently_ineligible_reasons: 'Permanently Ineligible Reasons',
  other: 'Other',
};

interface DispositionReasonsState {
  activeReasons: DispositionReason[];
  loading: boolean;
  error: string | null;
}

interface DispositionReasonsActions {
  fetchActive: (stageName?: string) => Promise<void>;
  reset: () => void;
}

const initialState: DispositionReasonsState = {
  activeReasons: [],
  loading: false,
  error: null,
};

export const useDispositionReasonsStore = create<
  DispositionReasonsState & DispositionReasonsActions
>()(
  immer(set => ({
    ...initialState,

    fetchActive: async (stageName?: string) => {
      set(s => {
        s.loading = true;
        s.error = null;
      });
      try {
        const params = new URLSearchParams();
        if (stageName) params.set('stageName', stageName);
        const url = `/ats/disposition-reasons/active?${params.toString()}`;
        const reasons = await getJson<DispositionReason[]>(url);
        set(s => {
          s.activeReasons = reasons;
          s.loading = false;
        });
      } catch (e) {
        set(s => {
          s.loading = false;
          s.error = (e as Error).message;
        });
      }
    },

    reset: () =>
      set(s => {
        Object.assign(s, initialState);
      }),
  }))
);
