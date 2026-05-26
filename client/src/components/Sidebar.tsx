import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Menu, X, Zap, Gamepad2, Trophy, Users, Gift,
  Settings, ShieldCheck, LayoutDashboard, Shield,
  Wallet2, Star, TrendingUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG     = '#0d0d12';
const BORDER = 'rgba(255,255,255,0.08)';

// ─── Navigation ──────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    label: 'THE FLOOR',
    items: [
      { label: 'Casino',      icon: Gamepad2,        href: '/casino'      },
      { label: 'Sports',      icon: Trophy,          href: '/sports'      },
    ],
  },
  {
    label: 'PRIVILEGES',
    items: [
      { label: 'Leaderboard', icon: TrendingUp,      href: '/leaderboard' },
      { label: 'Promotions',  icon: Gift,            href: '/promotions'  },
      { label: 'Daily Spin',  icon: Star,            href: '/daily-spin'  },
      { label: 'Affiliate',   icon: Users,           href: '/affiliate'   },
      { label: 'VIP Club',    icon: Zap,             href: '/vip'         },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { label: 'Wallet',      icon: Wallet2,         href: '/wallet'      },
      { label: 'Dashboard',   icon: LayoutDashboard, href: '/dashboard'   },
    ],
  },
];

const FOOTER = [
  { label: 'Settings',             icon: Settings,    href: '/settings'           },
  { label: 'Provably Fair',        icon: Shield,      href: '/provably-fair'      },
  { label: 'Responsible Gambling', icon: ShieldCheck, href: '/responsible-gambling'},
];

