import { useEffect, useRef, useCallback } from "react";
import { client } from "@/lib/appwrite";

const RECONNECT_DELAY_MS = 1000;

export function useRealtimeSubscription(
  channels: string | string[],
  callback: (event: any) => void
) {
  const savedCallback = useRef(callback);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const subscribe = useCallback(() => {
    const channelArray = Array.isArray(channels) ? channels : [channels];
    return client.subscribe(channelArray, (event) => {
      savedCallback.current(event);
    });
  }, [channels]);

  useEffect(() => {
    let unsubscribe = subscribe();

    // Debounced reconnect — prevents multiple subscriptions from rapid events
    const reconnect = () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      reconnectTimer.current = setTimeout(() => {
        try {
          unsubscribe();
        } catch {
          // Previous subscription may already be dead
        }
        unsubscribe = subscribe();
      }, RECONNECT_DELAY_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        reconnect();
      }
    };

    window.addEventListener("online", reconnect);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      try {
        unsubscribe();
      } catch {
        // Cleanup best-effort
      }
      window.removeEventListener("online", reconnect);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [subscribe]);
}
