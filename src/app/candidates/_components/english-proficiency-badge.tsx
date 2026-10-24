import { cn } from '@/lib/utils';

const PROFICIENCY_STYLE: Record<string, string> = {
  basic:
    'border-gray-400 bg-gray-100 text-gray-800 dark:bg-transparent dark:border-gray-600 dark:text-gray-300',
  conversational:
    'border-blue-300 bg-blue-100 text-blue-800 dark:bg-transparent dark:border-blue-600 dark:text-blue-300',
  professional:
    'border-green-300 bg-green-100 text-green-800 dark:bg-transparent dark:border-green-600 dark:text-green-300',
  fluent:
    'border-purple-300 bg-purple-100 text-purple-800 dark:bg-transparent dark:border-purple-600 dark:text-purple-300',
  native:
    'border-amber-300 bg-amber-100 text-amber-800 dark:bg-transparent dark:border-amber-600 dark:text-amber-300',
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
