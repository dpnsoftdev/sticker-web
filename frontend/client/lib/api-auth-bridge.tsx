"use client";

import { signOut, useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { ROUTES } from "@/lib/constants";
import { registerAuthSessionBridge } from "@/lib/fetcher";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Wires apiClient token refresh to NextAuth JWT and ends the session when refresh is impossible.
 */
export function ApiAuthBridge() {
  const { update } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    registerAuthSessionBridge({
      persistSessionTokens: async (accessToken, refreshToken) => {
        await update({
          accessToken,
          refreshToken,
        });
      },
      onSessionInvalid: async () => {
        useAuthStore.getState().clearUser();
        queryClient.clear();
        await signOut({ redirect: true, callbackUrl: ROUTES.LOGIN });
      },
    });

    return () => registerAuthSessionBridge(null);
  }, [update, queryClient]);

  return null;
}
