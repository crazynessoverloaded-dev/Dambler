import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { TIERS, getXpTier } from '@/lib/tiers';
import {
  BarChart2, TrendingUp, Trophy, Zap, ChevronRight, ArrowUpRight,
  ArrowDownLeft, Star, Clock, Users, Activity, Flame, Target,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GAME_NAMES: Record<string, string> = {
  WheelGame: 'Wheel', RapidRoulette: 'Rapid Roulette', CoinFlip: 'Coin Flip',
  ScratchCards: 'Scratch Cards', ColorSpin: 'Color Spin', SicBo: 'Sic Bo',
  Lucky7: 'Lucky 7', VideoPoker: 'Video Poker', SlotJoker: 'Slot Joker',
  JackpotBox: 'Jackpot Box', DragonTiger: 'Dragon Tiger', ClassicSlots: 'Classic Slots',
  CasinoWar: 'Casino War', GuessTheCup: 'Guess The Cup', PenaltyShoot: 'Penalty Shoot',
  ThreeCardPoker: 'Three Card Poker', CardFlip: 'Card Flip',
};
function fmtGame(raw: string | null | undefined) {
  if (!raw) return '—';
  return GAME_NAMES[raw] ?? raw;
}

function timeAgo(ts: Date | number | string): string {
  const ms = typeof ts === 'number'
    ? (ts > 1e10 ? ts : ts * 1000)
    : new Date(ts).getTime();
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 15) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtMonth(unixSecs: number): string {
  if (!unixSecs) return '—';
  return new Date(unixSecs * 1000).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function maskUsername(name: string): string {
  if (name.length <= 4) return name[0] + '***' + name.slice(-1);
  return name.slice(0, 3) + '***' + name.slice(-3);
}

function fmtUSD(n: number, compact = false): string {
  if (compact && n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (compact && n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


// tx display config
const TX_CONFIG: Record<string, { label: string; color: string; bg: string; sign: 1 | -1 }> = {
  bet:        { label: 'Bet',      color: '#f87171', bg: 'rgba(248,113,113,0.1)', sign: -1 },
  win:        { label: 'Win',      color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  sign:  1 },
  bonus:      { label: 'Bonus',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  sign:  1 },
  deposit:    { label: 'Deposit',  color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  sign:  1 },
  withdrawal: { label: 'Withdraw', color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  sign: -1 },
  refund:     { label: 'Refund',   color: '#a3e635', bg: 'rgba(163,230,53,0.1)',  sign:  1 },
};

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  useAuth({ redirectOnUnauthenticated: true });
  const { user } = useAuth();

  const statsQ    = trpc.wallet.myStats.useQuery(undefined, { enabled: !!user, staleTime: 0, refetchInterval: 30_000 });
  const txQ       = trpc.wallet.transactions.useQuery({ limit: 10 }, { enabled: !!user, staleTime: 0 });
  const xpLbQ     = trpc.wallet.xpLeaderboard.useQuery({ limit: 8 });
  const jackpotQ  = trpc.wallet.jackpot.useQuery(undefined, { refetchInterval: 5_000 });
  const liveStatsQ = trpc.wallet.liveStats.useQuery(undefined, { refetchInterval: 30_000 });
  const feedQ     = trpc.wallet.liveFeed.useQuery({ limit: 8 }, { refetchInterval: 8_000 });

  const stats      = statsQ.data;
  const txs        = txQ.data?.items ?? [];
  const topPlayers = xpLbQ.data ?? [];
  const jackpot    = jackpotQ.data?.amount ?? 0;
  const liveStats  = liveStatsQ.data;
  const feed       = feedQ.data ?? [];

  const netPnL     = (stats?.totalWon ?? 0) - (stats?.totalWagered ?? 0);
  const xp         = stats?.xp ?? 0;
  const xpRank     = stats?.xpRank ?? '—';
  const tier       = getXpTier(xp);
  const nextTier   = TIERS[TIERS.indexOf(tier) + 1] ?? null;
  const xpPct      = nextTier
    ? Math.min(100, Math.round(((xp - tier.min) / (nextTier.min - tier.min)) * 100))
    : 100;

  const hue = ((user?.username ?? '').charCodeAt(0) * 47) % 360;

  // Jackpot counter animation
  const [displayJackpot, setDisplayJackpot] = useState(jackpot);
  useEffect(() => {
    if (Math.abs(jackpot - displayJackpot) < 0.005) return;
    const start = displayJackpot, end = jackpot, dur = 800, t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplayJackpot(start + (end - start) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [jackpot]);

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '40px 24px 80px' }}>

          {/* ── Page label ── */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 16 }}>
            Dashboard
          </motion.p>

          {/* ── Profile header ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28, flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ width: 58, height: 58, borderRadius: 14, background: `hsl(${hue},35%,20%)`, border: `1.5px solid hsl(${hue},40%,32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: `hsl(${hue},55%,68%)`, flexShrink: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {(user?.username ?? '??').slice(0, 2).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: -0.3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {user?.username ?? '—'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${tier.color}18`, border: `1px solid ${tier.color}40`, color: tier.color }}>
                  {tier.name}
                </span>
                {stats?.createdAt ? (
                  <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 11, height: 11 }} /> Member since {fmtMonth(stats.createdAt)}
                  </span>
                ) : null}
                {xp > 0 && (
                  <span style={{ fontSize: 11.5, color: 'rgba(245,158,11,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap style={{ width: 11, height: 11 }} /> {xp.toLocaleString()} XP · Rank #{xpRank}
                  </span>
                )}
              </div>
            </div>

            {/* Balance chip */}
            <div style={{ ...card, padding: '14px 22px', textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Balance</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', margin: 0, letterSpacing: -0.5, fontFamily: 'JetBrains Mono, monospace' }}>
                {statsQ.isLoading ? '...' : fmtUSD(stats?.balance ?? 0)}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: '3px 0 0', letterSpacing: 0.5 }}>DMB</p>
            </div>
          </motion.div>

          {/* ── Stats grid ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              {
                icon: BarChart2, label: 'Total Wagered',
                value: statsQ.isLoading ? '...' : fmtUSD(stats?.totalWagered ?? 0, true),
                sub: `${(stats?.totalBets ?? 0).toLocaleString()} bets`,
              },
              {
                icon: TrendingUp, label: 'Net P&L',
                value: statsQ.isLoading ? '...' : `${netPnL >= 0 ? '+' : ''}${fmtUSD(Math.abs(netPnL), true)}`,
                sub: `${stats?.winRate ?? 0}% win rate`,
                valueColor: netPnL > 0 ? '#4ade80' : netPnL < 0 ? '#f87171' : undefined,
              },
              {
                icon: Trophy, label: 'Biggest Win',
                value: statsQ.isLoading ? '...' : fmtUSD(stats?.biggestWin ?? 0, true),
                sub: fmtGame(stats?.biggestWinGame),
              },
              {
                icon: Star, label: 'Favourite Game',
                value: statsQ.isLoading ? '...' : (fmtGame(stats?.favouriteGame) || 'None yet'),
                sub: stats?.totalBets ? 'Most played' : 'Play a game first',
              },
            ].map(({ icon: Icon, label, value, sub, valueColor }) => (
              <div key={label} style={{ ...card, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.26)', textTransform: 'uppercase', letterSpacing: 0.8, margin: 0 }}>{label}</p>
                  <Icon style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.22)' }} />
                </div>
                <p style={{ fontSize: 19, fontWeight: 900, color: valueColor ?? '#fff', margin: '0 0 4px', letterSpacing: -0.3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{value}</p>
                <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.28)', margin: 0 }}>{sub}</p>
              </div>
            ))}
          </motion.div>

          {/* ── XP progress ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
            style={{ ...card, padding: '18px 22px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>XP Progress</p>
                <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                  {xp.toLocaleString()} XP
                  {nextTier ? ` · ${(nextTier.min - xp).toLocaleString()} to ${nextTier.name}` : ' · Max tier reached'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: tier.color, background: `${tier.color}15`, border: `1px solid ${tier.color}30`, padding: '3px 10px', borderRadius: 20 }}>{tier.name}</span>
                {nextTier && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>→</span>}
                {nextTier && <span style={{ fontSize: 11, fontWeight: 600, color: nextTier.color, background: `${nextTier.color}12`, border: `1px solid ${nextTier.color}25`, padding: '3px 10px', borderRadius: 20, opacity: 0.6 }}>{nextTier.name}</span>}
                <Link href="/leaderboard"><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', marginLeft: 8 }}>Leaderboard <ChevronRight style={{ width: 12, height: 12 }} /></span></Link>
              </div>
            </div>
            {/* Bar */}
            <div style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${tier.color}aa, ${tier.color})`, boxShadow: `0 0 10px ${tier.color}55` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Rank #{xpRank} · 1 XP per 10s of play</span>
              <span style={{ fontSize: 10, color: tier.color }}>{xpPct}%</span>
            </div>
          </motion.div>

          {/* ── Two-column: transactions + sidebar ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 20, alignItems: 'start' }}>

            {/* Left: Recent transactions */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Recent Activity</p>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Last {txs.length} transactions</span>
              </div>

              {txs.length === 0 && !txQ.isLoading ? (
                <div style={{ ...card, padding: '40px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No transactions yet — play a game to get started.</p>
                </div>
              ) : (
                <div style={{ ...card, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 90px 70px', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Type', 'Game', 'Amount', 'Balance', 'When'].map(c => (
                      <span key={c} style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>{c}</span>
                    ))}
                  </div>
                  {txQ.isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 90px 70px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', gap: 4 }}>
                          {Array.from({ length: 5 }).map((__, j) => (
                            <div key={j} style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.05)', width: j === 1 ? '70%' : '55%' }} />
                          ))}
                        </div>
                      ))
                    : txs.map((tx, i) => {
                        const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG.bet;
                        const signed = cfg.sign * tx.amount;
                        return (
                          <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.03 }}
                            style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 90px 70px', padding: '11px 16px', borderBottom: i < txs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                            {/* Type badge */}
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, width: 'fit-content' }}>
                              {cfg.label}
                            </span>
                            {/* Game */}
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                              {tx.game ? fmtGame(tx.game) : (tx.description?.split(' — ')[0] ?? '—')}
                            </span>
                            {/* Amount */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {signed >= 0
                                ? <ArrowUpRight style={{ width: 11, height: 11, color: '#4ade80', flexShrink: 0 }} />
                                : <ArrowDownLeft style={{ width: 11, height: 11, color: '#f87171', flexShrink: 0 }} />
                              }
                              <span style={{ fontSize: 12.5, fontWeight: 800, color: signed >= 0 ? '#4ade80' : '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>
                                {signed >= 0 ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                              </span>
                            </div>
                            {/* Balance after */}
                            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.38)', fontFamily: 'JetBrains Mono, monospace' }}>
                              ${tx.balanceAfter.toFixed(2)}
                            </span>
                            {/* Time */}
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
                              {timeAgo(tx.createdAt)}
                            </span>
                          </motion.div>
                        );
                      })
                  }
                </div>
              )}
            </motion.div>

            {/* Right sidebar */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Jackpot */}
              <div style={{ ...card, padding: '18px 20px', background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Flame style={{ width: 15, height: 15, color: '#f59e0b' }} />
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.8, margin: 0 }}>Progressive Jackpot</p>
                </div>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#f59e0b', margin: '0 0 4px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: -0.5 }}>
                  ${displayJackpot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p style={{ fontSize: 10.5, color: 'rgba(245,158,11,0.5)', margin: 0 }}>Feeds 0.1% of all wagers</p>
              </div>

              {/* Live stats */}
              <div style={{ ...card, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Activity style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }} />
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, margin: 0 }}>Platform Live</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Active players</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                      {liveStats?.activeUsers ?? '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TrendingUp style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.3)' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Wagered today</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                      {liveStats ? fmtUSD(liveStats.wageredToday, true) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* XP Leaderboard mini */}
              <div style={{ ...card, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Trophy style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }} />
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, margin: 0 }}>Top XP</p>
                  </div>
                  <Link href="/leaderboard"><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>All <ChevronRight style={{ width: 11, height: 11 }} /></span></Link>
                </div>
                {topPlayers.length === 0 && !xpLbQ.isLoading ? (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', margin: 0 }}>No players yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(xpLbQ.isLoading ? Array.from({ length: 5 }) : topPlayers.slice(0, 6)).map((p: any, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.25)', width: 16, textAlign: 'center' }}>
                            {xpLbQ.isLoading ? '—' : i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </span>
                          {xpLbQ.isLoading
                            ? <div style={{ height: 9, width: 90, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
                            : <span style={{ fontSize: 12.5, color: p.username === user?.username ? '#f59e0b' : 'rgba(255,255,255,0.6)', fontWeight: p.username === user?.username ? 700 : 400 }}>
                                {maskUsername(p.username)}
                                {p.username === user?.username && <span style={{ fontSize: 9, color: '#f59e0b', marginLeft: 4 }}>you</span>}
                              </span>
                          }
                        </div>
                        {xpLbQ.isLoading
                          ? <div style={{ height: 9, width: 40, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
                          : <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>{(p.xp ?? 0).toLocaleString()} XP</span>
                        }
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── Live platform feed ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', animation: 'pulse 2s infinite' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Live Bets</p>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>platform-wide · updates every 8s</span>
            </div>

            <div style={{ ...card, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px 100px 100px 80px', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Player', 'Game', 'Bet', 'Payout', 'Mult', 'When'].map(c => (
                  <span key={c} style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>{c}</span>
                ))}
              </div>
              <AnimatePresence mode="popLayout">
                {feed.length === 0 && !feedQ.isLoading ? (
                  <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No activity yet — be the first to play!</p>
                  </div>
                ) : (feedQ.isLoading ? Array.from({ length: 5 }) : feed).map((row: any, i) => (
                  <motion.div key={feedQ.isLoading ? i : row.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px 100px 100px 80px', padding: '11px 16px', borderBottom: i < (feed.length - 1) ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                    {feedQ.isLoading ? (
                      Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.05)', width: '60%' }} />
                      ))
                    ) : (
                      <>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{maskUsername(row.username)}</span>
                        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>{fmtGame(row.game)}</span>
                        <span style={{ fontSize: 12.5, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.4)' }}>${row.bet.toFixed(2)}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: row.won ? '#4ade80' : '#f87171' }}>
                          {row.won ? `$${row.payout.toFixed(2)}` : '$0.00'}
                        </span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: row.mult !== null ? (row.mult >= 2 ? '#f59e0b' : 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.25)' }}>
                          {row.mult !== null ? `${row.mult.toFixed(2)}×` : '—'}
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>{timeAgo(row.createdAt)}</span>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Quick links ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Play Games',    href: '/casino',      icon: Zap,      color: '#f59e0b' },
              { label: 'Leaderboard',   href: '/leaderboard', icon: Trophy,   color: '#a78bfa' },
              { label: 'Promotions',    href: '/promotions',  icon: Star,     color: '#38bdf8' },
              { label: 'Settings',      href: '/settings',    icon: Target,   color: 'rgba(255,255,255,0.4)' },
            ].map(link => (
              <Link key={link.href} href={link.href}>
                <div style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'rgba(255,255,255,0.06)'; el.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <link.icon style={{ width: 14, height: 14, color: link.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{link.label}</span>
                  </div>
                  <ChevronRight style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.2)' }} />
                </div>
              </Link>
            ))}
          </motion.div>

        </div>
      </div>
    </MainLayout>
  );
}
