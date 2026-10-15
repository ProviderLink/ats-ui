import { Button } from '@/components/ui/button';
import { CheckIcon, MailIcon, StarIcon, XIcon } from 'lucide-react';

/**
 * PendingActionsToolbar
 *
 * Sticky footer action bar shown when a candidate is in the pending stage.
 *
 * Every action is one click — no dropdowns / selects. Approve is the only
 * filled (primary) button to mark the default/expected path; combined Approve
 * variants share its emerald colour so they read as a single cluster. The two
 * "neutral" supporting actions (Email, Add to Talent Pool) sit between, and
 * Reject variants are kept visually quiet with a destructive outline.
 *
 * The component is pure: each button merely emits its intent via the matching
 * callback — the parent owns confirmation flows and side-effects.
 *
 *   [ Approve ] [ Approve & Email ] [ Approve, Email & Talent Pool ]
 *     [ Email ]   [ Add to Talent Pool ]
 *   [ Reject & Email ] [ Reject ]
 */
export function PendingActionsToolbar({
  onApprove,
  onApproveAndEmail,
  onApproveEmailAndPool,
  onReject,
  onRejectAndEmail,
  onEmail,
  onAddToTalentPool,
  disabled,
}: {
  onApprove: () => void;
  onApproveAndEmail: () => void;
  onApproveEmailAndPool: () => void;
  onReject: () => void;
  onRejectAndEmail: () => void;
  onEmail: () => void;
  onAddToTalentPool: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {/* Approve cluster — emerald outline */}
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
        onClick={onApprove}
      >
        <CheckIcon className="size-3.5" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
        onClick={onApproveAndEmail}
      >
        <CheckIcon className="size-3.5" />
        <MailIcon className="size-3" />
        Approve &amp; Email
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
        onClick={onApproveEmailAndPool}
      >
        <CheckIcon className="size-3.5" />
        <MailIcon className="size-3" />
        <StarIcon className="size-3" />
        Approve, Email &amp; Talent Pool
      </Button>

      {/* Supporting actions — neutral */}
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5"
        onClick={onEmail}
      >
        <MailIcon className="size-3.5" />
        Email
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5"
        onClick={onAddToTalentPool}
      >
        <StarIcon className="size-3.5" />
        Add to Talent Pool
      </Button>

      {/* Reject cluster — destructive outline */}
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
        onClick={onRejectAndEmail}
      >
        <XIcon className="size-3.5" />
        <MailIcon className="size-3" />
        Reject &amp; Email
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
        onClick={onReject}
      >
        <XIcon className="size-3.5" />
        Reject
      </Button>
    </div>
  );
}
