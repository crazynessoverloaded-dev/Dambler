import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, User, LogOut, X, Trophy, Gift, TrendingUp,
  Gamepad2, Users, Zap, Wallet2, LayoutDashboard, Menu, ArrowDownLeft, ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const LS_KEY = "notif_seen_ts";

function getSeenTs(): number {
  return parseInt(localStorage.getItem(LS_KEY) ?? "0", 10);
}

function timeAgo(d: Date | string): string {
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function txIcon(type: string) {
  if (type === "win")        return { icon: Trophy,       color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.2)"  };
  if (type === "deposit")    return { icon: ArrowDownLeft, color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.2)"  };
  if (type === "bonus")      return { icon: Gift,          color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)"  };
  if (type === "withdrawal") return { icon: ArrowUpRight,  color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.2)" };
  return                            { icon: TrendingUp,    color: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)" };
}

function txTitle(type: string, amount: number, game?: string | null): string {
  if (type === "win")        return `You won $${amount.toFixed(2)}${game ? ` on ${game}` : ""}!`;
  if (type === "deposit")    return `Deposit of $${amount.toFixed(2)} confirmed`;
  if (type === "bonus")      return `Bonus credited — $${amount.toFixed(2)}`;
  if (type === "withdrawal") return `Withdrawal of $${amount.toFixed(2)} processed`;
  return `$${amount.toFixed(2)} transaction`;
}

const NAV_LINKS = [
  { label: "Casino",      href: "/casino",      icon: Gamepad2  },
  { label: "Sports",      href: "/sports",      icon: Trophy    },
  { label: "Promotions",  href: "/promotions",  icon: Gift      },
  { label: "Leaderboard", href: "/leaderboard", icon: TrendingUp },
  { label: "VIP Club",    href: "/vip",         icon: Zap       },
  { label: "Affiliate",   href: "/affiliate",   icon: Users     },
];

const AUTH_LINKS = [
  { label: "Wallet",    href: "/wallet",    icon: Wallet2         },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [location] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [seenTs, setSeenTs] = useState(getSeenTs);
  const isMobile = useIsMobile(768);

  // Real active-player count
  const { data: liveStats } = trpc.wallet.liveStats.useQuery(undefined, {
    refetchInterval: 60_000, staleTime: 0,
  });
  const onlineCount = liveStats?.activeUsers ?? 0;

  // Notification feed from real transactions (authenticated only)
  const { data: txData } = trpc.wallet.transactions.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated, refetchInterval: 60_000, staleTime: 0 }
  );

  // Only show meaningful notification types, newest first
  const notifs = useMemo(() => {
    if (!txData?.items) return [];
    return txData.items
      .filter(tx => ["win", "deposit", "bonus", "withdrawal"].includes(tx.type))
      .slice(0, 10);
  }, [txData]);

  const unreadCount = useMemo(() =>
    notifs.filter(tx => new Date(tx.createdAt).getTime() > seenTs).length,
    [notifs, seenTs]
  );

  function openBell() {
    setShowNotifications(p => !p);
    if (!showNotifications) {
      const now = Date.now();
      localStorage.setItem(LS_KEY, String(now));
      setSeenTs(now);
    }
  }

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50, width: '100%',
        background: 'rgba(13,13,18,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', height: 56, gap: 0 }}>

          {/* ── Logo ── */}
          <Link href="/">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: 32, flexShrink: 0 }}>
              <span style={{
                fontSize: 30, fontWeight: 400,
                fontFamily: "'Great Vibes', cursive", lineHeight: 1,
                color: '#ffffff',
              }}>Dambler</span>
            </div>
          </Link>

          {/* ── Desktop Nav Links ── */}
          {!isMobile && <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            {NAV_LINKS.map(({ label, href, icon: Icon }) => {
              const active = location === href;
              return (
                <Link key={href} href={href}>
                  <motion.div
                    whileHover={{ y: -1 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 9px', borderRadius: 9, cursor: 'pointer',
                      background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                      border: active ? '1px solid rgba(255,255,255,0.13)' : '1px solid transparent',
                      transition: 'all 0.18s',
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; } }}
                  >
                    <Icon style={{ width: 12, height: 12, flexShrink: 0 }} strokeWidth={active ? 2.2 : 1.7} />
                    {label}
                  </motion.div>
                </Link>
              );
            })}

            {/* Auth-only links */}
            {isAuthenticated && AUTH_LINKS.map(({ label, href, icon: Icon }) => {
              const active = location === href;
              return (
                <Link key={href} href={href}>
                  <motion.div
                    whileHover={{ y: -1 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 9, cursor: 'pointer',
                      background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                      border: active ? '1px solid rgba(255,255,255,0.13)' : '1px solid transparent',
                      transition: 'all 0.18s',
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; } }}
                  >
                    <Icon style={{ width: 13, height: 13, flexShrink: 0 }} strokeWidth={active ? 2.2 : 1.7} />
                    {label}
                  </motion.div>
                </Link>
              );
            })}
          </div>}

          {/* ── Right side ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>

            {/* Live active users – desktop only */}
            {!isMobile && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 20,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <motion.span
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: onlineCount > 0 ? '#4ade80' : 'rgba(255,255,255,0.3)', display: 'inline-block', flexShrink: 0 }}
                />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
                  <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                    {onlineCount > 0 ? onlineCount.toLocaleString() : '—'}
                  </span>{' '}online
                </span>
              </div>
            </div>}

            {/* Notifications — only visible when authenticated */}
            {isAuthenticated && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={openBell}
                style={{
                  position: 'relative', padding: 7, borderRadius: 9,
                  background: showNotifications ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.18s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                onMouseLeave={e => { if (!showNotifications) e.currentTarget.style.background = 'transparent'; }}
                aria-label="Notifications"
              >
                <Bell style={{ width: 17, height: 17, color: unreadCount > 0 ? '#f59e0b' : 'rgba(255,255,255,0.45)' }} />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        minWidth: 14, height: 14, borderRadius: 7, padding: '0 3px',
                        background: '#f59e0b', border: '1.5px solid #0d0d12',
                        fontSize: 8, fontWeight: 900, color: '#0d0d12',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                      }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Backdrop */}
                    <div onClick={() => setShowNotifications(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 59 }} />

                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                        width: 348, borderRadius: 16,
                        background: '#141419', border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 56px rgba(0,0,0,0.7)', zIndex: 60,
                        overflow: 'hidden',
                      }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Notifications</span>
                          {unreadCount > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <button onClick={() => setShowNotifications(false)}
                          style={{ padding: 4, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <X style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.4)' }} />
                        </button>
                      </div>

                      {/* Items */}
                      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                        {notifs.length === 0 ? (
                          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                            No notifications yet
                          </div>
                        ) : notifs.map((tx, i) => {
                          const { icon: Icon, color, bg, border } = txIcon(tx.type);
                          const isUnread = new Date(tx.createdAt).getTime() > seenTs;
                          return (
                            <motion.div key={tx.id}
                              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              style={{
                                padding: '11px 16px', cursor: 'default',
                                borderBottom: i < notifs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                background: isUnread ? 'rgba(245,158,11,0.03)' : 'transparent',
                                transition: 'background 0.15s', position: 'relative',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                              onMouseLeave={e => (e.currentTarget.style.background = isUnread ? 'rgba(245,158,11,0.03)' : 'transparent')}>
                              {isUnread && (
                                <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#f59e0b' }} />
                              )}
                              <div style={{ display: 'flex', gap: 11 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Icon style={{ width: 14, height: 14, color }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {txTitle(tx.type, tx.amount, tx.game)}
                                  </p>
                                  <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.22)', margin: 0 }}>
                                    {timeAgo(tx.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Footer */}
                      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <Link href="/wallet" onClick={() => setShowNotifications(false)}>
                          <button style={{ width: '100%', fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.38)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0', transition: 'color 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}>
                            View transaction history →
                          </button>
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            )}

            {/* Auth */}
            {!isAuthenticated ? (
              <>
                <Link href="/login">
                  <button style={{
                    height: 32, padding: '0 14px', borderRadius: 8,
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.6)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'; }}>
                    Login
                  </button>
                </Link>
                <Link href="/register">
                  <button style={{
                    height: 32, padding: '0 14px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.17)',
                    color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.16)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}>
                    Register
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/wallet">
                  <button style={{
                    height: 32, padding: '0 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'; }}>
                    <Wallet2 style={{ width: 12, height: 12 }} />
                    Deposit
                  </button>
                </Link>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.65)', padding: '0 4px' }}>{user?.username}</span>
                <Link href="/settings">
                  <button style={{ padding: 7, borderRadius: 9, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', transition: 'background 0.18s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <User style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.45)' }} />
                  </button>
                </Link>
                <button onClick={logout} style={{ padding: 7, borderRadius: 9, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', transition: 'background 0.18s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  aria-label="Log out">
                  <LogOut style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.38)' }} />
                </button>
              </>
            )}

            {/* Mobile hamburger — only on narrow screens */}
            {isMobile && <button
              onClick={() => setMobileOpen(v => !v)}
              style={{ padding: 7, borderRadius: 9, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', transition: 'background 0.18s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {mobileOpen ? <X style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.6)' }} /> : <Menu style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.6)' }} />}
            </button>}
          </div>
        </div>

        {/* ── Mobile menu dropdown ── */}
        <AnimatePresence>
          {isMobile && mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[...NAV_LINKS, ...(isAuthenticated ? AUTH_LINKS : [])].map(({ label, href, icon: Icon }) => {
                  const active = location === href;
                  return (
                    <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                        background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                        color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                        fontSize: 13, fontWeight: active ? 700 : 500,
                        transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                        <Icon style={{ width: 14, height: 14 }} strokeWidth={active ? 2.2 : 1.7} />
                        {label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
