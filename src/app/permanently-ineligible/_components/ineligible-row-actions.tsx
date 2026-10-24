import { TooltipProvider } from '@/components/ui/tooltip';
import type { Candidate } from '@/store/types';
import {
  BanIcon,
  ShieldAlertIcon,
  ShieldOffIcon,
  Trash2Icon,
} from 'lucide-react';
import { IconActionButton } from './icon-action-button';

interface IneligibleRowActionsProps {
  candidate: Candidate;
  restoring: boolean;
  holdToggling: boolean;
  deleting: boolean;
  onRestore: () => void;
  onToggleLegalHold: () => void;
  onDelete: () => void;
}

export function IneligibleRowActions({
  candidate,
  restoring,
  holdToggling,
  deleting,
  onRestore,
  onToggleLegalHold,
  onDelete,
}: IneligibleRowActionsProps) {
  const name = `${candidate.firstName} ${candidate.lastName}`;
  const holdLabel = candidate.legalHold
    ? 'Remove legal hold'
    : 'Place legal hold';

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex items-center gap-1 justify-start"
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
          label={holdLabel}
          icon={
            candidate.legalHold ? (
              <BanIcon className="size-3.5" />
            ) : (
              <ShieldAlertIcon className="size-3.5" />
            )
          }
          tone={candidate.legalHold ? 'red' : 'amber'}
          disabled={holdToggling}
          onClick={onToggleLegalHold}
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
