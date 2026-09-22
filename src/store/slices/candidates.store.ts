import {
  deleteJson,
  getJson,
  patchJson,
  postForm,
  postJson,
} from '@/lib/api-client';
import { toast } from 'sonner';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Candidate,
  CandidateFilters,
  CreateCandidateDto,
  Pagination,
  UpdateCandidateDto,
} from '../types';
import { useApplicationStore } from './applications.store';
import { useBootStore } from './boot.store';

interface CandidateState {
  items: Candidate[];
  detail: Record<string, Candidate>;
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: CandidateFilters;
  ineligibleItems: Candidate[];
  ineligibleLoaded: boolean;
  ineligibleLoading: boolean;
}

interface CandidateActions {
  fetch: (params?: CandidateFilters) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  create: (data: CreateCandidateDto) => Promise<Candidate>;
  update: (id: string, data: UpdateCandidateDto) => Promise<void>;
  remove: (id: string) => Promise<void>;
  uploadAvatar: (id: string, file: File) => Promise<void>;
  updateTalentPool: (
    id: string,
    action: 'add' | 'remove',
    notes?: string
  ) => Promise<void>;
  assignJob: (
    id: string,
    jobId: string,
    startStageId?: string
  ) => Promise<void>;
  rejectCandidate: (
    id: string,
    payload: {
      rejectionReasonId: string;
      destination?: 'candidate_pool' | 'permanently_ineligible';
      internalNotes?: string;
    }
  ) => Promise<void>;
  changeJob: (
    id: string,
    payload: {
      applicationId: string;
      targetJobId: string;
      startStageId?: string;
    }
  ) => Promise<void>;
  /**
   * Restore a permanently ineligible candidate to In Review.
   *
   * Patches the returned candidate into the store rather than refetching a
   * filtered list — a `fetch({ status: 'pending' })` would replace `items`
   * with pending-only rows and the post-boot guard would then block any
   * recovery, emptying the In Pipeline tab.
   */
  restoreCandidate: (id: string, payload: { jobId: string }) => Promise<void>;
  approve: (
    id: string,
    jobId: string
  ) => Promise<{
    candidateId: string;
    jobId: string;
    applicationId: string;
    approved: boolean;
  }>;
  setFilters: (f: Partial<CandidateFilters>) => void;
  fetchIneligible: (force?: boolean) => Promise<void>;
  reset: () => void;
  _patch: (c: Candidate) => void;
  _remove: (id: string) => void;
}

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
    immer((set, get) => ({
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
          useBootStore.getState().isBooted &&
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
          // The list endpoint may return lightweight objects without
          // parsedData / aiValidation / aiScore. Fetch full detail for any
          // items that are missing those fields so the table columns populate.
          // Also enrich rows where parsedData exists but has empty experience
          // and skills — the list may ship a hollow stub that the detail
          // endpoint fills with real parsed data.
          const needsEnrich = data.filter(c => {
            if (!c.parsedData) return true;
            const p = c.parsedData;
            const hasEmptyRole = !p.experience || p.experience.length === 0;
            const hasEmptySkills = !p.skills || p.skills.length === 0;
            const missingValidation = !c.aiValidation;
            return (hasEmptyRole && hasEmptySkills) || missingValidation;
          });
          if (needsEnrich.length > 0) {
            const results = await Promise.allSettled(
              needsEnrich.map(c =>
                getJson<Candidate>(`/ats/candidates/${c._id}`)
              )
            );
            const enriched = new Map<string, Candidate>();
            results.forEach((r, i) => {
              if (r.status === 'fulfilled' && r.value) {
                enriched.set(needsEnrich[i]._id, r.value);
              }
            });
            if (enriched.size > 0) {
              set(s => {
                s.items = s.items.map(item => {
                  const e = enriched.get(item._id);
                  if (!e) return item;
                  // Per-field merge: preserve heavy fields the list already
                  // supplied when the detail response omits them, so the
                  // Job Applied / Current Role / Skills columns never blank
                  // out after enrichment completes.
                  return {
                    ...item,
                    ...e,
                    parsedData: e.parsedData ?? item.parsedData,
                    aiScore: e.aiScore ?? item.aiScore,
                    aiValidation: e.aiValidation ?? item.aiValidation,
                    appliedJobId: e.appliedJobId ?? item.appliedJobId,
                  } as Candidate;
                });
              });
            }
          }
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

      create: async data => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const fd = new FormData();
          fd.append('firstName', data.firstName);
          fd.append('lastName', data.lastName);
          fd.append('email', data.email);
          fd.append('phone', data.phone);
          fd.append('file', data.file);
          if (data.yearsOfExperience !== undefined)
            fd.append('yearsOfExperience', String(data.yearsOfExperience));
          if (data.tags) fd.append('tags', JSON.stringify(data.tags));
          if (data.videoIntroUrl)
            fd.append('videoIntroUrl', data.videoIntroUrl);
          if (data.videoIntroSource)
            fd.append('videoIntroSource', data.videoIntroSource);
          const c = await postForm<Candidate>('/ats/candidates', fd);
          set(s => {
            const idx = s.items.findIndex(x => x._id === c._id);
            if (idx !== -1) s.items[idx] = c;
            else s.items.unshift(c);
            s.mutating = false;
          });
          return c;
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      update: async (id, data) => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const c = await patchJson<Candidate>(`/ats/candidates/${id}`, data);
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = c;
            if (s.detail[id]) s.detail[id] = c;
            s.mutating = false;
          });
          toast.success('Candidate updated');
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          toast.error((e as Error).message);
          throw e;
        }
      },

      remove: async id => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          await deleteJson(`/ats/candidates/${id}`);
          set(s => {
            s.items = s.items.filter(x => x._id !== id);
            // The admin Ineligible list reads this separate cached array, so a
            // delete from the detail sheet must clear it here too — otherwise
            // the row survives until the page is refetched.
            s.ineligibleItems = s.ineligibleItems.filter(x => x._id !== id);
            delete s.detail[id];
            s.mutating = false;
          });
          useApplicationStore.getState()._removeByCandidateId(id);
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      uploadAvatar: async (id, file) => {
        const fd = new FormData();
        fd.append('file', file);
        try {
          const c = await postForm<Candidate>(
            `/ats/candidates/${id}/avatar`,
            fd
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = c;
            if (s.detail[id]) s.detail[id] = c;
          });
          toast.success('Photo updated');
        } catch (e) {
          toast.error((e as Error).message);
          throw e;
        }
      },

      updateTalentPool: async (id, action, notes) => {
        set(s => {
          s.mutating = true;
        });
        try {
          const c = await patchJson<Candidate>(
            `/ats/candidates/${id}/talent-pool`,
            { action, notes }
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = c;
            if (s.detail[id]) s.detail[id] = c;
            s.mutating = false;
          });
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      rejectCandidate: async (id, payload) => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const c = await patchJson<Candidate>(
            `/ats/candidates/${id}/reject`,
            payload
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = c;
            if (s.detail[id]) s.detail[id] = c;
            s.mutating = false;
          });
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      changeJob: async (id, payload) => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          // The endpoint returns a summary ({ candidateId, applicationId,
          // closedApplicationId, jobId, changed }) rather than the candidate,
          // so it must NOT be written into items/detail — doing so replaces the
          // row with an object missing firstName/email/status and crashes the
          // table. Refetch the candidate instead.
          await postJson<{
            candidateId: string;
            applicationId: string;
            closedApplicationId: string;
            jobId: string;
            changed: boolean;
          }>(`/ats/candidates/${id}/change-job`, payload);

          const fresh = await getJson<Candidate>(`/ats/candidates/${id}`);
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = fresh;
            if (s.detail[id]) s.detail[id] = fresh;
            s.mutating = false;
          });
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      restoreCandidate: async (id, payload) => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          // The endpoint returns the updated candidate, so patch it in place.
          // Refetching a filtered list here would wipe the store.
          const c = await patchJson<Candidate>(
            `/ats/candidates/${id}/restore`,
            payload
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = c;
            s.detail[id] = c;
            // Drop the stale ineligible-list entry.
            s.ineligibleItems = s.ineligibleItems.filter(x => x._id !== id);
            s.mutating = false;
          });
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      assignJob: async (id, jobId, startStageId) => {
        set(s => {
          s.mutating = true;
        });
        try {
          await postJson(`/ats/candidates/${id}/assign-job`, {
            jobId,
            ...(startStageId ? { startStageId } : {}),
          });
          set(s => {
            s.mutating = false;
          });
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      approve: async (id, jobId) => {
        set(s => {
          s.mutating = true;
        });
        try {
          const result = await postJson<{
            candidateId: string;
            jobId: string;
            applicationId: string;
            approved: boolean;
          }>(`/ats/candidates/${id}/approve`, { jobId });
          // Remove from pending list — it's now approved
          set(s => {
            s.items = s.items.filter(x => x._id !== id);
            s.mutating = false;
          });
          return result;
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      setFilters: f =>
        set(s => {
          s.filters = { ...s.filters, ...f };
        }),

      reset: () =>
        set(s => {
          Object.assign(s, initialState);
        }),

      _patch: c =>
        set(s => {
          const merge = <T extends Candidate>(prev: T): T => {
            // Socket updates often ship lightweight payloads that omit the
            // heavy fields the table renders (parsedData, aiScore,
            // aiValidation, appliedJobId). Replacing the whole object would
            // blank those columns seconds after the enriched data loaded.
            // Preserve the previous value when the patch doesn't supply one.
            //
            // status is also preserved here: a lightweight candidate:updated
            // payload (e.g. emitted when a public apply triggers related-job
            // broadcasts) must not overwrite an existing candidate's status
            // with undefined, which would make them invisible in every tab.
            const merged: Candidate = {
              ...prev,
              ...c,
              parsedData: c.parsedData ?? prev.parsedData,
              aiScore: c.aiScore ?? prev.aiScore,
              aiValidation: c.aiValidation ?? prev.aiValidation,
              appliedJobId: c.appliedJobId ?? prev.appliedJobId,
              status: c.status ?? prev.status,
            };
            return merged as T;
          };
          const idx = s.items.findIndex(x => x._id === c._id);
          if (idx !== -1) s.items[idx] = merge(s.items[idx]);
          else s.items.unshift(c);
          if (s.detail[c._id]) s.detail[c._id] = merge(s.detail[c._id]);
          // Keep the admin Ineligible list in step with the same event. The
          // patch is only trusted when it actually carries eligibilityStatus —
          // lightweight socket payloads omit it, and guessing would either
          // drop a row or resurrect a restored one.
          if (c.eligibilityStatus !== undefined) {
            const iIdx = s.ineligibleItems.findIndex(x => x._id === c._id);
            const isIneligible =
              c.eligibilityStatus === 'permanently_ineligible';
            // `merge` dereferences its base, so a brand-new row is inserted
            // as-is rather than merged against a non-existent previous value.
            if (isIneligible && iIdx === -1)
              s.ineligibleItems.unshift({ ...c } as Candidate);
            else if (!isIneligible && iIdx !== -1)
              s.ineligibleItems.splice(iIdx, 1);
            else if (iIdx !== -1)
              s.ineligibleItems[iIdx] = merge(s.ineligibleItems[iIdx]);
          }
        }),

      _remove: id =>
        set(s => {
          s.items = s.items.filter(x => x._id !== id);
          s.ineligibleItems = s.ineligibleItems.filter(x => x._id !== id);
          delete s.detail[id];
        }),
    })),
    {
      name: 'ats-candidates',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ detail: s.detail }),
    }
  )
);
