import { useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useAuth } from "@/hooks/useAuth";

export function useTripRealtime(tripId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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

      // Filter events to only this trip
      if (payload.tripId && payload.tripId !== tripId) return;

      // Optional: filter out our own events if we have updatedBy tracking
      if (user && payload.updatedBy === user.$id) return;

      const isCreate = event.events.some((e: string) => e.includes(".create"));
      const isUpdate = event.events.some((e: string) => e.includes(".update"));
      const isDelete = event.events.some((e: string) => e.includes(".delete"));

      if (!isCreate && !isUpdate && !isDelete) return;

      // Invalidate specific queries based on the collection that changed

      if (
        event.events.some(
          (e: string) => e.includes("activities.") || e.includes("trip_days.")
        )
      ) {
        queryClient.invalidateQueries({ queryKey: ["tripDays", tripId] });
      }

      if (
        event.events.some(
          (e: string) =>
            e.includes("trip_expenses.") || e.includes("expense_splits.")
        )
      ) {
        queryClient.invalidateQueries({ queryKey: ["tripExpenses", tripId] });
      }

      if (
        event.events.some(
          (e: string) =>
            e.includes("trip_checklists.") || e.includes("checklist_items.")
        )
      ) {
        queryClient.invalidateQueries({ queryKey: ["tripChecklists", tripId] });
      }

      if (event.events.some((e: string) => e.includes("trip_members."))) {
        queryClient.invalidateQueries({ queryKey: ["tripMembers", tripId] });
      }
    },
    [tripId, queryClient, user]
  );

  useRealtimeSubscription(channels, handleRealtimeEvent);
}
