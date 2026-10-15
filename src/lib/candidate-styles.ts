import type {
  AiFitRecommendation,
  ApplicationPhase,
  CandidateStatus,
} from '@/store';

export const AVATAR_BG = [
  'bg-pine-teal-100 text-pine-teal-800 dark:bg-pine-teal-900 dark:text-pine-teal-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
];

export function avatarBg(name: string) {
  return AVATAR_BG[name.charCodeAt(0) % AVATAR_BG.length];
}

export const statusConfig: Record<
  CandidateStatus,
  { label: string; cls: string }
> = {
  pending: {
    label: 'Pending',
    cls: 'bg-secondary text-secondary-foreground',
  },
  approved: {
    label: 'Approved',
    cls: 'border-pine-teal-600 text-pine-teal-700 dark:border-pine-teal-400 dark:text-pine-teal-300',
  },
  hired: {
    label: 'Hired',
    cls: 'border-[#16a34a]/40 bg-[#16a34a]/[0.08] text-[#16a34a] dark:border-[#69c58a] dark:bg-[#69c58a]/15 dark:text-[#69c58a]',
  },
};

export const fitConfig: Record<
  AiFitRecommendation,
  { label: string; cls: string }
> = {
  poor_fit: {
    label: 'Poor Fit',
    cls: 'bg-destructive/10 text-destructive border-transparent',
  },
  moderate_fit: {
    label: 'Moderate Fit',
    cls: 'bg-secondary text-secondary-foreground border-transparent',
  },
  good_fit: { label: 'Good Fit', cls: 'border-border text-foreground' },
  strong_fit: {
    label: 'Strong Fit',
    cls: 'border-pine-teal-600 text-pine-teal-700 dark:border-pine-teal-400 dark:text-pine-teal-300',
  },
};

const FIT_FALLBACK = {
  label: 'Unknown',
  cls: 'bg-secondary text-secondary-foreground',
} as const;

export function getFitConfig(key: string | undefined | null) {
  return key
    ? (fitConfig[key as AiFitRecommendation] ?? FIT_FALLBACK)
    : FIT_FALLBACK;
}

export const phaseConfig: Record<
  ApplicationPhase,
  { label: string; cls: string }
> = {
  pending: {
    label: 'Pending',
    cls: 'bg-secondary text-secondary-foreground',
  },
  approved: {
    label: 'In Pipeline',
    cls: 'bg-pine-teal-100 text-pine-teal-700 dark:bg-pine-teal-900/30 dark:text-pine-teal-300 border-transparent',
  },
  hired: {
    label: 'Hired',
    cls: 'border-[#16a34a]/40 bg-[#16a34a]/[0.08] text-[#16a34a] dark:border-[#69c58a] dark:bg-[#69c58a]/15 dark:text-[#69c58a]',
  },
  rejected: {
    label: 'Rejected',
    cls: 'bg-destructive/10 text-destructive border-transparent',
  },
};

export function scoreBarColor(score: number) {
  if (score >= 80) return 'bg-pine-teal-600';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-rose-500';
}

export function scoreTextColor(score: number) {
  if (score >= 80) return 'text-pine-teal-700 dark:text-pine-teal-300';
  if (score >= 60) return 'text-amber-700 dark:text-amber-400';
  if (score >= 40) return 'text-orange-700 dark:text-orange-400';
  return 'text-rose-700 dark:text-rose-400';
}
