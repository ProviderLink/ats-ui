import { cn } from '@/lib/utils';

const COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
  'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
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
