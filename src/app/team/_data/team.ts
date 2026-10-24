export type { UserRole } from '@/store/types/enums';
export type { User as TeamMember } from '@/store/types/user.types';


export const ALL_ROLES = [
  'admin',
  'hiring_manager',
  'recruiter',
  'coordinator',
  'interviewer',
  'account_manager',
] as const;

export const AVATAR_BG = [
  'bg-pine-teal-200 text-pine-teal-900 dark:bg-pine-teal-900 dark:text-pine-teal-200',
  'bg-violet-200 text-violet-900 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-200 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-sky-200 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300',
  'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
  'bg-indigo-200 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-300',
];
