import { useEffect, useRef } from "react";
import { presenceService } from "@/services/presence.service";
import { Models } from "appwrite";

interface UseTripPresenceProps {
  tripId: string;
  user: Models.User<Models.Preferences> | null;
}

export function useTripPresence({ tripId, user }: UseTripPresenceProps) {
  // Store the active heartbeat interval to clear it on unmount
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // We uniquely identify whether the presence has been initialized
  const initializedRef = useRef(false);
  const presenceDocIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !tripId) return;

    // 1. Initial presence join
    const joinPresence = async () => {
      try {
        const avatarInitial = user.name?.[0] || user.email?.[0] || "?";
        const doc = await presenceService.upsertPresence({
          tripId,
          userId: user.$id,
          userName: user.name || "Unknown",
          avatarInitial: avatarInitial.toUpperCase(),
          status: "viewing",
          editingDayId: undefined,
        });
        presenceDocIdRef.current = doc.$id;
        initializedRef.current = true;
      } catch (error) {
        console.error("Failed to initialize presence:", error);
      }
    };

    if (!initializedRef.current) {
      joinPresence();
    }

    // 2. Start heartbeat (every 15 seconds)
    heartbeatIntervalRef.current = setInterval(() => {
      presenceService.updateHeartbeat(tripId, user.$id);
    }, 15000);

    // 3. Tab Close / Page Navigation Handlers
    const handleUnload = () => {
      if (presenceDocIdRef.current) {
        // Ping Appwrite API natively before browser wipes the JS execution context
        presenceService.removePresenceById(presenceDocIdRef.current);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    // 4. Cleanup on unmount or trip change
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);

      if (presenceDocIdRef.current) {
        presenceService.removePresenceById(presenceDocIdRef.current);
      } else {
        presenceService.removePresence(tripId, user.$id);
      }

      initializedRef.current = false;
      presenceDocIdRef.current = null;
    };
  }, [tripId, user]);

  // Hook helpers for manual updates (used inside Drag operations and Modals)
  const setEditingStatus = async (dayId: string) => {
    if (!user || !tripId) return;
    await presenceService.updateStatus(tripId, user.$id, "editing", dayId);
  };

  const setViewingStatus = async () => {
    if (!user || !tripId) return;
    await presenceService.updateStatus(tripId, user.$id, "viewing", undefined);
  };

  return {
    setEditingStatus,
    setViewingStatus,
  };
}
