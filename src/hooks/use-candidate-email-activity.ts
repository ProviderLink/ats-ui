import { getJson } from '@/lib/api-client';
import { isValidObjectId } from '@/lib/utils';
import { useEmailStore } from '@/store/slices/emails.store';
import type { ActivityLog, Email } from '@/store/types';
import { useEffect, useState } from 'react';

/**
 * Turn one stored email into an activity-feed entry.
 *
 * Emails are already a complete record of who wrote to a candidate and what the
 * candidate sent back, so the feed reads them directly instead of duplicating
 * them into the activity log. Opens and clicks are not shown — they are not
 * recorded reliably.
 */
function toActivity(email: Email, candidateId: string): ActivityLog {
  const inbound = email.direction === 'inbound';
  const action = inbound
    ? 'email_received'
    : email.status === 'bounced' || email.status === 'complained'
      ? 'email_bounced'
      : email.status === 'failed'
        ? 'email_failed'
        : 'email_sent';
  const at = inbound
    ? (email.receivedAt ?? email.createdAt)
    : (email.sentAt ?? email.failedAt ?? email.createdAt);

  return {
    _id: `email-${email._id}`,
    resourceType: 'candidate',
    resourceId: candidateId,
    action,
    performedBy: inbound ? null : (email.sentBy ?? null),
    metadata: {
      subject: email.subject,
      kind: email.context?.type ?? null,
      attachments: email.attachments?.length ?? 0,
    },
    createdAt: at,
  };
}

/**
 * Email activity for one candidate, shaped like activity-log entries so the
 * timeline can merge it into the feed.
 *
 * Returns an empty list when the viewer cannot read emails (the request is
 * refused) or the id is not a real record — the feed then simply has no email
 * rows. Re-reads whenever the local email list changes, so a message sent from
 * the sheet appears straight away.
 */
export function useCandidateEmailActivity(
  candidateId: string | undefined
): ActivityLog[] {
  const [entries, setEntries] = useState<ActivityLog[]>([]);
  const emailCount = useEmailStore(s => s.items.length);

  useEffect(() => {
    if (!candidateId || !isValidObjectId(candidateId)) return;
    let alive = true;
    getJson<Email[] | { data?: Email[] }>('/ats/emails', {
      candidateId,
      limit: 100,
    })
      .then(res => {
        if (!alive) return;
        const emails = Array.isArray(res) ? res : (res.data ?? []);
        setEntries(emails.map(email => toActivity(email, candidateId)));
      })
      .catch(() => {
        if (alive) setEntries([]);
      });
    return () => {
      alive = false;
    };
  }, [candidateId, emailCount]);

  return entries;
}
