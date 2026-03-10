import { useMemo, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Expense, ExpenseSplit } from "@/types/expense";

/**
 * Debounce helper — batches rapid calls into a single execution after `delay` ms.
 */
function createDebounce(delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (fn: () => void) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

export function useTripRealtime(tripId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Debounce for non-expense events to batch rapid updates
  const debouncedInvalidation = useMemo(() => createDebounce(50), []);

  // Cleanup debounce timer on unmount
  const debounceCleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (debounceCleanupRef.current) clearTimeout(debounceCleanupRef.current);
    };
  }, []);

  const channels = useMemo(
    () => [
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!}.collections.activities.documents`,
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!}.collections.trip_days.documents`,
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!}.collections.trip_members.documents`,
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!}.collections.trip_expenses.documents`,
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!}.collections.expense_splits.documents`,
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!}.collections.trip_checklists.documents`,
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!}.collections.checklist_items.documents`,
    ],
    []
  );

  const handleRealtimeEvent = useCallback(
    (event: any) => {
      const payload = event.payload;

      if (payload.tripId && payload.tripId !== tripId) return;

      // Skip our own events — optimistic updates already applied
      if (user && payload.updatedBy === user.$id) return;

      const isCreate = event.events.some((e: string) => e.includes(".create"));
      const isUpdate = event.events.some((e: string) => e.includes(".update"));
      const isDelete = event.events.some((e: string) => e.includes(".delete"));

      if (!isCreate && !isUpdate && !isDelete) return;

      // --- Expense events: patch cache directly ---
      const isExpenseEvent = event.events.some((e: string) =>
        e.includes("trip_expenses.")
      );
      const isSplitEvent = event.events.some((e: string) =>
        e.includes("expense_splits.")
      );

      if (isExpenseEvent) {
        queryClient.setQueryData(
          ["tripExpenses", tripId],
          (old: Expense[] | undefined) => {
            const safe = old ?? [];

            if (isCreate) {
              // Avoid duplicates — match by ID or by content if optimistic (temp-) item exists
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
              // Also clean up related splits
              queryClient.setQueryData(
                ["tripSplits", tripId],
                (oldSplits: ExpenseSplit[] | undefined) =>
                  (oldSplits ?? []).filter((s) => s.expenseId !== payload.$id)
              );
              return safe.filter((exp) => exp.$id !== payload.$id);
            }

            if (isUpdate) {
              return safe.map((exp) =>
                exp.$id === payload.$id ? { ...exp, ...payload } : exp
              );
            }

            return safe;
          }
        );
        return;
      }

      if (isSplitEvent) {
        queryClient.setQueryData(
          ["tripSplits", tripId],
          (old: ExpenseSplit[] | undefined) => {
            const safe = old ?? [];

            if (isCreate) {
              const exists = safe.some((s) => s.$id === payload.$id);
              if (exists) return safe;
              return [...safe, payload as ExpenseSplit];
            }

            if (isDelete) {
              return safe.filter((s) => s.$id !== payload.$id);
            }

            if (isUpdate) {
              return safe.map((s) =>
                s.$id === payload.$id ? { ...s, ...payload } : s
              );
            }

            return safe;
          }
        );
        return;
      }

      // --- Non-expense events: debounced invalidation ---
      if (
        event.events.some(
          (e: string) => e.includes("activities.") || e.includes("trip_days.")
        )
      ) {
        debouncedInvalidation(() =>
          queryClient.invalidateQueries({ queryKey: ["tripDays", tripId] })
        );
      }

      if (
        event.events.some(
          (e: string) =>
            e.includes("trip_checklists.") || e.includes("checklist_items.")
        )
      ) {
        debouncedInvalidation(() =>
          queryClient.invalidateQueries({
            queryKey: ["tripChecklists", tripId],
          })
        );
      }

      if (event.events.some((e: string) => e.includes("trip_members."))) {
        debouncedInvalidation(() =>
          queryClient.invalidateQueries({
            queryKey: ["tripMembers", tripId],
          })
        );
      }
    },
    [tripId, queryClient, user, debouncedInvalidation]
  );

  useRealtimeSubscription(channels, handleRealtimeEvent);
}
