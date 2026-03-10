import { QueryClient } from "@tanstack/react-query";
import { Expense } from "@/types/expense";
import { shouldApplyEvent } from "@/lib/realtime/versionGuard";

/**
 * Handles realtime events for the trip_expenses collection.
 * Patches ["tripExpenses", tripId] cache directly.
 */
export function handleExpenseEvent(
  event: any,
  queryClient: QueryClient,
  tripId: string
) {
  const payload = event.payload;

  if (!shouldApplyEvent(payload)) return;

  const isCreate = event.events.some((e: string) => e.includes(".create"));
  const isUpdate = event.events.some((e: string) => e.includes(".update"));
  const isDelete = event.events.some((e: string) => e.includes(".delete"));

  const queryKey = ["tripExpenses", tripId];

  // Cache existence guard
  const existing = queryClient.getQueryData(queryKey);
  if (!existing) return;

  queryClient.setQueryData(queryKey, (old: Expense[] | undefined) => {
    const safe = Array.isArray(old) ? old : [];

    if (isCreate) {
      // Dedup: skip if already in cache (optimistic or real)
      const exists = safe.some(
        (exp) =>
          exp.$id === payload.$id ||
          (exp.$id.startsWith("temp-") &&
            exp.title === payload.title &&
            exp.amount === payload.amount &&
            exp.paidBy === payload.paidBy)
      );
      if (exists) return safe;
      return [payload as Expense, ...safe];
    }

    if (isDelete) {
      // Safe delete — no-op if already removed
      if (!safe.some((exp) => exp.$id === payload.$id)) return safe;

      // Also clean up related splits
      queryClient.setQueryData(
        ["tripSplits", tripId],
        (oldSplits: any[] | undefined) =>
          (oldSplits ?? []).filter((s: any) => s.expenseId !== payload.$id)
      );
      return safe.filter((exp) => exp.$id !== payload.$id);
    }

    if (isUpdate) {
      return safe.map((exp) =>
        exp.$id === payload.$id ? { ...exp, ...payload } : exp
      );
    }

    return safe;
  });
}
