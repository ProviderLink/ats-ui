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
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckIcon, SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface JobOption {
  _id: string;
  title: string;
  clientName?: string;
  stages?: { _id: string; name: string }[];
}

interface ChangeJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName?: string;
  /** Job the candidate is currently on, when changing rather than adding. */
  currentJobTitle?: string;
  jobs: JobOption[];
  submitting?: boolean;
  /** When set, the dialog performs a move; otherwise it is an add. */
  mode: 'change' | 'add';
  onConfirm: (jobId: string, startStageId?: string) => void;
}

/**
 * Job picker used by the "Job & Stage" control on the candidate screen.
 *
 * In `change` mode the chosen job replaces the current one: the existing
 * application is closed and a new one opened, because `jobId` is part of the
 * application's unique key and cannot be edited in place. In `add` mode the
 * candidate simply gains an additional application.
 */
export function ChangeJobDialog({
  open,
  onOpenChange,
  candidateName,
  currentJobTitle,
  jobs,
  submitting = false,
  mode,
  onConfirm,
}: ChangeJobDialogProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <ChangeJobForm
            key={`${mode}:${currentJobTitle ?? ''}`}
            candidateName={candidateName}
            currentJobTitle={currentJobTitle}
            jobs={jobs}
            submitting={submitting}
            mode={mode}
            onCancel={() => onOpenChange(false)}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChangeJobForm({
  candidateName,
  currentJobTitle,
  jobs,
  submitting,
  mode,
  onCancel,
  onConfirm,
}: {
  candidateName?: string;
  currentJobTitle?: string;
  jobs: JobOption[];
  submitting: boolean;
  mode: 'change' | 'add';
  onCancel: () => void;
  onConfirm: (jobId: string, startStageId?: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    // When changing, the current job is not a valid target.
    const base =
      mode === 'change' ? jobs.filter(j => j.title !== currentJobTitle) : jobs;
    if (!q) return base;
    return base.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        (j.clientName ?? '').toLowerCase().includes(q)
    );
  }, [jobs, search, mode, currentJobTitle]);

  const selectedJob = useMemo(
    () => jobs.find(j => j._id === selectedJobId),
    [jobs, selectedJobId]
  );
  const stages = selectedJob?.stages ?? [];

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {mode === 'change' ? 'Change Job' : 'Add to Another Job'}
        </DialogTitle>
        <DialogDescription>
          {mode === 'change' ? (
            <>
              Move <span className="font-medium">{candidateName}</span> from{' '}
              <span className="font-medium">
                {currentJobTitle ?? 'their job'}
              </span>{' '}
              to another position. The current application is closed and their
              history is preserved.
            </>
          ) : (
            <>
              Also assign <span className="font-medium">{candidateName}</span>{' '}
              to another open position. This does not remove them from{' '}
              <span className="font-medium">
                {currentJobTitle ?? 'their job'}
              </span>
              .
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3 py-1">
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
              {filtered.map(j => (
                <button
                  key={j._id}
                  type="button"
                  className={cn(
                    'flex items-start gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                    selectedJobId === j._id && 'bg-muted font-medium'
                  )}
                  onClick={() => {
                    setSelectedJobId(j._id);
                    setSelectedStageId('');
                  }}
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
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedJobId && stages.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Starting stage (optional)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {stages.map(s => (
                <button
                  key={s._id}
                  type="button"
                  className={cn(
                    'rounded-md border px-2 py-1 text-xs transition-colors',
                    selectedStageId === s._id
                      ? 'border-primary bg-primary/10 font-medium'
                      : 'hover:bg-muted'
                  )}
                  onClick={() =>
                    setSelectedStageId(prev => (prev === s._id ? '' : s._id))
                  }
                >
                  {s.name}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Defaults to the first stage of the job&apos;s pipeline.
            </p>
          </div>
        )}

        {mode === 'change' && (
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            The candidate&apos;s current application is closed and appears in
            the old job&apos;s Rejected column, so history stays traceable.
            Their interviews, emails, and notes remain attached to the old job.
          </p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          disabled={!selectedJobId || submitting}
          onClick={() => onConfirm(selectedJobId, selectedStageId || undefined)}
        >
          {submitting
            ? mode === 'change'
              ? 'Moving…'
              : 'Assigning…'
            : mode === 'change'
              ? 'Change Job'
              : 'Assign'}
        </Button>
      </DialogFooter>
    </>
  );
}
