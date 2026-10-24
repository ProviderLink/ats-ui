import { cn } from '@/lib/utils';

const COLORS = [
  'bg-violet-200 text-violet-800 dark:bg-violet-950 dark:text-violet-400',
  'bg-teal-200 text-teal-800 dark:bg-teal-950 dark:text-teal-400',
  'bg-orange-200 text-orange-800 dark:bg-orange-950 dark:text-orange-400',
  'bg-pink-200 text-pink-800 dark:bg-pink-950 dark:text-pink-400',
  'bg-sky-200 text-sky-800 dark:bg-sky-950 dark:text-sky-400',
];

export function SenderAvatar({ address }: { address: string }) {
  const initials = address
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold select-none',
        COLORS[address.charCodeAt(0) % COLORS.length]
      )}
    >
      {initials || '?'}
    </div>
  );
}
