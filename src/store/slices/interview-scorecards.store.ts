import { getJson, patchJson, postJson } from '@/lib/api-client';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type {
  CreateInterviewScorecardDto,
  InterviewScorecard,
  InterviewScorecardListResponse,
  UpdateInterviewScorecardDto,
} from '../types/interview-scorecard.types';

interface InterviewScorecardState {
  items: InterviewScorecard[];
  /** Candidate whose scorecards `items` currently holds (null = none loaded). */
  loadedCandidateId: string | null;
  detail: Record<string, InterviewScorecard>;
  loading: boolean;
  mutating: boolean;
  error: string | null;
}

interface InterviewScorecardActions {
  fetchByCandidate: (candidateId: string) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  create: (payload: CreateInterviewScorecardDto) => Promise<InterviewScorecard>;
  update: (
    id: string,
    payload: UpdateInterviewScorecardDto
  ) => Promise<InterviewScorecard>;
  reset: () => void;
  _patch: (scorecard: InterviewScorecard) => void;
}

const initialState: InterviewScorecardState = {
  items: [],
  loadedCandidateId: null,
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
          s.loadedCandidateId = candidateId;
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
          s.items = [
            scorecard,
            ...s.items.filter(it => it._id !== scorecard._id),
          ].sort((a, b) =>
            a.interviewDate < b.interviewDate ? 1 : -1
          );
          s.mutating = false;
        });
        return scorecard;
      } catch (e) {
        set(s => {
          s.mutating = false;
          s.error = (e as Error).message;
        });
        throw e;
      }
    },

    update: async (id, payload) => {
      set(s => {
        s.mutating = true;
        s.error = null;
      });
      try {
        const scorecard = await patchJson<InterviewScorecard>(
          `/ats/interview-scorecards/${id}`,
          payload
        );
        set(s => {
          s.items = s.items
            .map(it => (it._id === id ? scorecard : it))
            .sort((a, b) => (a.interviewDate < b.interviewDate ? 1 : -1));
          s.detail[id] = scorecard;
          s.mutating = false;
        });
        return scorecard;
      } catch (e) {
        set(s => {
          s.mutating = false;
          s.error = (e as Error).message;
        });
        throw e;
      }
    },

    reset: () => set(() => ({ ...initialState })),

    // Real-time: refresh a known scorecard, and add a new one only when it
    // belongs to the candidate whose list is currently loaded.
    _patch: scorecard =>
      set(s => {
        const idx = s.items.findIndex(it => it._id === scorecard._id);
        if (idx !== -1) s.items[idx] = scorecard;
        else if (s.loadedCandidateId === scorecard.candidateId)
          s.items.push(scorecard);
        else if (!s.detail[scorecard._id]) return;
        s.items.sort((a, b) => (a.interviewDate < b.interviewDate ? 1 : -1));
        if (s.detail[scorecard._id]) s.detail[scorecard._id] = scorecard;
      }),
  }))
);
