import { Button } from '@/components/ui/button';
import { Loader2Icon, RotateCcwIcon, SparklesIcon } from 'lucide-react';
import type { useJobAi } from '../../_hooks/use-job-ai';
import { AiCardShell } from './ai-card-shell';

interface AiImproveCardProps {
  ai: ReturnType<typeof useJobAi>;
}

/** Edit mode only: tidy the four list fields of an existing job. */
export function AiImproveCard({ ai }: AiImproveCardProps) {
  const count = ai.aiFilledCount;

  return (
    <AiCardShell
      title="Improve with AI"
      subtitle={
        count > 0
          ? `${count} section${count === 1 ? '' : 's'} tidied — check below`
          : 'Tidy up the requirements, responsibilities, skills and benefits'
      }
      expanded={ai.aiExpanded}
      onToggle={ai.toggleAiExpanded}
    >
      <Button
        type="button"
        onClick={() => void ai.runStandardize()}
        disabled={ai.aiGenerating || !ai.aiHasListContent}
        className="w-full gap-1.5 hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
      >
        {ai.aiGenerating ? (
          <>
            <Loader2Icon className="size-3.5 animate-spin" />
            Improving…
          </>
        ) : (
          <>
            <SparklesIcon className="size-3.5" />
            {count > 0 ? 'Improve again' : 'Improve content'}
          </>
        )}
      </Button>

      {ai.aiOriginal && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={ai.revertStandardize}
          disabled={ai.aiGenerating}
          className="w-full gap-1.5"
        >
          <RotateCcwIcon className="size-3.5" />
          Revert to original
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Reads the lists already on this job, merges duplicates and fixes
        wording, formatting and misplaced points. It never invents a new point
        and never drops an existing one. Only these four lists change — nothing
        is saved until you press Save Changes.
      </p>
    </AiCardShell>
  );
}
