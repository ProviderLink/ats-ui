import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import { CheckIcon, SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface RestoreCandidateJob {
  _id: string;
  title: string;
  clientName: string;
}

/**
 * Confirm restoring a permanently ineligible candidate.
 *
 * A job is always required: the candidate returns to **In Review** as a normal
 * pending applicant for that job and must be approved through the usual flow —
 * no application is created at restore time.
 *
 * `blockedJobIds` disables jobs the candidate already holds an application for.
 * The `(candidateId, jobId)` index is unique regardless of phase, so restoring
 * onto one of those would block the approval that follows; the dialog disables
 * them rather than letting the user walk into that error.
 *
 * Shared by the Ineligible list and the candidate detail sheet so the two can
 * never drift apart.
 */
export function RestoreCandidateDialog({
  candidate,
  jobs,
  blockedJobIds,
  submitting,
  onClose,
  onConfirm,
}: {
  candidate: Candidate | null;
  jobs: RestoreCandidateJob[];
  blockedJobIds: Set<string>;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (candidate: Candidate, jobId: string) => void;
}) {
  return (
    <Dialog open={!!candidate} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {/* Keyed so the form resets when the target candidate changes. */}
        {candidate && (
          <RestoreForm
            key={candidate._id}
            candidate={candidate}
            jobs={jobs}
            blockedJobIds={blockedJobIds}
            submitting={submitting}
            onClose={onClose}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RestoreForm({
  candidate,
  jobs,
  blockedJobIds,
  submitting,
  onClose,
  onConfirm,
}: {
  candidate: Candidate;
  jobs: RestoreCandidateJob[];
  blockedJobIds: Set<string>;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (candidate: Candidate, jobId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        j.clientName.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  const allBlocked =
    jobs.length > 0 && jobs.every(j => blockedJobIds.has(j._id));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Restore Candidate</DialogTitle>
        <DialogDescription>
          Restoring{' '}
          <span className="font-medium text-foreground">
            {candidate.firstName} {candidate.lastName}
          </span>{' '}
          clears their permanent ineligibility. Choose the job they are being
          considered for — they return to <strong>In Review</strong> and must be
          approved like any new applicant.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search jobs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="max-h-64 overflow-y-auto rounded-md border">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No open jobs found
            </p>
          ) : (
            <div className="flex flex-col">
              {filtered.map(j => {
                const blocked = blockedJobIds.has(j._id);
                return (
                  <button
                    key={j._id}
                    type="button"
                    disabled={blocked}
                    title={
                      blocked
                        ? 'This candidate already has an application for this job'
                        : undefined
                    }
                    className={cn(
                      'flex items-start gap-2 px-3 py-2 text-sm text-left transition-colors',
                      blocked
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-muted',
                      selectedJobId === j._id && 'bg-muted font-medium'
                    )}
                    onClick={() => !blocked && setSelectedJobId(j._id)}
                  >
                    <span
                      className={cn(
                        'mt-0.5 size-4 rounded-full border flex items-center justify-center shrink-0',
                        selectedJobId === j._id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {selectedJobId === j._id && (
                        <CheckIcon className="size-3" />
                      )}
                    </span>
                    <span className="min-w-0 flex flex-col">
                      <span className="truncate">{j.title}</span>
                      {j.clientName && (
                        <span className="text-xs text-muted-foreground truncate">
                          {j.clientName}
                        </span>
                      )}
                      {blocked && (
                        <span className="text-xs text-muted-foreground truncate">
                          Already applied — not available
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {jobs.length === 0 && (
          <p className="text-xs text-muted-foreground">
            There are no open jobs. Open a job before restoring a candidate.
          </p>
        )}
        {allBlocked && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            This candidate already has an application for every open job, so
            none are available for restore.
          </p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          disabled={!selectedJobId || submitting}
          onClick={() => {
            if (selectedJobId) onConfirm(candidate, selectedJobId);
          }}
        >
          {submitting ? 'Restoring…' : 'Restore'}
        </Button>
      </DialogFooter>
    </>
  );
}
