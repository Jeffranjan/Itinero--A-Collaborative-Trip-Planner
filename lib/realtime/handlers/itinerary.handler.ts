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
 * Handles realtime events for activities and trip_days collections.
 * Uses debounced invalidation since itinerary cache shape is complex.
 */
export function handleItineraryEvent(
  event: any,
  queryClient: QueryClient,
  tripId: string
) {
  getInvalidator(queryClient).invalidate(["tripDays", tripId]);
}

export function cleanupItineraryHandler() {
  debouncedInvalidate?.cleanup();
  debouncedInvalidate = null;
}
