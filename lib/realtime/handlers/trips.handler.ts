import { QueryClient } from "@tanstack/react-query";

/**
 * Handles realtime events for the trips collection.
 * Invalidates ["trip", tripId] on update.
 */
export function handleTripsEvent(
  event: any,
  queryClient: QueryClient,
  tripId: string
) {
  const isUpdate = event.events.some((e: string) => e.includes(".update"));
  if (isUpdate) {
    queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
  }
}
