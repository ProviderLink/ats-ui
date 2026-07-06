import {
  avatarBg,
  scoreTextColor,
  statusConfig,
} from '@/app/candidates/_utils/candidate-styles';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Candidate, Job } from '@/store';
import { useApplicationStore, useCandidateStore } from '@/store';
import { CheckIcon, SearchIcon, UserPlusIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  job: Job;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function AssignCandidateDialog({ job, open, onOpenChange }: Props) {
  const {
    items: candidates,
    fetch: fetchCandidates,
    assignJob,
    mutating,
  } = useCandidateStore();
  const { items: applications, fetch: fetchApplications } =
    useApplicationStore();

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      void fetchCandidates();
      void fetchApplications({ jobId: job._id });
    }
  }, [open, job._id]);

  const assignedIds = useMemo(
    () =>
      new Set(
        applications.filter(a => a.jobId === job._id).map(a => a.candidateId)
      ),
    [applications, job._id]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return candidates.filter(c => {
      if (assignedIds.has(c._id)) return false;
      if (!q) return true;
      return (
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    });
  }, [query, candidates, assignedIds]);

  async function handleAssign() {
    if (!selectedId) return;
    await assignJob(selectedId, job._id);
    void fetchApplications({ jobId: job._id });
    onOpenChange(false);
    setSelectedId(null);
    setQuery('');
  }

  function handleClose() {
    onOpenChange(false);
    setSelectedId(null);
    setQuery('');
  }

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>Assign Candidate</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Assign an existing candidate to{' '}
            <span className="font-medium text-foreground">{job.title}</span>.
          </p>
        </DialogHeader>

        <div className="px-5 pb-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              className="pl-8"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-72 border-t border-b mx-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-muted-foreground">
              <UserPlusIcon className="size-6 opacity-40" />
              <p className="text-sm">No candidates found</p>
            </div>
          ) : (
            <ul>
              {filtered.map(c => (
                <CandidateRow
                  key={c._id}
                  candidate={c}
                  selected={selectedId === c._id}
                  onSelect={() =>
                    setSelectedId(prev => (prev === c._id ? null : c._id))
                  }
                />
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="px-5 py-4 gap-2">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={!selectedId || mutating}
            onClick={() => void handleAssign()}
          >
            Assign Candidate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CandidateRow({
  candidate,
  selected,
  onSelect,
}: {
  candidate: Candidate;
  selected: boolean;
  onSelect: () => void;
}) {
  const { label: statusLabel, cls: statusCls } = statusConfig[candidate.status];
  const score = candidate.aiScore?.score ?? 0;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-accent/50',
          selected && 'bg-accent/60'
        )}
      >
        <div
          className={cn(
            'size-8 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 select-none',
            avatarBg(candidate.firstName)
          )}
        >
          {candidate.firstName[0]}
          {candidate.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight truncate">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {candidate.email}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {score > 0 && (
            <span
              className={cn(
                'text-xs font-medium tabular-nums',
                scoreTextColor(score)
              )}
            >
              {score}
            </span>
          )}
          <span className={cn('text-xs hidden sm:block', statusCls)}>
            {statusLabel}
          </span>
          {selected && <CheckIcon className="size-4 text-primary shrink-0" />}
        </div>
      </button>
    </li>
  );
}
