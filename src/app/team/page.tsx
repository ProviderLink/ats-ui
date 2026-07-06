'use client';

import { useUserStore } from '@/store/slices/users.store';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { TeamTable } from './_components/team-table';

export default function TeamPage() {
  const { items, loading, isRefreshing, error, fetch } = useUserStore();

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
