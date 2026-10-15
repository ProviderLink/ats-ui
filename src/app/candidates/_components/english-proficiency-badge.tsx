import { cn } from '@/lib/utils';

const PROFICIENCY_STYLE: Record<string, string> = {
  basic:
    'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
  conversational:
    'border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300',
  professional:
    'border-green-300 text-green-700 dark:border-green-600 dark:text-green-300',
  fluent:
    'border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300',
  native:
    'border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-300',
};

const PROFICIENCY_LABEL: Record<string, string> = {
  basic: 'Basic',
  conversational: 'Conversational',
  professional: 'Professional Working',
  fluent: 'Fluent',
  native: 'Native / Bilingual',
};

export function EnglishProficiencyBadge({ level }: { level: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        PROFICIENCY_STYLE[level] ?? ''
      )}
    >
      {PROFICIENCY_LABEL[level] ?? level}
    </span>
  );
}
