/**
 * Handles realtime events for the trip_presence collection.
 * Dispatches a CustomEvent so the trip page can update the active users list.
 */
export function handlePresenceEvent(event: any, tripId: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("realtime:presence", { detail: { event, tripId } })
    );
  }
}
