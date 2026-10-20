import { deleteJson, getJson, patchJson, postJson } from '@/lib/api-client';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  CreateExternalMeetingDto,
  ExternalMeeting,
  ExternalMeetingFilters,
  UpdateExternalMeetingDto,
} from '../types';
import { createMutate } from './mutation';

interface ExternalMeetingState {
  items: ExternalMeeting[];
  loading: boolean;
  mutating: boolean;
  error: string | null;
}

interface ExternalMeetingActions {
  fetch: (params?: ExternalMeetingFilters) => Promise<void>;
  create: (data: CreateExternalMeetingDto) => Promise<ExternalMeeting>;
  update: (id: string, data: UpdateExternalMeetingDto) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  reset: () => void;
}

const initialState: ExternalMeetingState = {
  items: [],
  loading: false,
  mutating: false,
  error: null,
};

/**
 * External meetings (people who are not in the ATS), shown on the calendar.
 *
 * Deliberately NOT persisted and NOT part of the boot fetch: the calendar is
 * the only consumer, so it loads them itself and nothing stale is kept in
 * localStorage.
 */
export const useExternalMeetingStore = create<
  ExternalMeetingState & ExternalMeetingActions
>()(
  immer(set => {
    const mutate = createMutate<ExternalMeetingState>(set);

    return {
      ...initialState,

      fetch: async params => {
        set(s => {
          s.loading = true;
          s.error = null;
        });
        try {
          const res = await getJson<{ data: ExternalMeeting[] }>(
            '/ats/external-meetings',
            { limit: 200, ...params } as Record<string, unknown>
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

      create: data =>
        mutate(
          () => postJson<ExternalMeeting>('/ats/external-meetings', data),
          (s, meeting) => {
            s.items.unshift(meeting);
          }
        ),

      update: async (id, data) => {
        await mutate(
          () =>
            patchJson<ExternalMeeting>(`/ats/external-meetings/${id}`, data),
          (s, meeting) => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = meeting;
          }
        );
      },

      cancel: async id => {
        await mutate(
          () => deleteJson<ExternalMeeting>(`/ats/external-meetings/${id}`),
          (s, meeting) => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = meeting;
          }
        );
      },

      reset: () =>
        set(s => {
          Object.assign(s, initialState);
        }),
    };
  })
);
