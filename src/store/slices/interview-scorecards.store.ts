import { getJson, postJson } from '@/lib/api-client';
import { toast } from 'sonner';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type {
  CreateInterviewScorecardDto,
  InterviewScorecard,
  InterviewScorecardListResponse,
} from '../types/interview-scorecard.types';

interface InterviewScorecardState {
  items: InterviewScorecard[];
  detail: Record<string, InterviewScorecard>;
  loading: boolean;
  mutating: boolean;
  error: string | null;
}

interface InterviewScorecardActions {
  fetchByCandidate: (candidateId: string) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  create: (payload: CreateInterviewScorecardDto) => Promise<InterviewScorecard>;
  reset: () => void;
}

const initialState: InterviewScorecardState = {
  items: [],
  detail: {},
  loading: false,
  mutating: false,
  error: null,
};

export const useInterviewScorecardStore = create<
  InterviewScorecardState & InterviewScorecardActions
>()(
  immer(set => ({
    ...initialState,

    fetchByCandidate: async candidateId => {
      set(s => {
        s.loading = true;
        s.error = null;
      });
      try {
        const res = await getJson<InterviewScorecardListResponse>(
          '/ats/interview-scorecards',
          { candidateId, limit: 100 }
        );
        set(s => {
          s.items = res.data;
          s.loading = false;
        });
      } catch (e) {
        set(s => {
          s.loading = false;
          s.error = (e as Error).message;
        });
      }
    },

    fetchOne: async id => {
      set(s => {
        s.loading = true;
        s.error = null;
      });
      try {
        const scorecard = await getJson<InterviewScorecard>(
          `/ats/interview-scorecards/${id}`
        );
        set(s => {
          s.detail[id] = scorecard;
          s.loading = false;
        });
      } catch (e) {
        set(s => {
          s.loading = false;
          s.error = (e as Error).message;
        });
      }
    },

    create: async payload => {
      set(s => {
        s.mutating = true;
        s.error = null;
      });
      try {
        const scorecard = await postJson<InterviewScorecard>(
          '/ats/interview-scorecards',
          payload
        );
        set(s => {
          // Insert at the top — backend sorts list by interviewDate desc,
          // so a fresh fetch would also show it first. Avoid a network round-trip.
          s.items = [scorecard, ...s.items].sort((a, b) =>
            a.interviewDate < b.interviewDate ? 1 : -1
          );
          s.mutating = false;
        });
        toast.success('Interview scorecard submitted');
        return scorecard;
      } catch (e) {
        set(s => {
          s.mutating = false;
          s.error = (e as Error).message;
        });
        toast.error((e as Error).message);
        throw e;
      }
    },

    reset: () => set(() => ({ ...initialState })),
  }))
);
