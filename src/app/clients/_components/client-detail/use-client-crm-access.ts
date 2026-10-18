import { useApplicationStore, useUserStore } from '@/store';
import type { Client } from '@/store/types';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useClientCrmAccess(client: Client, open: boolean) {
  const provisionClient = useUserStore(s => s.provisionClient);
  const revokeCrmAccess = useUserStore(s => s.revokeCrmAccess);
  const allUsers = useUserStore(s => s.items);
  const apps = useApplicationStore(s => s.items);
  const fetchAppsMerge = useApplicationStore(s => s.fetchScopedMerge);
  const [busy, setBusy] = useState(false);

  const crmUser = allUsers.find(
    u => u.clientRef === client._id && u.appAccess?.includes('crm')
  );

  // Hires decide whether access can be provisioned. Merges into the shared
  // list rather than replacing it, so screens that need the full dataset are
  // unaffected.
  useEffect(() => {
    if (open) void fetchAppsMerge({ clientId: client._id, limit: 9999 });
  }, [open, client._id, fetchAppsMerge]);

  const hasHiredCandidate = apps.some(
    a => a.clientId === client._id && a.phase === 'hired'
  );

  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      toast.error((e as Error).message || failure);
    } finally {
      setBusy(false);
    }
  }

  return {
    crmUser,
    hasCrmAccess: !!crmUser,
    canProvision: client.status === 'active' && hasHiredCandidate,
    busy,
    provision: () =>
      run(async () => {
        await provisionClient(client._id);
        toast.success('CRM access provisioned. Invite email will be sent.');
      }, 'Failed to provision CRM access'),
    revoke: () => {
      if (!crmUser) return Promise.resolve();
      return run(async () => {
        await revokeCrmAccess(crmUser._id);
        toast.success('CRM access revoked');
      }, 'Failed to revoke CRM access');
    },
  };
}
