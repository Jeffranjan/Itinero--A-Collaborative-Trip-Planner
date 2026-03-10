import { QueryClient } from "@tanstack/react-query";
import { ExpenseSplit } from "@/types/expense";
import { shouldApplyEvent } from "@/lib/realtime/versionGuard";

/**
 * Handles realtime events for the expense_splits collection.
 * Patches ["tripSplits", tripId] cache directly.
 */
export function handleSplitEvent(
  event: any,
  queryClient: QueryClient,
  tripId: string
) {
  const payload = event.payload;

  if (!shouldApplyEvent(payload)) return;

  const isCreate = event.events.some((e: string) => e.includes(".create"));
  const isUpdate = event.events.some((e: string) => e.includes(".update"));
  const isDelete = event.events.some((e: string) => e.includes(".delete"));

  const queryKey = ["tripSplits", tripId];

  // Cache existence guard
  const existing = queryClient.getQueryData(queryKey);
  if (!existing) return;

  queryClient.setQueryData(queryKey, (old: ExpenseSplit[] | undefined) => {
    const safe = Array.isArray(old) ? old : [];

    if (isCreate) {
      const exists = safe.some((s) => s.$id === payload.$id);
      if (exists) return safe;
      return [...safe, payload as ExpenseSplit];
    }

    if (isDelete) {
      if (!safe.some((s) => s.$id === payload.$id)) return safe;
      return safe.filter((s) => s.$id !== payload.$id);
    }

    if (isUpdate) {
      return safe.map((s) =>
        s.$id === payload.$id ? { ...s, ...payload } : s
      );
    }

    return safe;
  });
}
