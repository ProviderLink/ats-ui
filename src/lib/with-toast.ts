import { toast } from 'sonner';

/**
 * Run a mutation and toast its outcome. A failure is toasted once and
 * rethrown, so a caller that must not continue (closing a dialog, logging
 * activity) still stops.
 */
export async function withToast<R>(
  successMessage: string,
  run: () => Promise<R>
): Promise<R> {
  try {
    const result = await run();
    toast.success(successMessage);
    return result;
  } catch (e) {
    toast.error((e as Error).message);
    throw e;
  }
}
