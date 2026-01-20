"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { SessionUser } from "@/types/user";

export function useAuth() {
  const { data: session, status } = useSession();
  const { user, setUser, clearUser } = useAuthStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser(session.user as SessionUser);
    } else if (status === "unauthenticated") {
      clearUser();
    }
  }, [session, status, setUser, clearUser]);

  return {
    user,
    session,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
