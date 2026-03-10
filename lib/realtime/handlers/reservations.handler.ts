import { QueryClient } from "@tanstack/react-query";

/**
 * Handles realtime events for the trip_reservations collection.
 * Invalidates ["tripReservations", tripId] on any create/update/delete.
 */
export function handleReservationsEvent(
  event: any,
  queryClient: QueryClient,
  tripId: string
) {
  queryClient.invalidateQueries({ queryKey: ["tripReservations", tripId] });
}
