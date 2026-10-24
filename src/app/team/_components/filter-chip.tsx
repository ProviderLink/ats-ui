import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';
import type React from 'react';

export function FilterChip({
  icon,
  label,
  active,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-7 gap-1.5 rounded-full text-xs border-dashed border-gray-400 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-accent',
            active &&
              'border-solid border-primary bg-primary/10 text-primary dark:bg-input/30 dark:text-primary'
          )}
        >
          {icon}
          {label}
          <ChevronDownIcon className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
