import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { PipelineTemplate } from '@/store';
import { CheckIcon, ChevronDownIcon, LayersIcon } from 'lucide-react';
import { useState } from 'react';

interface JobPipelineMenuProps {
  templates: PipelineTemplate[];
  currentTemplateId: string | null | undefined;
  disabled: boolean;
  onOpen: () => void;
  onSelect: (templateId: string) => void;
}

export function JobPipelineMenu({
  templates,
  currentTemplateId,
  disabled,
  onOpen,
  onSelect,
}: JobPipelineMenuProps) {
  const [open, setOpen] = useState(false);
  const current = templates.find(p => p._id === currentTemplateId);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (next) onOpen();
      }}
    >
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className="group inline-flex items-center gap-1.5 h-7 rounded-full border border-border/70 bg-muted/40 pl-2 pr-1.5 text-sm shadow-xs transition-all duration-200 hover:bg-muted/70 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled}
                aria-label="Change pipeline"
              >
                <LayersIcon className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground hidden sm:inline max-w-64 truncate">
                  {current?.name ?? 'Pipeline'}
                </span>
                <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Click to change pipeline
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-xs">Change Pipeline</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {templates
          .filter(p => p.isActive)
          .map(p => {
            const isCurrent = p._id === currentTemplateId;
            return (
              <DropdownMenuItem
                key={p._id}
                onClick={() => {
                  setOpen(false);
                  onSelect(p._id);
                }}
                className={cn('text-sm', isCurrent && 'bg-accent font-semibold')}
              >
                <CheckIcon
                  className={cn(
                    'size-4',
                    isCurrent ? 'text-primary' : 'text-transparent'
                  )}
                />
                <span className="flex-1">{p.name}</span>
                {!isCurrent && p.isDefault && (
                  <span className="text-[10px] text-muted-foreground">
                    default
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
