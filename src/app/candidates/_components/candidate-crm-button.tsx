import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/slices/users.store';
import { ShieldCheckIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Small inline button for provisioning/revoking CRM access on a hired candidate.
 */
export function CandidateCrmButton({
  candidateId,
  candidateStatus,
}: {
  candidateId: string;
  candidateStatus: string;
}) {
  const provisionVA = useUserStore(s => s.provisionVA);
  const allUsers = useUserStore(s => s.items);
  const [busy, setBusy] = useState(false);

  if (candidateStatus !== 'hired') return null;

  const crmUser = allUsers.find(
    u => u.candidateRef === candidateId && u.appAccess?.includes('crm')
  );
  const hasCrmAccess = !!crmUser;

  async function handleProvision() {
    setBusy(true);
    try {
      await provisionVA(candidateId);
      toast.success('VA provisioned. Invite email will be sent.');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to provision VA');
    } finally {
      setBusy(false);
    }
  }

  if (hasCrmAccess) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-pine-teal-500/60 bg-pine-teal-100 px-2 py-0.5 text-[11px] font-medium text-pine-teal-800 dark:bg-pine-teal-950/50 dark:text-pine-teal-400">
        <ShieldCheckIcon className="size-3" />
        CRM Active
        {!crmUser?.isInviteAccepted && (
          <span className="text-amber-600 dark:text-amber-400">(invited)</span>
        )}
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 gap-1 px-2 text-xs border-pine-teal-400 bg-pine-teal-100 text-pine-teal-800 hover:bg-pine-teal-200 hover:text-pine-teal-900 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50 dark:hover:text-foreground"
      onClick={handleProvision}
      disabled={busy}
      title="Send CRM portal invite to this VA"
    >
      <ShieldCheckIcon className="size-3 text-pine-teal-700 dark:text-muted-foreground" />
      {busy ? '…' : 'Give CRM Portal Access'}
    </Button>
  );
}
