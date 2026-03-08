import { useEffect, useRef } from "react";
import { client } from "@/lib/appwrite";

export function useRealtimeSubscription(
  channels: string | string[],
  callback: (event: any) => void
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const channelArray = Array.isArray(channels) ? channels : [channels];
    const unsubscribe = client.subscribe(channelArray, (event) => {
      savedCallback.current(event);
    });

    return () => {
      unsubscribe();
    };
  }, [channels]);
}
