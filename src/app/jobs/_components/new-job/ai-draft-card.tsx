import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2Icon, SparklesIcon } from 'lucide-react';
import type { useJobAi } from '../../_hooks/use-job-ai';
import { AiCardShell } from './ai-card-shell';

interface AiDraftCardProps {
  ai: ReturnType<typeof useJobAi>;
}

/** Creation only: turn rough notes into a structured job posting. */
export function AiDraftCard({ ai }: AiDraftCardProps) {
  const count = ai.aiFilledCount;

  return (
    <AiCardShell
      title="Start with AI"
      subtitle={
        count > 0
          ? `${count} section${count === 1 ? '' : 's'} filled — edit anything below`
          : 'Write your rough notes and let AI structure the posting'
      }
      expanded={ai.aiExpanded}
      onToggle={ai.toggleAiExpanded}
    >
      <Textarea
        value={ai.aiNotes}
        onChange={e => ai.updateAiNotes(e.target.value)}
        rows={6}
        placeholder="Dump everything about this job — role, duties, must-haves, nice-to-haves, tools, location, pay. AI structures it without adding anything you did not mention."
      />
      <Button
        type="button"
        onClick={ai.handleGenerateClick}
        disabled={ai.aiGenerating || ai.confirmOverwrite || !ai.aiCanGenerate}
        className="w-full gap-1.5 hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
      >
        {ai.aiGenerating ? (
          <>
            <Loader2Icon className="size-3.5 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <SparklesIcon className="size-3.5" />
            {count > 0 ? 'Regenerate' : 'Generate'}
          </>
        )}
      </Button>
      {ai.confirmOverwrite ? (
        <div className="flex flex-col gap-2 rounded-md border border-warning/40 bg-warning/10 p-3">
          <p className="text-xs text-foreground">
            {ai.aiOverwriteCount} field
            {ai.aiOverwriteCount === 1 ? ' already has' : 's already have'}{' '}
            content. Generating will replace{' '}
            {ai.aiOverwriteCount === 1 ? 'it' : 'them'}.
          </p>
          <div className="flex flex-row gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={ai.cancelOverwrite}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1 hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
              onClick={() => void ai.runAiGenerate()}
            >
              Replace &amp; generate
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Fills the title, description, requirements, responsibilities, skills
          and benefits. Everything stays editable and nothing is saved until you
          press Add Job.
        </p>
      )}
    </AiCardShell>
  );
}
