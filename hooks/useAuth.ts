import { useState, useEffect } from "react";
import { account } from "@/lib/appwrite";
import { Models } from "appwrite";

export function useAuth() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setIsFetching(true);
      const currentSession = await account.get();
      if (currentSession) {
        setUser(currentSession);
      } else {
        setUser(null);
      }
    } catch (error) {
      // Not logged in
      setUser(null);
    } finally {
      setIsFetching(false);
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return { user, isLoading: isFetching, checkSession, logout };
}
