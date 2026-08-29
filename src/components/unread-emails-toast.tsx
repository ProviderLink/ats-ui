import { usePermission } from '@/hooks/use-permission';
import { useUnreadEmailCount } from '@/hooks/use-unread-emails';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * After login, shows a short-lived toast to users with Emails access
 * when they have unread emails. Fires exactly once per app load.
 */
export function UnreadEmailsToast() {
  const { hasPermission } = usePermission();
  const { unreadCount } = useUnreadEmailCount();
  const navigate = useNavigate();

  const hasEmailsAccess = hasPermission('emails', 'read');
  const shownRef = useRef(false);

  useEffect(() => {
    if (!hasEmailsAccess || shownRef.current || unreadCount <= 0) return;
    shownRef.current = true;

    toast.info(
      `You have ${unreadCount} unread email${unreadCount > 1 ? 's' : ''}`,
      {
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => navigate('/ats/emails'),
        },
      }
    );
  }, [hasEmailsAccess, unreadCount, navigate]);

  return null;
}
