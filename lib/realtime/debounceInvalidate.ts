import { QueryClient } from "@tanstack/react-query";

/**
 * Creates a keyed debounce function that batches rapid invalidation calls.
 * Each unique cache key string gets its own debounce timer.
 */
export function createDebouncedInvalidate(
  queryClient: QueryClient,
  delay = 50
) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  function invalidate(queryKey: unknown[]) {
    const keyStr = JSON.stringify(queryKey);

    const existing = timers.get(keyStr);
    if (existing) clearTimeout(existing);

    timers.set(
      keyStr,
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
        timers.delete(keyStr);
      }, delay)
    );
  }

  function cleanup() {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
  }

  return { invalidate, cleanup };
}
