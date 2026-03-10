import { createDebouncedInvalidate } from "@/lib/realtime/debounceInvalidate";
import { QueryClient } from "@tanstack/react-query";

let debouncedInvalidate: ReturnType<typeof createDebouncedInvalidate> | null =
  null;

function getInvalidator(queryClient: QueryClient) {
  if (!debouncedInvalidate) {
    debouncedInvalidate = createDebouncedInvalidate(queryClient);
  }
  return debouncedInvalidate;
}

/**
 * Handles realtime events for trip_checklists and checklist_items collections.
 * Uses debounced invalidation since checklist items may be reordered rapidly.
 */
export function handleChecklistEvent(
  event: any,
  queryClient: QueryClient,
  tripId: string
) {
  getInvalidator(queryClient).invalidate(["tripChecklists", tripId]);
}

export function cleanupChecklistHandler() {
  debouncedInvalidate?.cleanup();
  debouncedInvalidate = null;
}
