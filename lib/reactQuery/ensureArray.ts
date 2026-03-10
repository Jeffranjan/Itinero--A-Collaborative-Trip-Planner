/**
 * Ensures React Query data is always a safe array.
 * Use as `select: ensureArray` on any query returning list data.
 *
 * Prevents runtime crashes from `.map()`, `.filter()`, `.find()`
 * when query data is temporarily undefined or non-array during
 * hydration, cache invalidation, or realtime patches.
 */
export function ensureArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  return [];
}
