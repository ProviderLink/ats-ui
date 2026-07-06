export type { UserRole } from '@/store/types/enums';
export type { User as TeamMember } from '@/store/types/user.types';

// canonical source: @/app/settings/_data/settings
export { ROLE_LABELS } from '@/app/settings/_data/settings';

export const ALL_ROLES = [
  'admin',
  'hiring_manager',
  'recruiter',
  'coordinator',
  'interviewer',
  'account_manager',
  'va',
] as const;

export const AVATAR_BG = [
  'bg-pine-teal-100 text-pine-teal-800 dark:bg-pine-teal-900 dark:text-pine-teal-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
];
