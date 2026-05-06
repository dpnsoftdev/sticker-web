"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { setAuthTokens } from "@/lib/fetcher";
import { SessionUser } from "@/types/user";

export function useAuth() {
  const { data: session, status } = useSession();
  const { user, setUser, clearUser } = useAuthStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser(session.user as SessionUser);
      setAuthTokens(session.accessToken ?? null, session.refreshToken ?? null);
    } else if (status === "unauthenticated") {
      clearUser();
      setAuthTokens(null, null);
    }
  }, [session, status, setUser, clearUser]);

  return {
    user,
    session,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
