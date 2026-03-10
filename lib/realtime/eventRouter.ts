/**
 * Maps an Appwrite realtime event to a feature module name.
 * Used by RealtimeProvider to dispatch events to the correct handler.
 */
export type RealtimeModule =
  | "expenses"
  | "splits"
  | "itinerary"
  | "checklists"
  | "files"
  | "members"
  | "reservations"
  | "trips"
  | "roleRequests"
  | "presence"
  | "unknown";

export function routeRealtimeEvent(event: any): RealtimeModule {
  const eventStr = event.events?.[0] ?? "";

  if (eventStr.includes("trip_expenses")) return "expenses";
  if (eventStr.includes("expense_splits")) return "splits";
  if (eventStr.includes("activities") || eventStr.includes("trip_days"))
    return "itinerary";
  if (
    eventStr.includes("trip_checklists") ||
    eventStr.includes("checklist_items")
  )
    return "checklists";
  if (eventStr.includes("trip_files")) return "files";
  if (eventStr.includes("trip_members")) return "members";
  if (eventStr.includes("trip_reservations")) return "reservations";
  if (eventStr.includes(".collections.trips.")) return "trips";
  if (eventStr.includes("role_requests")) return "roleRequests";
  if (eventStr.includes("trip_presence")) return "presence";

  return "unknown";
}
