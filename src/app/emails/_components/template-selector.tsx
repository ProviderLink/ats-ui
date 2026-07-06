'use client';

import { EMAIL_TEMPLATE_TYPES } from '@/app/settings/_data/settings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useEmailTemplateStore } from '@/store';
import type { EmailTemplate } from '@/store/types';
import { CheckIcon, ChevronDownIcon, FileTextIcon } from 'lucide-react';
import { useState } from 'react';

const typeColorMap: Record<string, string> = {
  interview: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  offer:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejection: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  follow_up:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  eod_reminder:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  survey_reminder:
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  application_confirmation:
    'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  general: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const typeIconMap: Record<string, string> = {
  interview: '📅',
  offer: '📝',
  rejection: '🚫',
  follow_up: '📩',
  eod_reminder: '⏰',
  survey_reminder: '📊',
  application_confirmation: '✅',
  general: '📧',
};

export interface TemplateSelection {
  type: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

interface TemplateSelectorProps {
  value: string;
  onChange: (template: TemplateSelection | null) => void;
  disabled?: boolean;
}

export function TemplateSelector({
  value,
  onChange,
  disabled = false,
}: TemplateSelectorProps) {
  const templates = useEmailTemplateStore(s => s.items);
  const [open, setOpen] = useState(false);

  const selectedTypeMeta = EMAIL_TEMPLATE_TYPES.find(t => t.value === value);
  const resolvedTemplate: EmailTemplate | undefined = value
    ? templates.find(t => t.type === value && t.isActive)
    : undefined;

  function handleSelect(typeValue: string) {
    if (typeValue === value && typeValue === '') {
      setOpen(false);
      return;
    }
    if (!typeValue) {
      onChange(null);
      setOpen(false);
      return;
    }
    const tmpl = templates.find(t => t.type === typeValue && t.isActive);
    onChange({
      type: typeValue,
      subject: tmpl?.subject ?? '',
      bodyText: tmpl?.bodyText ?? '',
      bodyHtml: tmpl?.bodyHtml ?? '',
    });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-between h-9 font-normal text-sm',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            {selectedTypeMeta ? (
              <>
                <span className="shrink-0 text-xs">
                  {typeIconMap[selectedTypeMeta.value] || '📧'}
                </span>
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 font-medium rounded-sm leading-5 shrink-0',
                    typeColorMap[selectedTypeMeta.value] || ''
                  )}
                >
                  {selectedTypeMeta.label}
                </Badge>
                {resolvedTemplate?.subject && (
                  <span className="text-muted-foreground text-xs truncate">
                    {resolvedTemplate.subject}
                  </span>
                )}
              </>
            ) : (
              <span>Select a template...</span>
            )}
          </span>
          <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-1"
        align="start"
        sideOffset={6}
      >
        <div className="max-h-72 overflow-y-auto overscroll-contain">
          <button
            type="button"
            className={cn(
              'flex items-center w-full gap-3 px-3 py-2.5 text-sm rounded-sm hover:bg-accent transition-colors text-left',
              !value && 'bg-accent'
            )}
            onClick={() => handleSelect('')}
          >
            <FileTextIcon className="size-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm">No template</span>
              <span className="text-[11px] text-muted-foreground">
                Start with a blank email
              </span>
            </div>
            {!value && (
              <CheckIcon className="size-4 ml-auto text-primary shrink-0" />
            )}
          </button>

          <div className="h-px bg-border mx-2 my-1" />

          {EMAIL_TEMPLATE_TYPES.map(type => {
            const tmpl = templates.find(
              t => t.type === type.value && t.isActive
            );
            const isSelected = value === type.value;
            return (
              <button
                key={type.value}
                type="button"
                className={cn(
                  'flex items-center w-full gap-3 px-3 py-2.5 text-sm rounded-sm hover:bg-accent transition-colors text-left',
                  isSelected && 'bg-accent'
                )}
                onClick={() => handleSelect(type.value)}
              >
                <span className="shrink-0 text-xs">
                  {typeIconMap[type.value] || '📧'}
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium">{type.label}</span>
                  <span
                    className={cn(
                      'text-[11px] truncate',
                      tmpl?.subject
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground/60 italic'
                    )}
                  >
                    {tmpl?.subject || 'No template configured'}
                  </span>
                </div>
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 font-medium rounded-sm leading-5 shrink-0',
                    typeColorMap[type.value] || ''
                  )}
                >
                  {
                    templates.filter(t => t.type === type.value && t.isActive)
                      .length
                  }
                </Badge>
                {isSelected && (
                  <CheckIcon className="size-4 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
