import { Button } from '@/components/ui/button';
import type { Candidate } from '@/store/types';
import { RefreshCwIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { requestAiRecheck } from '../_utils/ai-recheck';

/** Give up showing the spinner after this long; results may still land. */
const SPINNER_MAX_MS = 3 * 60_000;

/** Re-read this candidate's resume and redo the AI validation and score. */
export function AiRecheckButton({ candidate }: { candidate: Candidate }) {
  // The AI results as they were when the re-check started; null when idle.
  const [startedWith, setStartedWith] = useState<unknown[] | null>(null);
  const current = [candidate.aiValidation, candidate.aiScore];
  // A realtime update replaces these objects, which ends the spinner.
  const checking =
    startedWith !== null && current.every((v, i) => v === startedWith[i]);

  // Stop showing the spinner after a few minutes even if nothing changed.
  useEffect(() => {
    if (!startedWith) return;
    const t = setTimeout(() => setStartedWith(null), SPINNER_MAX_MS);
    return () => clearTimeout(t);
  }, [startedWith]);

  async function run() {
    setStartedWith(current);
    try {
      await requestAiRecheck([candidate._id]);
      toast.success(
        'Re-checking with AI. New results show up in a minute or two.'
      );
    } catch (e) {
      setStartedWith(null);
      toast.error((e as Error).message);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 px-2 text-xs"
      onClick={run}
      disabled={checking}
      title="Read the resume again and redo the AI validation and score"
    >
      <RefreshCwIcon className={checking ? 'size-3.5 animate-spin' : 'size-3.5'} />
      {checking ? 'Checking…' : 'Re-check with AI'}
    </Button>
  );
}
