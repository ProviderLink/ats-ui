import { cn } from '@/lib/utils';
import { MonitorIcon, PlusIcon, StethoscopeIcon, XIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { ScorecardFormValues } from '../../_utils/scorecard-form';

interface TagInputProps {
  name: 'emrTags' | 'specialtyTags';
  label: string;
  placeholder: string;
  /** Previously used tags, offered as one-tap suggestions. */
  suggestions: string[];
}

const MAX_TAGS = 20;
const MAX_LENGTH = 50;
const MAX_SUGGESTIONS = 6;

const ICONS = { emrTags: MonitorIcon, specialtyTags: StethoscopeIcon };

/** Free-form tag editor: chips live inside the field; Enter or comma adds one. */
export function TagInput({
  name,
  label,
  placeholder,
  suggestions,
}: TagInputProps) {
  const { control } = useFormContext<ScorecardFormValues>();
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = ICONS[name];

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const tags = (field.value ?? []) as string[];
        const has = (t: string) =>
          tags.some(x => x.toLowerCase() === t.toLowerCase());

        const add = (raw: string) => {
          const tag = raw.trim().slice(0, MAX_LENGTH);
          setDraft('');
          if (!tag || tags.length >= MAX_TAGS || has(tag)) return;
          field.onChange([...tags, tag]);
        };
        const remove = (tag: string) =>
          field.onChange(tags.filter(t => t !== tag));

        const q = draft.trim().toLowerCase();
        const shown = suggestions
          .filter(s => !has(s) && s.toLowerCase().includes(q))
          .slice(0, MAX_SUGGESTIONS);

        return (
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Icon className="size-3.5" />
              {label}
              {tags.length > 0 && (
                <span className="font-normal normal-case tabular-nums">
                  · {tags.length}
                </span>
              )}
            </span>

            <div
              onClick={() => inputRef.current?.focus()}
              className="flex min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-lg border bg-card px-2 py-1.5 transition-shadow focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
            >
              {tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-md bg-primary/10 py-0.5 pr-1 pl-2 text-xs font-medium text-primary"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    className="rounded p-0.5 outline-none hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={e => {
                      e.stopPropagation();
                      remove(tag);
                    }}
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                value={draft}
                maxLength={MAX_LENGTH}
                placeholder={tags.length === 0 ? placeholder : 'Add another…'}
                className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
                onChange={e => {
                  const v = e.target.value;
                  if (v.endsWith(',')) add(v.slice(0, -1));
                  else setDraft(v);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // never submit the scorecard from here
                    add(draft);
                  } else if (e.key === 'Backspace' && !draft && tags.length) {
                    remove(tags[tags.length - 1]);
                  }
                }}
                onBlur={() => add(draft)}
              />
            </div>

            {shown.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {shown.map(s => (
                  <button
                    key={s}
                    type="button"
                    // mousedown keeps the input from blurring first
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => add(s)}
                    className={cn(
                      'flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground outline-none transition-colors',
                      'hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                  >
                    <PlusIcon className="size-3" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
