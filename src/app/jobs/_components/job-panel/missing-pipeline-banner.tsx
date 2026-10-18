import { LayersIcon } from 'lucide-react';

export function MissingPipelineBanner() {
  return (
    <div className="mx-6 mt-3 px-4 py-2.5 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30 flex items-center gap-3">
      <LayersIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-xs text-amber-800 dark:text-amber-200 flex-1">
        This job has no pipeline. Candidates in pending phase cannot be approved
        until a pipeline is assigned. Use the pipeline selector above to assign
        one.
      </p>
    </div>
  );
}
