import { QueryClient } from "@tanstack/react-query";

/**
 * Handles realtime events for the trip_files collection.
 * Invalidates ["tripFiles", tripId] on any create/update/delete.
 */
export function handleFilesEvent(
  event: any,
  queryClient: QueryClient,
  tripId: string
) {
  queryClient.invalidateQueries({ queryKey: ["tripFiles", tripId] });
}
