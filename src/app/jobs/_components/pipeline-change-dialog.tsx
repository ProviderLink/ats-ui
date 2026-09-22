import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Application, Job, PipelineTemplate, StageShape } from '@/store';
import { useApplicationStore } from '@/store';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface StageSummary {
  oldStage: StageShape;
  candidateCount: number;
  matched: boolean;
  newStageName: string;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  newTemplate: PipelineTemplate;
  loading: boolean;
  onConfirm: (stageMapping?: Record<string, string>) => void | Promise<void>;
};

export function PipelineChangeDialog({
  open,
  onOpenChange,
  job,
  newTemplate,
  loading,
  onConfirm,
}: Props) {
  const { fetchScoped: fetchApps } = useApplicationStore();
  const [scopedApps, setScopedApps] = useState<Application[]>([]);
  const [appLoading, setAppLoading] = useState(false);
  const [showRemapper, setShowRemapper] = useState(false);

  useEffect(() => {
    if (open && job._id) {
      setAppLoading(true);
      setShowRemapper(false);
      // Scoped read — this dialog needs one job's applications and must not
      // replace the shared list other screens depend on.
      fetchApps({ jobId: job._id, limit: 9999 })
        .then(setScopedApps)
        .catch(() => setScopedApps([]))
        .finally(() => setAppLoading(false));
    }
  }, [open, job._id, fetchApps]);

  const applications = scopedApps;

  const oldStages = job.pipeline?.stages ?? [];
  const newStages = newTemplate.stages;
  const newStageNames = useMemo(
    () => new Set(newStages.map(s => s.name.toLowerCase())),
    [newStages]
  );

  const summary: StageSummary[] = useMemo(() => {
    if (!applications.length || !oldStages.length) return [];

    const appsByStageName = new Map<string, Application[]>();
    for (const app of applications) {
      if (app.currentStage?.stageName) {
        const name = app.currentStage.stageName;
        if (!appsByStageName.has(name)) appsByStageName.set(name, []);
        appsByStageName.get(name)!.push(app);
      }
    }

    return oldStages.map(oldStage => {
      const apps = appsByStageName.get(oldStage.name) ?? [];
      const matched = newStageNames.has(oldStage.name.toLowerCase());
      return {
        oldStage,
        candidateCount: apps.length,
        matched,
        newStageName: matched
          ? oldStage.name
          : (newStages[0]?.name ?? 'Stage 1'),
      };
    });
  }, [applications, oldStages, newStages, newStageNames]);

  const totalCandidates = summary.reduce((s, x) => s + x.candidateCount, 0);
  const matchedCount = summary
    .filter(x => x.matched)
    .reduce((s, x) => s + x.candidateCount, 0);
  const unmatchedCount = totalCandidates - matchedCount;
  const pendingCount = applications.filter(
    a => a.jobId === job._id && a.phase === 'pending'
  ).length;

  const isLoading = appLoading || loading;

  const handleConfirm = () => {
    if (showRemapper && remapState) {
      const mapping = Object.fromEntries(
        remapState.map(r => [r.oldStageName, r.selectedNewStageName])
      );
      void onConfirm(mapping);
    } else {
      void onConfirm();
    }
  };

  // --- Manual remap state ---
  const [remapState, setRemapState] = useState<
    | {
        oldStageName: string;
        candidateCount: number;
        selectedNewStageName: string;
        wasAutoMatched: boolean;
      }[]
    | null
  >(null);

  const initRemapper = () => {
    setRemapState(
      summary.map(s => ({
        oldStageName: s.oldStage.name,
        candidateCount: s.candidateCount,
        selectedNewStageName: s.newStageName,
        wasAutoMatched: s.matched,
      }))
    );
    setShowRemapper(true);
  };

  // If no candidates in stages at all, skip dialog and confirm immediately
  useEffect(() => {
    if (
      open &&
      !appLoading &&
      applications.length > 0 &&
      totalCandidates === 0 &&
      !showRemapper
    ) {
      onOpenChange(false);
      void onConfirm();
    }
  }, [open, appLoading, applications.length, totalCandidates, showRemapper]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change Pipeline</DialogTitle>
          <DialogDescription>
            Switching from{' '}
            <span className="font-medium text-foreground">
              {oldStages.length > 0
                ? oldStages.map(s => s.name).join(' → ')
                : 'no pipeline'}
            </span>{' '}
            to{' '}
            <span className="font-medium text-foreground">
              {newStages.map(s => s.name).join(' → ')}
            </span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : showRemapper && remapState ? (
          /* ----- Manual Remap Table ----- */
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Map each old stage to a new stage. Select where each group of
              candidates should land.
            </p>
            <div className="rounded-md border">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 border-b">
                <span>Old Stage</span>
                <span className="text-center">#</span>
                <span>New Stage</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {remapState.map(row => (
                  <div
                    key={row.oldStageName}
                    className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center px-3 py-2 border-b last:border-b-0 text-sm"
                  >
                    <span className="truncate">{row.oldStageName}</span>
                    <Badge
                      variant="secondary"
                      className="h-5 w-8 justify-center text-[11px] shrink-0"
                    >
                      {row.candidateCount}
                    </Badge>
                    <select
                      value={row.selectedNewStageName}
                      onChange={e => {
                        setRemapState(prev =>
                          prev
                            ? prev.map(r =>
                                r.oldStageName === row.oldStageName
                                  ? {
                                      ...r,
                                      selectedNewStageName: e.target.value,
                                    }
                                  : r
                              )
                            : null
                        );
                      }}
                      className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                    >
                      {newStages.map(ns => (
                        <option key={ns._id} value={ns.name}>
                          {ns.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRemapper(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to summary
            </button>
          </div>
        ) : (
          /* ----- Summary View ----- */
          <div className="space-y-4">
            {totalCandidates > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
                  <span>
                    {matchedCount} candidates will stay in their current stage
                  </span>
                </div>
                {unmatchedCount > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangleIcon className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      {unmatchedCount} candidates will be moved to{' '}
                      <strong>{newStages[0]?.name ?? 'Stage 1'}</strong> — their
                      stage has no match in the new pipeline
                    </span>
                  </div>
                )}
                {pendingCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRightIcon className="size-4 shrink-0" />
                    <span>
                      {pendingCount} pending candidates are unaffected
                    </span>
                  </div>
                )}

                <div className="rounded-md border">
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 border-b">
                    <span>Old Stage</span>
                    <span></span>
                    <span>New Stage</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {summary.map(s => (
                      <div
                        key={s.oldStage._id}
                        className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center px-3 py-2 border-b last:border-b-0 text-sm"
                      >
                        <span className="truncate">{s.oldStage.name}</span>
                        <span className="text-center text-muted-foreground text-xs">
                          {s.candidateCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="h-5 text-[10px]"
                            >
                              {s.candidateCount}
                            </Badge>
                          )}
                        </span>
                        <span
                          className={
                            s.matched
                              ? 'text-emerald-600 dark:text-emerald-400 truncate'
                              : 'text-amber-600 dark:text-amber-400 truncate'
                          }
                        >
                          {s.newStageName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No candidates are currently in pipeline stages. The pipeline
                will be changed without affecting any candidates.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          {!showRemapper && totalCandidates > 0 && unmatchedCount > 0 && (
            <Button
              variant="outline"
              onClick={initRemapper}
              disabled={isLoading}
            >
              Fix Manually
            </Button>
          )}
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2Icon className="size-4 animate-spin mr-1" />}
            {showRemapper ? 'Apply Mapping' : 'Confirm Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
