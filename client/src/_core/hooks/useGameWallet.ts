import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "./useAuth";

/**
 * useGameWallet
 *
 * Drop-in replacement for `useState(initialBalance)` in game pages.
 * - Authenticated users: initialises from the real DB balance and syncs
 *   every bet/win back to the server (placeBet / creditWin).
 * - Unauthenticated users: play with 1000 fake DMB (local only, resets on refresh).
 *
 * Usage:
 *   const { balance, balanceRef, setBalance } = useGameWallet('Dice');
 *
 * `setBalance` accepts the same functional or value form as React's useState setter.
 * It updates local state immediately (optimistic) and fires the backend call in the
 * background so the sidebar balance refreshes automatically.
 */
export function useGameWallet(gameName: string) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const balanceQuery = trpc.wallet.balance.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 0,
  });

  const [balance, setLocalBalance] = useState(1000);
  const balanceRef = useRef(1000);

  // Sync from server when authenticated balance arrives
  useEffect(() => {
    if (balanceQuery.data !== undefined) {
      const b = balanceQuery.data.balance;
      setLocalBalance(b);
      balanceRef.current = b;
    }
  }, [balanceQuery.data]);

  const placeBetMutation = trpc.wallet.placeBet.useMutation({
    onSuccess: () => utils.wallet.balance.invalidate(),
  });

  const creditWinMutation = trpc.wallet.creditWin.useMutation({
    onSuccess: () => utils.wallet.balance.invalidate(),
  });

  /**
   * Works exactly like React's setState: accepts a value or a functional updater.
   * Differences: uses balanceRef.current as source of truth (not stale React state),
   * and fires the appropriate backend call for authenticated users.
   */
  const setBalance = (updater: ((prev: number) => number) | number) => {
    const current = balanceRef.current;
    const next = typeof updater === "function" ? updater(current) : updater;
    const diff = parseFloat((next - current).toFixed(4));

    setLocalBalance(next);
    balanceRef.current = next;

    // Notify FloatingBalance chip for unauthenticated (demo) users
    window.dispatchEvent(new CustomEvent('dambler:balance', { detail: { balance: next } }));

    if (isAuthenticated && Math.abs(diff) > 0.001) {
      if (diff < 0) {
        placeBetMutation.mutate({
          amount: parseFloat(Math.abs(diff).toFixed(2)),
          game: gameName,
        });
      } else {
        creditWinMutation.mutate({
          amount: parseFloat(diff.toFixed(2)),
          game: gameName,
        });
      }
    }
  };

  return { balance, balanceRef, setBalance };
}
