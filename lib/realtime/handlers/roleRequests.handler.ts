/**
 * Handles realtime events for the role_requests collection.
 * Dispatches a CustomEvent so the trip page can update local state
 * (pending requests list, hasPendingRequest flag).
 */
export function handleRoleRequestsEvent(event: any, tripId: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("realtime:roleRequests", { detail: { event, tripId } })
    );
  }
}
