import type { Draft } from 'immer';

interface MutationState {
  mutating: boolean;
  error: string | null;
}

/**
 * Builds the `mutate` helper for a store: runs one server request with the
 * shared `mutating` / `error` bookkeeping. `apply` updates the store in the
 * same render that clears `mutating`; `clearError: false` keeps an earlier
 * error visible.
 */
export function createMutate<State extends MutationState>(
  set: (recipe: (s: Draft<State>) => void) => void
) {
  return async function mutate<R>(
    request: () => Promise<R>,
    apply?: (s: Draft<State>, result: R) => void,
    clearError = true
  ): Promise<R> {
    set(s => {
      const state: MutationState = s;
      state.mutating = true;
      if (clearError) state.error = null;
    });
    try {
      const result = await request();
      set(s => {
        apply?.(s, result);
        const state: MutationState = s;
        state.mutating = false;
      });
      return result;
    } catch (e) {
      set(s => {
        const state: MutationState = s;
        state.mutating = false;
        state.error = (e as Error).message;
      });
      throw e;
    }
  };
}
