import { CandidateDetailSheet } from '@/app/candidates/_components/candidate-detail-sheet';
import {
  avatarBg,
  phaseConfig,
} from '@/app/candidates/_utils/candidate-styles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getJson } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';
import type { Application, Candidate, Job } from '@/store';
import { useTagStore } from '@/store/slices/tags.store';
import type { ApplicationPhase, Tag } from '@/store/types';
import {
  ArrowDownUpIcon,
  BriefcaseIcon,
  CalendarClockIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  LayersIcon,
  Loader2Icon,
  UploadIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// The two sort options correspond to which application phase should show
// first in the list. Other phases keep their natural relative order.
const PHASE_ORDER: Record<ApplicationPhase, number> = {
  pending: 0,
  approved: 1,
  hired: 2,
  rejected: 3,
};
type SortKey = 'default' | 'pending' | 'approved';
type SortPhase = Exclude<SortKey, 'default'>;

const SORT_LABELS: Record<SortKey, string> = {
  default: 'Sort',
  pending: 'Pendings First',
  approved: 'In Pipeline First',
};

// Phase filter chips.
type PhaseFilter = ApplicationPhase;

const PHASE_FILTERS: { key: PhaseFilter; label: string }[] = [
  { key: 'approved', label: 'In Pipeline' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Rejected' },
];

type Pair = { candidate: Candidate; application: Application };

// ── Module-level cache ─────────────────────────────────────────────────────
// Survives component unmounts so navigating away and back to the same job
// doesn't re-trigger a full API fetch + loading spinner. The key={job._id}
// on <JobCandidates> ensures a clean mount when switching between different
// jobs, but the cache means the *same* job reuses the previous result.
// A short TTL prevents stale data if the user stays away for a while and
// other users have added/removed candidates.

type CacheEntry = {
  applications: Application[];
  candidates: Candidate[];
  fetchedAt: number;
};
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000; // 30 seconds

export function JobCandidates({ job }: { job: Job }) {
  const navigate = useNavigate();

  // Initialize from cache so we can render instantly when re-visiting the
  // same job. State defaults to empty — if there's a cache hit we populate
  // it synchronously and skip the loading screen entirely.
  const cached = cache.get(job._id);
  const cacheFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  const [applications, setApplications] = useState<Application[]>(
    cacheFresh ? cached!.applications : []
  );
  const [candidates, setCandidates] = useState<Candidate[]>(
    cacheFresh ? cached!.candidates : []
  );
  const [loading, setLoading] = useState(!cacheFresh);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have fresh cache, still do a background re-fetch so the
    // data is always eventually up-to-date, but don't show a spinner.
    const hadCache = cacheFresh;

    let alive = true;

    if (!hadCache) {
      setLoading(true);
      setError(null);
    }

    Promise.all([
      getJson<Application[] | { data: Application[] }>('/ats/applications', {
        jobId: job._id,
        limit: 9999,
      } as Record<string, unknown>),
      getJson<Candidate[] | { data: Candidate[] }>('/ats/candidates', {
        limit: 9999,
      }),
    ])
      .then(([appsRes, candsRes]) => {
        if (!alive) return;
        const apps = Array.isArray(appsRes) ? appsRes : (appsRes.data ?? []);
        const cands = Array.isArray(candsRes)
          ? candsRes
          : (candsRes.data ?? []);

        cache.set(job._id, {
          applications: apps,
          candidates: cands,
          fetchedAt: Date.now(),
        });

        setApplications(apps);
        setCandidates(cands);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        // If cache was serving data, don't overwrite it with an error.
        if (!hadCache) {
          setError((e as Error).message);
        }
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [job._id]);

  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('approved');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);

  // Join applications for *this* job with their candidates. We deliberately
  // *don't* filter by `job.status` — candidates stay assigned to a job even
  // when the job is on-hold or closed, and the user wants to see every one
  // of them.
  const allPairs: Pair[] = useMemo(() => {
    const candById = new Map(candidates.map(c => [c._id, c]));
    return applications
      .map(application => {
        const candidate = candById.get(application.candidateId);
        return candidate ? { application, candidate } : null;
      })
      .filter((x): x is Pair => x !== null);
  }, [applications, candidates]);

  const countByPhase = useMemo(() => {
    const m: Record<PhaseFilter, number> = {
      pending: 0,
      approved: 0,
      hired: 0,
      rejected: 0,
    };
    for (const { application } of allPairs) m[application.phase]++;
    return m;
  }, [allPairs]);

  const pairs: Pair[] = useMemo(() => {
    const filtered = allPairs.filter(p => p.application.phase === phaseFilter);

    if (sortKey === 'default') {
      return [...filtered].sort(
        (a, b) =>
          PHASE_ORDER[a.application.phase] - PHASE_ORDER[b.application.phase]
      );
    }

    // Re-rank so the selected phase has the smallest numeric order value,
    // surfacing it (and its neighbouring actionable phases) at the top.
    const ranks: Record<ApplicationPhase, number> = {
      ...PHASE_ORDER,
      [sortKey as SortPhase]: -1,
    };
    return [...filtered].sort(
      (a, b) => ranks[a.application.phase] - ranks[b.application.phase]
    );
  }, [allPairs, phaseFilter, sortKey]);

  // Resolve each candidate's first tag via the shared Tag store cache.
  // Backend may ship `candidate.tags` as raw `string[]` of tag IDs — see
  // lib/tags.ts — so resolving once up-front avoids calling a hook inside
  // `.map()` and keeps every card's tag chip consistent with the cache.
  const tagCache = useTagStore(s => s.items);
  const firstTagByCandidate = useMemo(() => {
    const byTagId = new Map<string, Tag>();
    for (const t of tagCache) byTagId.set(t._id, t);
    const map = new Map<string, Tag | null>();
    for (const { candidate } of allPairs) {
      const raw = candidate.tags?.[0];
      const resolved = raw
        ? typeof raw === 'string'
          ? (byTagId.get(raw) ?? null)
          : raw
        : null;
      map.set(candidate._id, resolved);
    }
    return map;
  }, [allPairs, tagCache]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <Loader2Icon className="size-6 animate-spin opacity-60" />
        <p className="text-sm">Loading candidates…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive">
        <p className="text-sm">Failed to load candidates</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (allPairs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <UsersIcon className="size-8 opacity-40" />
        <p className="text-sm">No candidates assigned to this job yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
            {allPairs.length} Candidate{allPairs.length !== 1 ? 's' : ''}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center gap-1.5 h-7 rounded-full border border-dashed bg-card px-2.5 text-xs hover:bg-accent transition-colors',
                  sortKey !== 'default' &&
                    'border-solid border-primary text-primary'
                )}
              >
                <ArrowDownUpIcon className="size-3" />
                {sortKey === 'default'
                  ? 'Sort'
                  : `Sort: ${SORT_LABELS[sortKey]}`}
                <ChevronDownIcon className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onSelect={() => setSortKey('default')}
                className={cn(
                  'text-sm',
                  sortKey === 'default' && 'font-medium text-primary'
                )}
              >
                Default
              </DropdownMenuItem>
              {(['pending', 'approved'] as const).map(key => (
                <DropdownMenuItem
                  key={key}
                  onSelect={() => setSortKey(key)}
                  className={cn(
                    'text-sm',
                    sortKey === key && 'font-medium text-primary'
                  )}
                >
                  {SORT_LABELS[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/ats/candidates?jobId=${job._id}`)}
          className="inline-flex items-center gap-1.5 h-7 rounded-md border bg-card px-2.5 text-xs hover:bg-accent transition-colors"
        >
          <ExternalLinkIcon className="size-3" />
          View in Candidates
        </button>
      </div>

      {/* Phase filter chips with live counts. */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PHASE_FILTERS.map(f => {
          const count = countByPhase[f.key];
          const active = phaseFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setPhaseFilter(f.key)}
              className={cn(
                'inline-flex items-center gap-1.5 h-7 rounded-full border px-2.5 text-xs transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-accent'
              )}
            >
              {f.label}
              <span
                className={cn(
                  'text-[10px] font-semibold tabular-nums rounded-full px-1.5 py-px leading-none',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground/80'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {pairs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
          <UsersIcon className="size-7 opacity-40" />
          <p className="text-sm">
            No candidates in{' '}
            {PHASE_FILTERS.find(
              f => f.key === phaseFilter
            )?.label.toLowerCase()}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pairs.map(({ candidate, application }) => {
            const { label: phaseLabel, cls: phaseCls } =
              phaseConfig[application.phase];
            const firstTag = firstTagByCandidate.get(candidate._id) ?? null;

            return (
              <button
                key={application._id}
                type="button"
                onClick={() => {
                  setSelectedCandidate(candidate);
                  setDetailOpen(true);
                }}
                className="group w-full text-left rounded-xl border bg-card overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all dark:bg-white/4 dark:border-white/[0.07] dark:hover:bg-white/8 dark:hover:border-primary/40"
              >
                {/* Identity band */}
                <div className="flex items-center gap-3 px-4 pt-3.5 pb-3 min-w-0">
                  <div
                    className={cn(
                      'size-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 select-none ring-1 ring-black/5 dark:ring-white/10',
                      avatarBg(candidate.firstName)
                    )}
                  >
                    {candidate.firstName[0]}
                    {candidate.lastName[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">
                        {candidate.firstName} {candidate.lastName}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {candidate.email}
                    </p>
                  </div>

                  {/* Phase + current pipeline stage pinned to top-right */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={cn(
                        'inline-flex items-center h-5 px-1.5 text-[10px] font-medium leading-none rounded-full border',
                        phaseCls
                      )}
                    >
                      {phaseLabel}
                    </span>
                    {application.currentStage && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/80 shrink-0 rounded-full border border-border/70 bg-muted/50 px-2 h-5 leading-none"
                        title={`Pipeline stage: ${application.currentStage.stageName}`}
                      >
                        <LayersIcon className="size-3" />
                        <span className="truncate max-w-30">
                          {application.currentStage.stageName}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Signals strip — single line, tag truncates when needed */}
                <div className="flex items-center gap-2 px-4 pb-3 text-[11px] text-muted-foreground overflow-hidden">
                  {candidate.yearsOfExperience > 0 && (
                    <span className="inline-flex items-center gap-1 shrink-0 font-semibold text-foreground">
                      <BriefcaseIcon className="size-3" />
                      {candidate.yearsOfExperience}y exp
                    </span>
                  )}
                  {firstTag?.name && firstTag.color && (
                    <span
                      className="inline-flex items-center rounded-full border px-1.5 h-5 font-medium shrink-0"
                      style={{
                        borderColor: firstTag.color + '70',
                        color: firstTag.color,
                        backgroundColor: firstTag.color + '12',
                      }}
                    >
                      {firstTag.name}
                    </span>
                  )}
                </div>

                {/* Meta footer: source + applied date pinned to the sides */}
                <div className="flex items-center justify-between gap-2 px-4 py-2 border-t bg-muted/40 dark:bg-white/2 text-[10px] text-muted-foreground/80">
                  <span className="inline-flex items-center gap-1">
                    {candidate.source === 'applied' ? (
                      <UserIcon className="size-3" />
                    ) : (
                      <UploadIcon className="size-3" />
                    )}
                    {candidate.source === 'applied' ? 'Applied' : 'Uploaded'}
                  </span>
                  <span
                    className="inline-flex items-center gap-1"
                    title={formatDate(application.appliedAt)}
                  >
                    <CalendarClockIcon className="size-3" />
                    {formatDate(application.appliedAt)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CandidateDetailSheet
        candidate={selectedCandidate}
        open={detailOpen}
        onOpenChange={open => {
          setDetailOpen(open);
          if (!open) setSelectedCandidate(null);
        }}
      />
    </div>
  );
}
