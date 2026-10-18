import type { Application, Job, PipelineTemplate } from '@/store';
import { useApplicationStore } from '@/store';
import { useEffect, useMemo, useState } from 'react';
import {
  buildStageSummary,
  summaryToRemapRows,
  type RemapRow,
} from '../_utils/pipeline-change';

interface UsePipelineChangeArgs {
  open: boolean;
  job: Job;
  newTemplate: PipelineTemplate;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (stageMapping?: Record<string, string>) => void | Promise<void>;
}

export function usePipelineChange({
  open,
  job,
  newTemplate,
  loading,
  onOpenChange,
  onConfirm,
}: UsePipelineChangeArgs) {
  const fetchApps = useApplicationStore(s => s.fetchScoped);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appLoading, setAppLoading] = useState(false);
  const [showRemapper, setShowRemapper] = useState(false);
  const [remapRows, setRemapRows] = useState<RemapRow[] | null>(null);

  useEffect(() => {
    if (open && job._id) {
      setAppLoading(true);
      setShowRemapper(false);
      // Scoped read — this dialog needs one job's applications and must not
      // replace the shared list other screens depend on.
      fetchApps({ jobId: job._id, limit: 9999 })
        .then(setApplications)
        .catch(() => setApplications([]))
        .finally(() => setAppLoading(false));
    }
  }, [open, job._id, fetchApps]);

  const oldStages = job.pipeline?.stages ?? [];
  const newStages = newTemplate.stages;

  const summary = useMemo(
    () => buildStageSummary(applications, oldStages, newStages),
    [applications, oldStages, newStages]
  );

  const totalCandidates = summary.reduce((s, x) => s + x.candidateCount, 0);
  const matchedCount = summary
    .filter(x => x.matched)
    .reduce((s, x) => s + x.candidateCount, 0);
  const unmatchedCount = totalCandidates - matchedCount;
  const pendingCount = applications.filter(
    a => a.jobId === job._id && a.phase === 'pending'
  ).length;

  // With no candidates in any stage there is nothing to confirm.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appLoading, applications.length, totalCandidates, showRemapper]);

  function startRemap() {
    setRemapRows(summaryToRemapRows(summary));
    setShowRemapper(true);
  }

  function selectNewStage(oldStageName: string, newStageName: string) {
    setRemapRows(
      prev =>
        prev?.map(r =>
          r.oldStageName === oldStageName
            ? { ...r, selectedNewStageName: newStageName }
            : r
        ) ?? null
    );
  }

  function confirm() {
    if (showRemapper && remapRows) {
      void onConfirm(
        Object.fromEntries(
          remapRows.map(r => [r.oldStageName, r.selectedNewStageName])
        )
      );
    } else {
      void onConfirm();
    }
  }

  return {
    oldStages,
    newStages,
    summary,
    totalCandidates,
    matchedCount,
    unmatchedCount,
    pendingCount,
    isLoading: appLoading || loading,
    showRemapper,
    remapRows,
    startRemap,
    closeRemap: () => setShowRemapper(false),
    selectNewStage,
    confirm,
  };
}
