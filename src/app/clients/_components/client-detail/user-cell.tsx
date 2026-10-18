import { useUserStore } from '@/store';
import { useEffect } from 'react';

export function UserCell({ userId }: { userId?: string }) {
  const users = useUserStore(s => s.items);
  const fetchUsers = useUserStore(s => s.fetch);

  useEffect(() => {
    if (users.length === 0) fetchUsers();
  }, []);

  if (!userId)
    return <span className="text-sm text-muted-foreground">System</span>;

  const user = users.find(u => u._id === userId);
  if (!user) return <span className="text-sm">{userId}</span>;

  return (
    <span className="text-sm">
      {user.firstName} {user.lastName}
    </span>
  );
}
