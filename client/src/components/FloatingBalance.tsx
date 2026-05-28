import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

export default function FloatingBalance() {
  const { isAuthenticated } = useAuth();

  const balanceQuery = trpc.wallet.balance.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 0,
  });

  const xpQuery = trpc.wallet.myXp.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15_000,
    staleTime: 0,
  });
  const xp = xpQuery.data?.xp ?? 0;

  const serverBalance = balanceQuery.data?.balance;

  const [balance, setBalance] = useState<number>(serverBalance ?? 0);
  const [displayed, setDisplayed] = useState<number>(serverBalance ?? 0);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef<number>(serverBalance ?? 0);
  const rafRef = useRef<number | null>(null);

  // Sync authenticated server balance on initial load
  useEffect(() => {
    if (serverBalance !== undefined) {
      setBalance(serverBalance);
    }
  }, [serverBalance]);

  // Reset to 0 immediately when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setBalance(0);
    }
  }, [isAuthenticated]);

  // Listen for demo (unauthenticated) balance updates from useGameWallet
  useEffect(() => {
    if (isAuthenticated) return;
    const handler = (e: Event) => {
      const { balance: next } = (e as CustomEvent<{ balance: number }>).detail;
      setBalance(next);
    };
    window.addEventListener('dambler:balance', handler);
    return () => window.removeEventListener('dambler:balance', handler);
  }, [isAuthenticated]);

  // Also listen for authenticated updates (fires after server invalidation refetches)
  useEffect(() => {
    if (!isAuthenticated) return;
    const handler = (e: Event) => {
      const { balance: next } = (e as CustomEvent<{ balance: number }>).detail;
      setBalance(next);
    };
    window.addEventListener('dambler:balance', handler);
    return () => window.removeEventListener('dambler:balance', handler);
  }, [isAuthenticated]);

  // Animate the displayed number and trigger flash
  useEffect(() => {
    const prev = prevRef.current;
    const next = balance;
    if (Math.abs(next - prev) < 0.001) return;

    setFlash(next > prev ? 'up' : 'down');
    const flashTimer = setTimeout(() => setFlash(null), 900);

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const start = prev;
    const end = next;
    const duration = 550;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(start + (end - start) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayed(end);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    prevRef.current = next;

    return () => {
      clearTimeout(flashTimer);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [balance]);

  const borderColor = flash === 'up'
    ? 'rgba(74,222,128,0.7)'
    : flash === 'down'
      ? 'rgba(239,68,68,0.65)'
      : 'rgba(251,191,36,0.35)';

  const glowColor = flash === 'up'
    ? '0 0 22px rgba(74,222,128,0.22)'
    : flash === 'down'
      ? '0 0 22px rgba(239,68,68,0.22)'
      : '0 0 18px rgba(251,191,36,0.08)';

  const amountColor = flash === 'up'
    ? '#4ade80'
    : flash === 'down'
      ? '#ef4444'
      : '#fbbf24';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 16px 9px 10px',
        borderRadius: 50,
        background: 'rgba(13,13,18,0.92)',
        border: `1.5px solid ${borderColor}`,
        boxShadow: `0 4px 28px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04), ${glowColor}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        userSelect: 'none',
      }}
    >
      {/* Coin icon */}
      <motion.div
        animate={flash ? { scale: [1, 1.25, 1] } : {}}
        transition={{ duration: 0.35 }}
        style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: flash === 'up'
            ? 'rgba(74,222,128,0.14)'
            : flash === 'down'
              ? 'rgba(239,68,68,0.14)'
              : 'rgba(251,191,36,0.1)',
          border: `1.5px solid ${flash === 'up' ? 'rgba(74,222,128,0.45)' : flash === 'down' ? 'rgba(239,68,68,0.45)' : 'rgba(251,191,36,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s',
        }}>
        <span style={{
          fontSize: 11, fontWeight: 900, color: amountColor,
          lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', height: '100%',
        }}>$</span>
      </motion.div>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{
          fontSize: 9, color: 'rgba(255,255,255,0.32)',
          letterSpacing: 1.5, fontWeight: 700, textTransform: 'uppercase',
          marginBottom: 3,
        }}>
          {isAuthenticated ? 'Balance' : 'Demo'}
        </span>

        <AnimatePresence mode="wait">
          <motion.span
            key={flash ?? 'idle'}
            initial={{ y: flash === 'up' ? 6 : flash === 'down' ? -6 : 0, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: 15, fontWeight: 900,
              fontVariantNumeric: 'tabular-nums',
              color: amountColor,
              transition: 'color 0.3s',
              letterSpacing: 0.3,
            }}>
            ${displayed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.span>
        </AnimatePresence>

        {/* XP badge — only for authenticated users */}
        {isAuthenticated && xp > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 800, marginTop: 4, letterSpacing: 0.5,
            color: 'rgba(245,158,11,0.7)',
          }}>
            ⚡ {xp.toLocaleString()} XP
          </span>
        )}
      </div>
    </motion.div>
  );
}
