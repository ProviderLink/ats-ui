import {
  deleteJson,
  getJson,
  patchJson,
  postForm,
  postJson,
} from '@/lib/api-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Candidate, CandidateFilters, Pagination } from '../types';
import { useApplicationStore } from './applications.store';
import { canSkipFetch } from './boot.store';
import {
  applyCandidatePatch,
  buildCandidateFormData,
  replaceCandidate,
} from './candidates.store.helpers';
import type {
  CandidateActions,
  CandidateState,
} from './candidates.store.types';
import { createMutate } from './mutation';

const initialState: CandidateState = {
  items: [],
  detail: {},
  loading: false,
  isRefreshing: false,
  mutating: false,
  error: null,
  pagination: null,
  filters: { page: 1, limit: 20 },
  ineligibleItems: [],
  ineligibleLoaded: false,
  ineligibleLoading: false,
};

// Persist detail for instant display on revisit; items are NOT persisted
// to avoid flashing stale data (e.g., approved candidates with parsedData/aiScore
// briefly visible on the "In Review" tab before the API response replaces them).
export const useCandidateStore = create<CandidateState & CandidateActions>()(
  persist(
    immer((set, get) => {
      const mutate = createMutate<CandidateState>(set);

      return {
        ...initialState,
        fetch: async params => {
          // No-op after boot only for automatic refreshes that carry no
          // explicit filter. Explicit fetches — e.g. after approve/reject/
          // hire/delete or a user-triggered refresh — always hit the server
          // so the table and detail sheet stay current.
          const hasExplicitFilter =
            params &&
            Object.keys(params).some(k => k !== 'page' && k !== 'limit');
          if (
            canSkipFetch() &&
            get().items.length > 0 &&
            !hasExplicitFilter
          )
            return;

          const base = get().filters;
          const filters: CandidateFilters = {
            page: params?.page ?? base.page,
            limit: params?.limit ?? base.limit,
            status: params?.status,
            inTalentPool: params?.inTalentPool,
            search: params?.search,
            tags: params?.tags,
          };
          const hasData = get().items.length > 0;
          // When the status/tab filter actually changes, treat it as a fresh load
          // so the table shows a skeleton instead of stale data from the old tab.
          const filterChanged =
            params?.status !== undefined && params.status !== base.status;
          const isTabSwitch = filterChanged;
          set(s => {
            if (hasData && !isTabSwitch) s.isRefreshing = true;
            else s.loading = true;
            s.error = null;
            if (params) s.filters = filters;
          });
          try {
            const res = await getJson<
              Candidate[] | ({ data: Candidate[] } & Pagination)
            >('/ats/candidates', filters as Record<string, unknown>);
            const data = Array.isArray(res) ? res : (res.data ?? []);
            const pag = Array.isArray(res)
              ? null
              : {
                  total: res.total,
                  page: res.page,
                  limit: res.limit,
                  totalPages: res.totalPages,
                };
            set(s => {
              s.items = data;
              s.pagination = pag;
              s.loading = false;
              s.isRefreshing = false;
            });
            // NOTE: this used to fetch `/ats/candidates/:id` for every row whose
            // `aiValidation` was absent or whose `parsedData` looked empty, on the
            // assumption the list endpoint returned "hollow" records.
            //
            // It does not. `getAllCandidates` applies no field projection — it is
            // `Candidate.find(query)` mapped through the same `toSafeObject()` that
            // `getCandidateById` uses, and the detail route only additionally strips
            // `resumeRawText`. Both payloads are identical, so an enrichment
            // request could never add a field the list had not already supplied.
            //
            // The cost was real: at boot the list is fetched with `limit: 9999`, so
            // a row permanently lacking AI data (a file type that is never parsed,
            // a failed parse) re-requested itself on EVERY load, unbounded and
            // uncancellable. A candidate's AI state now arrives via the
            // `candidate:updated` socket event the backend emits on scoring.
          } catch (e) {
            set(s => {
              s.loading = false;
              s.isRefreshing = false;
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
            const c = await getJson<Candidate>(`/ats/candidates/${id}`);
            set(s => {
              s.detail[id] = c;
              s.loading = false;
              // Keep the admin Ineligible list consistent with the fresh record.
              // The sheet uses this to refresh after a legal-hold toggle, which
              // changes a field rendered by that list.
              const iIdx = s.ineligibleItems.findIndex(x => x._id === id);
              if (iIdx !== -1) s.ineligibleItems[iIdx] = c;
            });
          } catch (e) {
            set(s => {
              s.loading = false;
              s.error = (e as Error).message;
            });
          }
        },

        // Loads the permanently-ineligible list once per session and caches it
        // in the store, mirroring how the boot loader preloads the rest of the
        // candidate data. `force` is used after restore / legal-hold mutations.
        fetchIneligible: async (force = false) => {
          if (!force && (get().ineligibleLoaded || get().ineligibleLoading))
            return;
          set(s => {
            s.ineligibleLoading = true;
            s.error = null;
          });
          try {
            // Filter server-side. `includeIneligible` only stops the default
            // exclusion, so it returned a mixed newest-first page which the page
            // then filtered client-side — silently dropping every ineligible
            // candidate older than the page size. `eligibilityStatus` is an exact
            // match, so the limit only bounds the ineligible set itself.
            const res = await getJson<
              Candidate[] | ({ data: Candidate[] } & Pagination)
            >('/ats/candidates', {
              eligibilityStatus: 'permanently_ineligible',
              limit: 9999,
            });
            const data = Array.isArray(res) ? res : (res.data ?? []);
            set(s => {
              s.ineligibleItems = data;
              s.ineligibleLoaded = true;
              s.ineligibleLoading = false;
            });
          } catch (e) {
            set(s => {
              s.ineligibleLoading = false;
              s.error = (e as Error).message;
            });
          }
        },

        create: data =>
          mutate(
            () => postForm<Candidate>('/ats/candidates', buildCandidateFormData(data)),
            (s, c) => {
              const idx = s.items.findIndex(x => x._id === c._id);
              if (idx !== -1) s.items[idx] = c;
              else s.items.unshift(c);
            }
          ),

        update: async (id, data) => {
          await mutate(
            () => patchJson<Candidate>(`/ats/candidates/${id}`, data),
            (s, c) => replaceCandidate(s, id, c)
          );
        },

        remove: async id => {
          await mutate(
            () => deleteJson(`/ats/candidates/${id}`),
            s => {
              s.items = s.items.filter(x => x._id !== id);
              // The admin Ineligible list reads this separate cached array, so a
              // delete from the detail sheet must clear it here too — otherwise
              // the row survives until the page is refetched.
              s.ineligibleItems = s.ineligibleItems.filter(x => x._id !== id);
              delete s.detail[id];
            }
          );
          useApplicationStore.getState()._removeByCandidateId(id);
        },

        updateTalentPool: async (id, action, notes) => {
          await mutate(
            () =>
              patchJson<Candidate>(`/ats/candidates/${id}/talent-pool`, {
                action,
                notes,
              }),
            (s, c) => replaceCandidate(s, id, c),
            false
          );
        },

        rejectCandidate: async (id, payload) => {
          await mutate(
            () => patchJson<Candidate>(`/ats/candidates/${id}/reject`, payload),
            (s, c) => replaceCandidate(s, id, c)
          );
        },

        changeJob: async (id, payload) => {
          await mutate(
            async () => {
              // The endpoint returns a summary ({ candidateId, applicationId,
              // closedApplicationId, jobId, changed }) rather than the candidate,
              // so it must NOT be written into items/detail — doing so replaces
              // the row with an object missing firstName/email/status and crashes
              // the table. Refetch the candidate instead.
              await postJson(`/ats/candidates/${id}/change-job`, payload);
              return getJson<Candidate>(`/ats/candidates/${id}`);
            },
            (s, fresh) => replaceCandidate(s, id, fresh)
          );
        },

        // The endpoint returns the updated candidate, so it is patched in place.
        // Refetching a filtered list here would wipe the store.
        restoreCandidate: async (id, payload) => {
          await mutate(
            () => patchJson<Candidate>(`/ats/candidates/${id}/restore`, payload),
            (s, c) => {
              const idx = s.items.findIndex(x => x._id === id);
              if (idx !== -1) s.items[idx] = c;
              s.detail[id] = c;
              // Drop the stale ineligible-list entry.
              s.ineligibleItems = s.ineligibleItems.filter(x => x._id !== id);
            }
          );
        },

        assignJob: async (id, jobId, startStageId) => {
          await mutate(
            () =>
              postJson(`/ats/candidates/${id}/assign-job`, {
                jobId,
                ...(startStageId ? { startStageId } : {}),
              }),
            undefined,
            false
          );
        },

        approve: (id, jobId) =>
          mutate(
            () =>
              postJson<{
                candidateId: string;
                jobId: string;
                applicationId: string;
                approved: boolean;
              }>(`/ats/candidates/${id}/approve`, { jobId }),
            // Approved, so it leaves the pending list.
            s => {
              s.items = s.items.filter(x => x._id !== id);
            },
            false
          ),

        setFilters: f =>
          set(s => {
            s.filters = { ...s.filters, ...f };
          }),

        reset: () =>
          set(s => {
            Object.assign(s, initialState);
          }),

        _patch: c => set(s => applyCandidatePatch(s, c)),

        _remove: id =>
          set(s => {
            s.items = s.items.filter(x => x._id !== id);
            s.ineligibleItems = s.ineligibleItems.filter(x => x._id !== id);
            delete s.detail[id];
          }),
      };
    }),
    {
      name: 'ats-candidates',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ detail: s.detail }),
    }
  )
);
