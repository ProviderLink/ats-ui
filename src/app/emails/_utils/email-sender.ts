const AVATAR_PALETTE = [
  'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
];

export function initialsFor(address: string): string {
  const user = address.split('@')[0];
  return user
    .split(/[._+-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('');
}

export function avatarColor(address: string): string {
  const idx =
    address.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

export function formatEmailTime(date?: string | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}
