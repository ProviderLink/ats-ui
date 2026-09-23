import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * `matchMedia` subscription for `useSyncExternalStore`.
 *
 * The previous implementation mirrored the media query into `useState` from
 * inside an effect: that set state synchronously on mount (an extra render pass
 * before the real value was known), and the first paint reported the initial
 * `undefined` as `false` regardless of the actual viewport. Subscribing directly
 * means the value is correct on the very first render.
 */
function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

/** Never rendered by this SPA, but `useSyncExternalStore` requires it. */
function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}
