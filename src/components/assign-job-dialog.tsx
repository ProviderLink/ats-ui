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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CheckIcon, SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

const FIRST_STAGE_VALUE = '__first__';

interface AssignJobOption {
  _id: string;
  title: string;
  clientName?: string;
  stages?: { _id: string; name: string }[];
}

interface AssignJobDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (jobId: string, startStageId?: string) => void;
  jobs: AssignJobOption[];
  description?: string;
}

export function AssignJobDialog({
  open,
  onClose,
  onConfirm,
  jobs,
  description,
}: AssignJobDialogProps) {
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        (j.clientName ?? '').toLowerCase().includes(q)
    );
  }, [jobs, search]);

  const selectedJob = useMemo(
    () => jobs.find(j => j._id === selected),
    [jobs, selected]
  );
  const stages = selectedJob?.stages ?? [];

  const handleSelectJob = (jobId: string) => {
    setSelected(jobId);
    setSelectedStageId('');
  };

  const reset = () => {
    setSelected('');
    setSearch('');
    setSelectedStageId('');
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign to a new job</DialogTitle>
          <DialogDescription className={description ? undefined : 'sr-only'}>
            {description ?? 'Search for a job and assign this candidate to it.'}
          </DialogDescription>
        </DialogHeader>
        {/*
          `min-w-0` is required. `DialogContent` is a grid, and a grid item's
          automatic minimum size is its content, so a long job title made this
          column wider than the dialog — the list then overflowed past the
          padding and the dialog's right gutter looked like zero.
        */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search jobs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="max-h-56 overflow-y-auto rounded-md border">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No jobs found
              </p>
            ) : (
              <div className="flex flex-col">
                {filtered.map(j => (
                  <button
                    key={j._id}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                      selected === j._id && 'bg-muted font-medium'
                    )}
                    onClick={() => handleSelectJob(j._id)}
                  >
                    <span
                      className={cn(
                        'size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5',
                        selected === j._id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {selected === j._id && <CheckIcon className="size-3" />}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="truncate">{j.title}</span>
                      {j.clientName && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          {j.clientName}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {stages.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Starting pipeline stage (optional)
              </Label>
              <Select
                value={selectedStageId}
                onValueChange={setSelectedStageId}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="First stage (default)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FIRST_STAGE_VALUE}>
                    First stage (default)
                  </SelectItem>
                  {stages.map(s => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              onConfirm(
                selected,
                selectedStageId === FIRST_STAGE_VALUE
                  ? undefined
                  : selectedStageId || undefined
              );
              reset();
            }}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
