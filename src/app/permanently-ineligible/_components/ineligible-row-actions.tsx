import { TooltipProvider } from '@/components/ui/tooltip';
import type { Candidate } from '@/store/types';
import {
  BanIcon,
  ExternalLinkIcon,
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
  onView: () => void;
  onRestore: () => void;
  onToggleLegalHold: () => void;
  onDelete: () => void;
}

export function IneligibleRowActions({
  candidate,
  restoring,
  holdToggling,
  deleting,
  onView,
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
        className="flex items-center gap-1 justify-end"
        onClick={e => e.stopPropagation()}
      >
        <IconActionButton
          label={`View details for ${name}`}
          tooltip="View details"
          icon={<ExternalLinkIcon className="size-3.5" />}
          onClick={onView}
        />
        <IconActionButton
          label={`Restore ${name}`}
          tooltip="Restore candidate (requires a job)"
          icon={<ShieldOffIcon className="size-3.5 text-amber-600" />}
          disabled={restoring}
          onClick={onRestore}
        />
        <IconActionButton
          label={holdLabel}
          icon={
            candidate.legalHold ? (
              <BanIcon className="size-3.5 text-red-600" />
            ) : (
              <ShieldAlertIcon className="size-3.5 text-muted-foreground" />
            )
          }
          disabled={holdToggling}
          onClick={onToggleLegalHold}
        />
        <IconActionButton
          label={`Delete ${name} permanently`}
          tooltip="Delete permanently"
          icon={<Trash2Icon className="size-3.5" />}
          destructive
          disabled={deleting}
          onClick={onDelete}
        />
      </div>
    </TooltipProvider>
  );
}
