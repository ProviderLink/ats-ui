import type { ActivityFilter } from '@/components/activity-timeline';

/** Sign-ins are the most frequent entries, so they get their own view. */
const SIGN_IN_ACTIONS = new Set([
  'login',
  'login_failed',
  'password_changed',
  'password_reset',
  'invite_accepted',
]);

export const MEMBER_ACTIVITY_FILTERS: ActivityFilter[] = [
  {
    id: 'signins',
    label: 'Sign-ins',
    match: log => SIGN_IN_ACTIONS.has(String(log.action)),
  },
  {
    id: 'changes',
    label: 'Changes',
    match: log => !SIGN_IN_ACTIONS.has(String(log.action)),
  },
];
