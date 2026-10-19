import { usePresence } from '@/hooks/use-presence';
import { useUserStore } from '@/store/slices/users.store';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { TeamTable } from './_components/team-table';

export default function TeamPage() {
  const items = useUserStore(s => s.items);
  const loading = useUserStore(s => s.loading);
  const isRefreshing = useUserStore(s => s.isRefreshing);
  const error = useUserStore(s => s.error);
  const fetch = useUserStore(s => s.fetch);

  usePresence();

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (error) toast.error('Failed to load team members');
  }, [error]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
      <TeamTable
        members={items}
        loading={loading}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}
