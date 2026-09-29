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
import {
  CheckIcon,
  ChevronDownIcon,
  FileTextIcon,
  SearchIcon,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

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
  /**
   * The exact template chosen. Carried so the sent email is logged against the
   * template it actually used — resolving by `type` alone always returned the
   * first match, so every Interview email was recorded as the same template.
   */
  templateId: string;
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
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const activeTemplates = useMemo(
    () => templates.filter(t => t.isActive),
    [templates]
  );

  /** `value` is the selected template id, not a type. */
  const selected = value
    ? activeTemplates.find(t => t._id === value)
    : undefined;
  const selectedTypeMeta = selected
    ? EMAIL_TEMPLATE_TYPES.find(t => t.value === selected.type)
    : undefined;

  const query = search.trim().toLowerCase();

  /**
   * A type can hold several templates (Interview currently has 6), so the list
   * shows the templates themselves under a type heading rather than one row per
   * type. Search covers the name, the subject and the type label, so typing
   * "interview" still surfaces the whole group.
   */
  const groups = useMemo(() => {
    const matches = query
      ? activeTemplates.filter(t => {
          const typeLabel = EMAIL_TEMPLATE_TYPES.find(
            m => m.value === t.type
          )?.label;
          return (
            t.name.toLowerCase().includes(query) ||
            t.subject.toLowerCase().includes(query) ||
            (typeLabel?.toLowerCase().includes(query) ?? false)
          );
        })
      : activeTemplates;

    return EMAIL_TEMPLATE_TYPES.map(meta => ({
      meta,
      items: matches.filter(t => t.type === meta.value),
    })).filter(group => group.items.length > 0);
  }, [activeTemplates, query]);

  const matchCount = groups.reduce((n, group) => n + group.items.length, 0);
  const hasAnyTemplate = activeTemplates.length > 0;

  function handleSelect(tmpl: EmailTemplate) {
    onChange({
      templateId: tmpl._id,
      type: tmpl.type,
      subject: tmpl.subject,
      bodyText: tmpl.bodyText,
      bodyHtml: tmpl.bodyHtml,
    });
    setSearch('');
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setSearch('');
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-between h-9 font-normal text-sm',
            !selected && 'text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            {selected && selectedTypeMeta ? (
              <>
                <span className="shrink-0 text-xs">
                  {typeIconMap[selected.type] || '📧'}
                </span>
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 font-medium rounded-sm leading-5 shrink-0',
                    typeColorMap[selected.type] || ''
                  )}
                >
                  {selectedTypeMeta.label}
                </Badge>
                <span className="text-xs truncate">{selected.name}</span>
              </>
            ) : (
              <span>Select a template...</span>
            )}
          </span>
          <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
        sideOffset={6}
        onOpenAutoFocus={e => {
          // Radix focuses the content container first; send it to the search
          // field instead so the user can type immediately.
          e.preventDefault();
          searchRef.current?.focus();
        }}
      >
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="max-h-72 overflow-y-auto overscroll-contain p-1">
          <button
            type="button"
            className={cn(
              'flex items-center w-full gap-3 px-3 py-2.5 text-sm rounded-sm hover:bg-accent transition-colors text-left',
              !value && 'bg-accent'
            )}
            onClick={handleClear}
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

          {groups.map(({ meta, items }) => (
            <div key={meta.value}>
              <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                <span className="shrink-0 text-xs">
                  {typeIconMap[meta.value] || '📧'}
                </span>
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {meta.label}
                </span>
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 font-medium rounded-sm leading-5 shrink-0',
                    typeColorMap[meta.value] || ''
                  )}
                >
                  {items.length}
                </Badge>
              </div>
              {items.map(tmpl => {
                const isSelected = tmpl._id === value;
                return (
                  <button
                    key={tmpl._id}
                    type="button"
                    className={cn(
                      'flex items-center w-full gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors text-left',
                      isSelected && 'bg-accent'
                    )}
                    onClick={() => handleSelect(tmpl)}
                  >
                    <CheckIcon
                      className={cn(
                        'size-3.5 shrink-0 text-primary',
                        !isSelected && 'invisible'
                      )}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-sm font-medium">
                        {tmpl.name}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {tmpl.subject}
                      </span>
                    </div>
                    {tmpl.isDefault && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1 shrink-0"
                      >
                        Default
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {!hasAnyTemplate && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No email templates configured. Add them under Settings → Email
              Templates.
            </p>
          )}
          {matchCount === 0 && hasAnyTemplate && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No templates match &ldquo;{search}&rdquo;
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
