import { useEffect, useRef } from "react";
import { presenceService } from "@/services/presence.service";
import { Models } from "appwrite";

interface UseTripPresenceProps {
  tripId: string;
  user: Models.User<Models.Preferences> | null;
}

export function useTripPresence({ tripId, user }: UseTripPresenceProps) {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializedRef = useRef(false);
  const presenceDocIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !tripId) return;

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

    // Heartbeat every 15s
    heartbeatIntervalRef.current = setInterval(() => {
      presenceService.updateHeartbeat(tripId, user.$id);
    }, 15000);

    // Cleanup on tab close
    const handleUnload = () => {
      if (presenceDocIdRef.current) {
        presenceService.removePresenceById(presenceDocIdRef.current);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

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
