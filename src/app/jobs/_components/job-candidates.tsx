import { CandidateDetailSheet } from '@/app/candidates/_components/candidate-detail-sheet';
import { useTagStore } from '@/store/slices/tags.store';
import type { Candidate, Job } from '@/store';
import type { ApplicationPhase } from '@/store/types';
import {
  ExternalLinkIcon,
  Loader2Icon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobCandidatesData } from '../_hooks/use-job-candidates-data';
import {
  countByPhase,
  filterAndSortPairs,
  firstTagByCandidate,
  PHASE_FILTERS,
  pairWithCandidates,
  type SortKey,
} from '../_utils/job-candidates';
import { CandidateRowCard } from './job-candidates/candidate-row-card';
import { PhaseFilterChips } from './job-candidates/phase-filter-chips';
import { SortMenu } from './job-candidates/sort-menu';

interface JobCandidatesProps {
  job: Job;
}

export function JobCandidates({ job }: JobCandidatesProps) {
  const navigate = useNavigate();
  const { applications, candidates, loading, error } = useJobCandidatesData(
    job._id
  );
  const tags = useTagStore(s => s.items);

  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [phaseFilter, setPhaseFilter] = useState<ApplicationPhase>('approved');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );

  const allPairs = useMemo(
    () => pairWithCandidates(applications, candidates),
    [applications, candidates]
  );
  const counts = useMemo(() => countByPhase(allPairs), [allPairs]);
  const pairs = useMemo(
    () => filterAndSortPairs(allPairs, phaseFilter, sortKey),
    [allPairs, phaseFilter, sortKey]
  );
  const firstTags = useMemo(
    () => firstTagByCandidate(allPairs, tags),
    [allPairs, tags]
  );

  const quickImportPath = `/ats/candidates/quick-import?jobId=${job._id}`;

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
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <UsersIcon className="size-8 opacity-40" />
        <p className="text-sm">No candidates assigned to this job yet</p>
        <button
          type="button"
          onClick={() => navigate(quickImportPath)}
          className="inline-flex items-center gap-1.5 h-8 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <UserPlusIcon className="size-4" />
          Add Candidate to This Job
        </button>
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
          <SortMenu value={sortKey} onChange={setSortKey} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(quickImportPath)}
            className="inline-flex items-center gap-1.5 h-7 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <UserPlusIcon className="size-3" />
            Add Candidate to This Job
          </button>
          <button
            type="button"
            onClick={() => navigate(`/ats/candidates?jobId=${job._id}`)}
            className="inline-flex items-center gap-1.5 h-7 rounded-md border bg-card px-2.5 text-xs hover:bg-accent transition-colors"
          >
            <ExternalLinkIcon className="size-3" />
            View in Candidates
          </button>
        </div>
      </div>

      <PhaseFilterChips
        value={phaseFilter}
        counts={counts}
        onChange={setPhaseFilter}
      />

      {pairs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
          <UsersIcon className="size-7 opacity-40" />
          <p className="text-sm">
            No candidates in{' '}
            {PHASE_FILTERS.find(f => f.key === phaseFilter)?.label.toLowerCase()}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pairs.map(pair => (
            <CandidateRowCard
              key={pair.application._id}
              {...pair}
              tag={firstTags.get(pair.candidate._id) ?? null}
              onOpen={() => setSelectedCandidate(pair.candidate)}
            />
          ))}
        </div>
      )}

      <CandidateDetailSheet
        candidate={selectedCandidate}
        open={!!selectedCandidate}
        onOpenChange={open => {
          if (!open) setSelectedCandidate(null);
        }}
      />
    </div>
  );
}
