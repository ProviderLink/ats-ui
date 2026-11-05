import { TooltipProvider } from '@/components/ui/tooltip';
import type { Candidate } from '@/store/types';
import { ShieldOffIcon, Trash2Icon } from 'lucide-react';
import { IconActionButton } from './icon-action-button';

interface IneligibleRowActionsProps {
  candidate: Candidate;
  restoring: boolean;
  deleting: boolean;
  onRestore: () => void;
  onDelete: () => void;
}

export function IneligibleRowActions({
  candidate,
  restoring,
  deleting,
  onRestore,
  onDelete,
}: IneligibleRowActionsProps) {
  const name = `${candidate.firstName} ${candidate.lastName}`;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex items-center justify-center gap-1"
        onClick={e => e.stopPropagation()}
      >
        <IconActionButton
          label={`Restore ${name}`}
          tooltip="Restore candidate (requires a job)"
          icon={<ShieldOffIcon className="size-3.5" />}
          tone="emerald"
          disabled={restoring}
          onClick={onRestore}
        />
        <IconActionButton
          label={`Delete ${name} permanently`}
          tooltip="Delete permanently"
          icon={<Trash2Icon className="size-3.5" />}
          tone="red"
          disabled={deleting}
          onClick={onDelete}
        />
      </div>
    </TooltipProvider>
  );
}
