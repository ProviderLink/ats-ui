import { useClientStore } from '@/store';
import type { Application, Client } from '@/store/types';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { JobCounts } from '../_utils/client-list';

/** Which client is being added, viewed, edited or deleted, and the actions around them. */
export function useClientDialogs(
  items: Client[],
  jobCounts: JobCounts,
  applications: Application[]
) {
  const navigate = useNavigate();
  const remove = useClientStore(s => s.remove);
  const [addOpen, setAddOpen] = useState(false);
  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const findClient = (id: string | null) =>
    id ? (items.find(c => c._id === id) ?? null) : null;

  const deleteTargetJobCount = deleteTarget
    ? (jobCounts.get(deleteTarget._id)?.total ?? 0)
    : 0;
  const deleteTargetAppCount = useMemo(
    () =>
      deleteTarget
        ? applications.filter(a => a.clientId === deleteTarget._id).length
        : 0,
    [deleteTarget, applications]
  );

  function view(client: Client) {
    setSelectedClientId(client._id);
    setDetailOpen(true);
  }

  function viewJobs(client: Client) {
    const counts = jobCounts.get(client._id);
    if (!counts || counts.total === 0) {
      toast.info(`${client.companyName} has no jobs yet`);
      return;
    }
    navigate(`/ats/jobs?client=${encodeURIComponent(client.companyName)}`);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget._id);
      toast.success(`${deleteTarget.companyName} deleted`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleteTarget(null);
    }
  }

  return {
    addOpen,
    setAddOpen,
    editClient: findClient(editClientId),
    startEdit: (client: Client) => setEditClientId(client._id),
    closeEdit: () => setEditClientId(null),
    selectedClient: findClient(selectedClientId),
    detailOpen,
    setDetailOpen,
    deleteTarget,
    setDeleteTarget,
    deleteTargetJobCount,
    deleteTargetAppCount,
    view,
    viewJobs,
    confirmDelete,
  };
}
