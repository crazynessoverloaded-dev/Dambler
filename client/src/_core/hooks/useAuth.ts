import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

interface UseAuthOptions {
  /** Redirect to login when the user is not authenticated. Default: false. */
  redirectOnUnauthenticated?: boolean;
}

/**
 * useAuth
 * Returns the current user's authentication state and utility methods.
 *
 * Usage:
 *   const { user, isAuthenticated, loading, logout } = useAuth();
 *
 * To guard a page (redirect if not logged in):
 *   useAuth({ redirectOnUnauthenticated: true });
 */
export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false } = options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => utils.auth.me.setData(undefined, null),
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Ignore "already logged out" errors
      if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") return;
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(
    () => ({
      user: meQuery.data ?? null,
      isAuthenticated: Boolean(meQuery.data),
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
    }),
    [meQuery.data, meQuery.error, meQuery.isLoading, logoutMutation.error, logoutMutation.isPending]
  );

  // Redirect to login if the option is set and user is not authenticated
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.loading) return;
    if (state.user) return;

    window.location.href = getLoginUrl();
  }, [redirectOnUnauthenticated, state.loading, state.user]);

  return {
    ...state,
    logout,
    refresh: () => meQuery.refetch(),
  };
}
