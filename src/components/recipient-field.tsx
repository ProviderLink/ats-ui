import { parseRecipients } from '@/lib/recipients';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import type React from 'react';
import { useImperativeHandle, useRef, useState } from 'react';

/**
 * Imperative handle so a parent can flush a half-typed address before acting.
 *
 * The sheet's Send button must not silently drop whatever is still sitting in
 * the input (e.g. the user types an address and clicks Send without pressing
 * Enter). `flush()` commits it and returns the resulting recipient string, so
 * the caller can use it immediately without waiting for React state.
 */
export type RecipientFieldHandle = {
  flush: () => string;
};

type RecipientFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ref?: React.Ref<RecipientFieldHandle>;
};

/**
 * Email recipient input that renders each address as a removable chip, the way
 * a mail client does.
 *
 * Committed addresses live in `value` (a comma-separated string, so the parent
 * keeps sending `SendEmailDto.to` unchanged); the address currently being typed
 * lives in local state. Enter, comma or semicolon commits it; a blur does too,
 * and `flush()` covers the "clicked Send mid-address" case.
 */
export function RecipientField({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  ref,
}: RecipientFieldProps) {
  const recipients = parseRecipients(value);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /** Merge new addresses into the list, dropping case-insensitive duplicates. */
  function merge(extra: string[]): string {
    const seen = new Set(recipients.map(a => a.toLowerCase()));
    const merged = [...recipients];
    for (const addr of extra) {
      if (seen.has(addr.toLowerCase())) continue;
      seen.add(addr.toLowerCase());
      merged.push(addr);
    }
    return merged.join(', ');
  }

  /** Commit `text` as recipients and return the new string. */
  function commit(text: string): string {
    const added = parseRecipients(text);
    if (added.length === 0) return value;
    const next = merge(added);
    onChange(next);
    return next;
  }

  // No dependency array: the handle is rebuilt on every render so `flush()`
  // always sees the latest `value`, `recipients` and `draft`.
  useImperativeHandle(ref, () => ({
    flush() {
      if (!draft.trim()) return value;
      const next = commit(draft);
      setDraft('');
      return next;
    },
  }));

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      // Separators are never part of an address — swallow Enter so it does not
      // submit a surrounding form.
      if (draft.trim()) {
        e.preventDefault();
        commit(draft);
        setDraft('');
      } else if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }
    // Backspace on an empty input removes the last chip.
    if (e.key === 'Backspace' && !draft && recipients.length > 0) {
      onChange(recipients.slice(0, -1).join(', '));
    }
  }

  function handleBlur() {
    if (!draft.trim()) return;
    commit(draft);
    setDraft('');
  }

  return (
    <div
      // The whole box is the hit area; clicking the padding focuses the input.
      onClick={() => inputRef.current?.focus()}
      className={cn(
        'flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className
      )}
    >
      {recipients.map((addr, i) => (
        <span
          key={`${addr}-${i}`}
          className="inline-flex max-w-full items-center gap-1 rounded-sm bg-muted py-0.5 pr-0.5 pl-1.5 text-xs"
        >
          <span className="truncate">{addr}</span>
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={e => {
              e.stopPropagation();
              onChange(recipients.filter((_, j) => j !== i).join(', '));
            }}
            className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            aria-label={`Remove ${addr}`}
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="email"
        autoComplete="off"
        spellCheck={false}
        value={draft}
        disabled={disabled}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={recipients.length === 0 ? placeholder : ''}
        className="min-w-40 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