// ─── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({
  href, label, icon: Icon, active, onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  active: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href} onClick={onClick}>
      <motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{ x: hovered && !active ? 3 : 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center', gap: 13,
          padding: '8px 16px 8px 14px',
          borderRadius: 12, cursor: 'pointer',
          margin: '1px 10px',
          background: active
            ? 'rgba(255,255,255,0.09)'
            : hovered
              ? 'rgba(255,255,255,0.05)'
              : 'transparent',
          border: active
            ? '1px solid rgba(255,255,255,0.13)'
            : hovered
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid transparent',
          boxShadow: active
            ? '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)'
            : 'none',
          transition: 'background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease',
        }}>

        {/* Shimmer sweep on active */}
        {active && (
          <motion.div
            animate={{ x: ['-200%', '500%'] }}
            transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '38%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Icon badge */}
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: active
            ? 'rgba(255,255,255,0.12)'
            : hovered
              ? 'rgba(255,255,255,0.07)'
              : 'rgba(255,255,255,0.04)',
          border: active
            ? '1px solid rgba(255,255,255,0.18)'
            : hovered
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(255,255,255,0.07)',
          transition: 'all 0.22s ease',
        }}>
          <Icon style={{
            width: 15, height: 15,
            color: active || hovered ? '#ffffff' : 'rgba(255,255,255,0.35)',
            transition: 'color 0.22s ease',
          }} strokeWidth={active ? 2.2 : 1.7} />
        </div>

        {/* Label */}
        <span style={{
          fontSize: 13.5, fontWeight: active ? 700 : 500,
          color: active ? '#ffffff' : hovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.52)',
          letterSpacing: active ? 0.3 : 0,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          flex: 1,
          transition: 'color 0.22s ease',
        }}>
          {label}
        </span>

        {/* Active indicator dot */}
        {active && (
          <motion.div
            animate={{ opacity: [1, 0.25, 1], scale: [1, 1.3, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.6)',
              boxShadow: '0 0 6px rgba(255,255,255,0.4)',
            }}
          />
        )}
      </motion.div>
    </Link>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const [isOpen, setIsOpen]   = useState(false);
  const [location]            = useLocation();
  const { isAuthenticated, user } = useAuth();

  const balanceQuery = trpc.wallet.balance.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const close     = () => setIsOpen(false);
  const balance   = balanceQuery.data?.balance;
  const formatted = balance !== undefined
    ? balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  return (
    <>
      {/* ── Mobile toggle ── */}
      <button
        className="fixed z-50 lg:hidden"
        style={{
          top: 14, left: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 9,
          background: 'rgba(255,255,255,0.07)',
          border: `1px solid ${BORDER}`,
          color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
          transition: 'all 0.18s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
        onClick={() => setIsOpen(v => !v)}
        aria-label="Toggle menu">
        {isOpen ? <X style={{ width: 16, height: 16 }} /> : <Menu style={{ width: 16, height: 16 }} />}
      </button>

      {/* ── Mobile overlay ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(3px)' }}
          onClick={close}
        />
      )}

      {/* ══════════════════════════════════════════════
          SIDEBAR PANEL
      ══════════════════════════════════════════════ */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-72
          flex flex-col z-40
          transition-transform duration-300 ease-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: BG,
          borderRight: `1px solid ${BORDER}`,
        }}>

        {/* ── Subtle noise texture ── */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'repeat',
            opacity: 0.4,
          }} />
          {/* Right edge subtle line */}
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 1, height: '100%',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.08) 75%, transparent 100%)',
          }} />
        </div>

        {/* ── LOGO ────────────────────────────────────── */}
        <div style={{
          padding: '14px 20px 12px',
          borderBottom: `1px solid ${BORDER}`,
          position: 'relative', zIndex: 1,
        }}>
          <Link href="/" onClick={close}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <div style={{
                fontSize: 18, fontWeight: 900, color: '#ffffff',
                letterSpacing: 1.5, textTransform: 'uppercase',
                fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1,
              }}>Dambler</div>
            </div>
          </Link>
        </div>

        {/* ── NAVIGATION ──────────────────────────────── */}
        <nav style={{
          flex: 1, overflowY: 'auto', padding: '2px 0 2px',
          position: 'relative', zIndex: 1,
          scrollbarWidth: 'none',
        }}>
          {SECTIONS.map(({ label, items }, si) => (
            <div key={si} style={{ marginBottom: 1 }}>

              {/* Section label */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 20px 4px',
              }}>
                <span style={{
                  fontSize: 8.5, fontWeight: 800, letterSpacing: 2.2,
                  color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>{label}</span>
                <div style={{
                  flex: 1, height: 1,
                  background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)',
                }} />
              </div>

              {items.map(item => (
                <NavItem
                  key={item.href}
                  {...item}
                  active={location === item.href}
                  onClick={close}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* ── FOOTER NAV ──────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${BORDER}`,
          padding: '4px 10px 2px',
          position: 'relative', zIndex: 1,
        }}>
          {FOOTER.map(({ label, icon: Icon, href }) => (
            <Link key={href} href={href} onClick={close}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '4px 14px', borderRadius: 8, cursor: 'pointer',
                  color: 'rgba(255,255,255,0.2)',
                  transition: 'color 0.18s, background 0.18s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.6)';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.2)';
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}>
                <Icon style={{ width: 11, height: 11, flexShrink: 0 }} strokeWidth={1.5} />
                <span style={{ fontSize: 11, letterSpacing: 0.2 }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── WALLET / AUTH ────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${BORDER}`,
          padding: '12px 16px 14px',
          position: 'relative', zIndex: 1,
        }}>
          {isAuthenticated ? (
            <>
              {/* Balance card */}
              <div style={{
                marginBottom: 8,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${BORDER}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{
                    fontSize: 8.5, fontWeight: 800, letterSpacing: 2.2,
                    color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase',
                  }}>Balance</span>
                  {user && (
                    <span style={{
                      fontSize: 10, color: 'rgba(255,255,255,0.2)', maxWidth: 110,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{user.username}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontSize: 22, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1,
                    color: '#ffffff',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {formatted ?? '—'}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: 1 }}>DMB</span>
                </div>
              </div>

              {/* Deposit button */}
              <Link href="/wallet" onClick={close}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    padding: '10px 0', borderRadius: 11,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
                    textAlign: 'center', cursor: 'pointer',
                  }}>
                  <motion.div
                    animate={{ x: ['-180%', '350%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      width: '40%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                  <span style={{
                    fontSize: 11.5, fontWeight: 900, color: '#ffffff',
                    letterSpacing: 2.5, textTransform: 'uppercase',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>✦ Deposit ✦</span>
                </motion.div>
              </Link>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Sign up */}
              <Link href="/register" onClick={close}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    padding: '10px 0', borderRadius: 11,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
                    textAlign: 'center', cursor: 'pointer',
                  }}>
                  <motion.div
                    animate={{ x: ['-180%', '350%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      width: '40%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                  <span style={{
                    fontSize: 11.5, fontWeight: 900, color: '#ffffff',
                    letterSpacing: 2, textTransform: 'uppercase',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>Join Free</span>
                </motion.div>
              </Link>

              {/* Log in */}
              <Link href="/login" onClick={close}>
                <div
                  style={{
                    padding: '9px 0', borderRadius: 11,
                    background: 'transparent', border: `1px solid ${BORDER}`,
                    textAlign: 'center', cursor: 'pointer',
                    fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.15)';
                    (e.currentTarget as HTMLDivElement).style.color = '#ffffff';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    (e.currentTarget as HTMLDivElement).style.borderColor = BORDER;
                    (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.25)';
                  }}>
                  Sign In
                </div>
              </Link>
            </div>
          )}
        </div>

      </aside>
    </>
  );
}
