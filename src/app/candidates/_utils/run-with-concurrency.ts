
/**
 * Run an array of async tasks with bounded concurrency, returning a
 * PromiseSettledResult for each in the original order. Prevents a large
 * bulk selection from firing hundreds of simultaneous requests.
 */
export async function runAllWithConcurrency<T>(
  tasks: (() => Promise<T>)[] = [],
  limit = 8
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next;
      next += 1;
      if (i >= tasks.length) break;
      const task = tasks[i];
      try {
        results[i] = { status: 'fulfilled', value: await task() };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      }
    }
  }
  const workerCount = Math.min(limit, tasks.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
