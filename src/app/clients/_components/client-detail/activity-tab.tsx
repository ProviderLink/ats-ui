import { ActivityTimeline } from '@/components/activity-timeline';
import { useActivityLogStore } from '@/store/slices/activity-logs.store';
import { useEffect } from 'react';

export function ActivityTab({ clientId }: { clientId: string }) {
  const fetchForEntity = useActivityLogStore(s => s.fetchForEntity);

  useEffect(() => {
    void fetchForEntity('client', clientId, { force: true });
  }, [clientId, fetchForEntity]);

  return (
    <div className="py-5">
      <p className="mb-3 text-xs text-muted-foreground">
        Audit trail of every change made to this client — contacts, CRM profile,
        status changes, and more.
      </p>
      <ActivityTimeline resourceType="client" resourceId={clientId} compact />
    </div>
  );
}
