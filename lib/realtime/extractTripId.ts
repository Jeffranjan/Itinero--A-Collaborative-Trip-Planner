/**
 * Safely extract tripId from a realtime event payload.
 * Returns null if tripId cannot be determined — event should be ignored.
 */
export function extractTripId(payload: any): string | null {
  return payload?.tripId || payload?.trip_id || payload?.trip?.$id || null;
}
