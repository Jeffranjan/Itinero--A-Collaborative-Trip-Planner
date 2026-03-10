import { QueryClient } from "@tanstack/react-query";

/**
 * Handles realtime events for the trip_members collection.
 * Patches ["tripMembers", tripId] cache directly, then dispatches
 * a CustomEvent so the trip page can handle role changes.
 */
export function handleMembersEvent(
  event: any,
  queryClient: QueryClient,
  tripId: string
) {
  const payload = event.payload;
  const queryKey = ["tripMembers", tripId];

  const isCreate = event.events.some((e: string) => e.includes(".create"));
  const isUpdate = event.events.some((e: string) => e.includes(".update"));
  const isDelete = event.events.some((e: string) => e.includes(".delete"));

  // Only patch if the cache already exists
  const existing = queryClient.getQueryData(queryKey);
  if (existing) {
    queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
      const safe = Array.isArray(old) ? old : [];

      if (isCreate) {
        if (safe.some((m: any) => m.$id === payload.$id)) return safe;
        return [...safe, payload];
      }

      if (isDelete) {
        if (!safe.some((m: any) => m.$id === payload.$id)) return safe;
        return safe.filter((m: any) => m.$id !== payload.$id);
      }

      if (isUpdate) {
        return safe.map((m: any) =>
          m.$id === payload.$id ? { ...m, ...payload } : m
        );
      }

      return safe;
    });
  } else {
    // Cache not initialized yet — invalidate to trigger a fresh fetch
    queryClient.invalidateQueries({ queryKey });
  }

  // Dispatch custom event for trip page to handle role changes
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("realtime:members", { detail: { event, tripId } })
    );
  }
}
