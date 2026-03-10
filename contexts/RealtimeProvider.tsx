"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient, QueryClient } from "@tanstack/react-query";
import { client } from "@/lib/appwrite";
import { useAuth } from "@/hooks/useAuth";
import { routeRealtimeEvent, RealtimeModule } from "@/lib/realtime/eventRouter";
import { extractTripId } from "@/lib/realtime/extractTripId";
import { shouldApplyEvent, clearVersionMap } from "@/lib/realtime/versionGuard";

// Handlers
import { handleExpenseEvent } from "@/lib/realtime/handlers/expenses.handler";
import { handleSplitEvent } from "@/lib/realtime/handlers/splits.handler";
import {
  handleItineraryEvent,
  cleanupItineraryHandler,
} from "@/lib/realtime/handlers/itinerary.handler";
import {
  handleChecklistEvent,
  cleanupChecklistHandler,
} from "@/lib/realtime/handlers/checklists.handler";
import { handleFilesEvent } from "@/lib/realtime/handlers/files.handler";
import { handleMembersEvent } from "@/lib/realtime/handlers/members.handler";
import { handleReservationsEvent } from "@/lib/realtime/handlers/reservations.handler";
import { handleTripsEvent } from "@/lib/realtime/handlers/trips.handler";
import { handleRoleRequestsEvent } from "@/lib/realtime/handlers/roleRequests.handler";
import { handlePresenceEvent } from "@/lib/realtime/handlers/presence.handler";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

/** All channels the pipeline listens to */
const CHANNELS = [
  `databases.${DB_ID}.collections.activities.documents`,
  `databases.${DB_ID}.collections.trip_days.documents`,
  `databases.${DB_ID}.collections.trip_checklists.documents`,
  `databases.${DB_ID}.collections.checklist_items.documents`,
  `databases.${DB_ID}.collections.trip_expenses.documents`,
  `databases.${DB_ID}.collections.expense_splits.documents`,
  `databases.${DB_ID}.collections.trip_files.documents`,
  `databases.${DB_ID}.collections.trip_members.documents`,
  `databases.${DB_ID}.collections.trip_reservations.documents`,
  `databases.${DB_ID}.collections.role_requests.documents`,
  `databases.${DB_ID}.collections.trip_presence.documents`,
  `databases.${DB_ID}.collections.trips.documents`,
];

/** Queries to invalidate after reconnect to recover missed events */
const RECOVERY_KEYS = [
  "tripDays",
  "tripExpenses",
  "tripSplits",
  "tripChecklists",
  "tripFiles",
  "tripMembers",
  "tripReservations",
];

/** Handler registry — maps module names to their handler functions */
type HandlerFn = (event: any, queryClient: QueryClient, tripId: string) => void;

const handlers: Partial<Record<RealtimeModule, HandlerFn>> = {
  expenses: handleExpenseEvent,
  splits: handleSplitEvent,
  itinerary: handleItineraryEvent,
  checklists: handleChecklistEvent,
  files: handleFilesEvent,
  members: handleMembersEvent,
  reservations: handleReservationsEvent,
  trips: handleTripsEvent,
};

/** Handlers that don't need queryClient (dispatch CustomEvents) */
type EventOnlyHandlerFn = (event: any, tripId: string) => void;

const eventOnlyHandlers: Partial<Record<RealtimeModule, EventOnlyHandlerFn>> = {
  roleRequests: handleRoleRequestsEvent,
  presence: handlePresenceEvent,
};

const RECONNECT_DELAY_MS = 1000;

/**
 * Central realtime provider — maintains a single Appwrite websocket
 * connection and routes events through feature-specific handlers.
 *
 * Mount once globally, wrapping the app inside QueryProvider.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const subscriptionRef = useRef<(() => void) | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRealtimeEvent = useCallback(
    (event: any) => {
      const payload = event.payload;
      if (!payload) return;

      // Route to the correct module
      const module = routeRealtimeEvent(event);
      if (module === "unknown") return;

      // Dev debug logging
      if (process.env.NODE_ENV === "development") {
        console.log("[Realtime]", module, event.events?.[0], payload?.$id);
      }

      // Extract and validate tripId
      const eventTripId = extractTripId(payload);

      // Skip own events — optimistic updates already applied
      if (user && payload.updatedBy === user.$id) return;

      // Version guard — prevent out-of-order events
      if (!shouldApplyEvent(payload)) return;

      // Determine if we need CRUD detection
      const isCreate = event.events.some((e: string) => e.includes(".create"));
      const isUpdate = event.events.some((e: string) => e.includes(".update"));
      const isDelete = event.events.some((e: string) => e.includes(".delete"));
      if (!isCreate && !isUpdate && !isDelete) return;

      // Event-only handlers (CustomEvent dispatch — no tripId filtering needed)
      const eventOnlyHandler = eventOnlyHandlers[module];
      if (eventOnlyHandler) {
        eventOnlyHandler(event, eventTripId || "");
        return;
      }

      // Trip isolation guard — skip events from other trips
      if (!eventTripId) return;

      // Dispatch to feature handler via registry
      const handler = handlers[module];
      if (handler) {
        handler(event, queryClient, eventTripId);
      }
    },
    [queryClient, user]
  );

  /** Invalidate all important queries to recover missed events */
  const invalidateAllForRecovery = useCallback(() => {
    // We invalidate broadly — React Query will only refetch active queries
    RECOVERY_KEYS.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  }, [queryClient]);

  const subscribe = useCallback(() => {
    return client.subscribe(CHANNELS, handleRealtimeEvent);
  }, [handleRealtimeEvent]);

  const reconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

    reconnectTimerRef.current = setTimeout(() => {
      // Tear down old subscription
      try {
        subscriptionRef.current?.();
      } catch {
        // Previous subscription may already be dead
      }

      // Clear version map since we may have missed events
      clearVersionMap();

      // Re-subscribe
      subscriptionRef.current = subscribe();

      // Invalidate to recover any missed events
      invalidateAllForRecovery();
    }, RECONNECT_DELAY_MS);
  }, [subscribe, invalidateAllForRecovery]);

  useEffect(() => {
    // Don't subscribe until user is authenticated
    if (!user) return;

    // Singleton guard — prevent duplicate subscriptions
    if (subscriptionRef.current) return;

    subscriptionRef.current = subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        reconnect();
      }
    };

    const handleOnline = () => {
      reconnect();
    };

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

      try {
        subscriptionRef.current?.();
      } catch {
        // Cleanup best-effort
      }
      subscriptionRef.current = null;

      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Cleanup handler-level state
      cleanupItineraryHandler();
      cleanupChecklistHandler();
      clearVersionMap();
    };
  }, [user, subscribe, reconnect]);

  return <>{children}</>;
}
