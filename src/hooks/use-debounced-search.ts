import { useRef, useState } from 'react';

const DEFAULT_DELAY_MS = 300;

/**
 * Search box state with a debounced `query`: `inputValue` follows every
 * keystroke while `query` (what the table filters by) lags by `delayMs`.
 * `onInput` runs immediately on each keystroke, e.g. to return to page 0.
 */
export function useDebouncedSearch(onInput?: () => void, delayMs = DEFAULT_DELAY_MS) {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  function change(value: string) {
    setInputValue(value);
    if (timer.current) clearTimeout(timer.current);
    onInput?.();
    timer.current = setTimeout(() => setQuery(value), delayMs);
  }

  function clear() {
    setInputValue('');
    setQuery('');
    if (timer.current) clearTimeout(timer.current);
  }

  return { inputValue, query, change, clear };
}
