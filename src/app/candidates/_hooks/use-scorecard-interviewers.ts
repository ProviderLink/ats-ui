import { ROLE_LABELS } from '@/lib/role-labels';
import { useUserStore } from '@/store/slices/users.store';
import { useEffect, useMemo } from 'react';

/**
 * Interviewer pool = all active team members (ATS roles, admin, account
 * manager). CRM-only roles (client, va) are never interviewers.
 */
export function useScorecardInterviewers(
  open: boolean,
  editingInterviewerId?: string
) {
  const users = useUserStore(s => s.items);
  const loading = useUserStore(s => s.loading);
  const fetchUsers = useUserStore(s => s.fetch);

  useEffect(() => {
    if (open) void fetchUsers();
  }, [open, fetchUsers]);

  const options = useMemo(() => {
    const toOption = (u: (typeof users)[number]) => ({
      _id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      roles: u.roles.map(r => ROLE_LABELS[r] ?? r),
    });

    const result = users
      .filter(u => u.isActive !== false)
      .filter(u => u.roles.some(r => r !== 'client' && r !== 'va'))
      .map(toOption);

    // The scorecard's existing interviewer may have been deactivated since it
    // was created; keep them listed so the dropdown does not render blank.
    if (
      editingInterviewerId &&
      !result.some(o => o._id === editingInterviewerId)
    ) {
      const current = users.find(u => u._id === editingInterviewerId);
      if (current) result.push(toOption(current));
    }
    return result;
  }, [users, editingInterviewerId]);

  return { interviewerOptions: options, interviewersLoading: loading };
}
