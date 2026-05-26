import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import GameCard from '@/components/GameCard';
import BigWinsTicker from '@/components/BigWinsTicker';
import {
  ArrowRight, Users, ChevronRight, Gift, Star, RotateCcw,
  Zap, Trophy, Shield, TrendingUp,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ─── Game data ────────────────────────────────────────────────────────────────
const ALL_GAMES = [
  { id: 'crash',           title: 'Crash',            category: 'Crash Games',      image: '/Crash gemini.png', players: 4200, rtp: '97.0', featured: true  },
  { id: 'blackjack',       title: 'Blackjack',         category: 'Card Games',       image: '/blackjack gemini.png',      players: 2100, rtp: '99.0', featured: true  },
  { id: 'roulette',        title: 'Roulette',          category: 'Table Games',      image: '/Roulette GEMINI.png',          players: 2800, rtp: '97.3', featured: false },
  { id: 'plinko',          title: 'Plinko',            category: 'Crash Games',      image: '/plinko gemini.png',         players: 1250, rtp: '97.0', featured: true  },
  { id: 'mines',           title: 'Mines',             category: 'Strategy Games',   image: '/mines gemini.png',             players: 1840, rtp: '97.0', featured: false },
  { id: 'baccarat',        title: 'Baccarat',          category: 'Card Games',       image: '/Baccarat gemini.png',       players: 1650, rtp: '98.9', featured: true  },
  { id: 'dice',            title: 'Dice',              category: 'Dice Games',       image: '/Dice Game gemini.png',           players: 890,  rtp: '97.0', featured: false },
  { id: 'hilo',            title: 'Hi-Lo',             category: 'Card Games',       image: '/Hi-Lo gemini.png',           players: 980,  rtp: '97.0', featured: false },
  { id: 'keno',            title: 'Keno',              category: 'Lottery Games',    image: '/keno gemini.png',              players: 720,  rtp: '95.0', featured: false },
  { id: 'scratch-cards',   title: 'Scratch Cards',     category: 'Luck Games',       image: '/Scratch cards gemini.png',     players: 1380, rtp: '95.0', featured: false },
  { id: 'video-poker',     title: 'Video Poker',       category: 'Card Games',       image: '/Video Poker gemini.png',    players: 820,  rtp: '99.5', featured: false },
  { id: 'craps',           title: 'Craps',             category: 'Dice Games',       image: '/craps gemini.png',          players: 910,  rtp: '98.6', featured: true  },
  { id: 'sicbo',           title: 'Sic Bo',            category: 'Dice Games',       image: '/SicBo gemini.png',          players: 780,  rtp: '97.2', featured: false },
  { id: 'limbo',           title: 'Limbo',             category: 'Crash Games',      image: '/Limbo gemini.png',          players: 640,  rtp: '97.0', featured: false },
  { id: 'tower',           title: 'Tower',             category: 'Strategy Games',   image: '/Tower gemini.png',             players: 560,  rtp: '97.0', featured: false },
  { id: 'coinflip',        title: 'Coin Flip',         category: 'Luck Games',       image: '/Coin flip gemini.png',         players: 1100, rtp: '97.0', featured: false },
  { id: 'dragon-tiger',    title: 'Dragon Tiger',      category: 'Card Games',       image: '/Black Tiger.png',    players: 1120, rtp: '96.7', featured: false },
  { id: 'guess-the-cup',   title: 'Guess The Cup',     category: 'Luck Games',       image: '/guess the cup gemini.png',     players: 650,  rtp: '96.0', featured: false },
  { id: 'wheel',           title: 'Wheel',             category: 'Wheel Games',      image: '/Wheel gemini.png',             players: 490,  rtp: '97.0', featured: false },
  { id: 'three-card-poker',title: 'Three Card Poker',  category: 'Card Games',       image: '/Three Cad Poker gemini.png', players: 640, rtp: '97.8', featured: false },
  { id: 'casino-war',      title: 'Casino War',        category: 'Card Games',       image: '/Casino war gemini.png',     players: 430,  rtp: '97.0', featured: false },
  { id: 'slot-joker',      title: 'Slot Joker',        category: 'Slot Games',       image: '/slots joker gemini.png',      players: 2400, rtp: '96.5', featured: true  },
  { id: 'classic-slots',   title: 'Classic Slots',     category: 'Slot Games',       image: '/slots gemini.png',   players: 1760, rtp: '96.0', featured: false },
  { id: 'lucky-7',         title: 'Lucky 7',           category: 'Dice Games',       image: '/Lucky 7 gemni.png',         players: 870,  rtp: '96.8', featured: false },
  { id: 'card-flip',       title: 'Card Flip',         category: 'Card Games',       image: '/Card Flip gemini.png',       players: 730,  rtp: '97.0', featured: false },
  { id: 'penalty',         title: 'Penalty Shoot',     category: 'Luck Games',       image: '/Peanlty Shoot gemini.png',     players: 940,  rtp: '96.0', featured: false },
  { id: 'jackpot-box',     title: 'Jackpot Box',       category: 'Luck Games',       image: '/Jackpot Box gemini.png',       players: 1050, rtp: '95.5', featured: false },
  { id: 'parity',          title: 'Parity',            category: 'Prediction Games', image: '/Parity gemini.png',            players: 610,  rtp: '96.0', featured: false },
  { id: 'color-spin',      title: 'Color Spin',        category: 'Wheel Games',      image: '/color spin gemini.png',        players: 530,  rtp: '96.0', featured: false },
];

const TABS = [
  { key: 'all',             label: 'All Games'  },
  { key: 'featured',        label: '⭐ Featured' },
  { key: 'Crash Games',     label: 'Crash'      },
  { key: 'Slot Games',      label: 'Slots'      },
  { key: 'Card Games',      label: 'Cards'      },
  { key: 'Dice Games',      label: 'Dice'       },
  { key: 'Table Games',     label: 'Table'      },
  { key: 'Luck Games',      label: 'Luck'       },
  { key: 'Strategy Games',  label: 'Strategy'   },
];

// ─── Live bets helpers ────────────────────────────────────────────────────────
const GAME_NAMES: Record<string, string> = {
  WheelGame: 'Wheel', RapidRoulette: 'Rapid Roulette', BigSix: 'Big Six',
  ChuckALuck: 'Chuck-a-Luck', CoinFlip: 'Coin Flip', ScratchCards: 'Scratch Cards',
  ColorSpin: 'Color Spin', Dice21: 'Dice 21', HotDice: 'Hot Dice',
  LightningDice: 'Lightning Dice', SicBo: 'Sic Bo', Lucky7: 'Lucky 7',
  RockPaperScissors: 'Rock Paper Scissors', VideoPoker: 'Video Poker',
  SlotJoker: 'Slot Joker', JackpotBox: 'Jackpot Box', DragonTiger: 'Dragon Tiger',
  CasinoHoldem: "Casino Hold'em", AndarBahar: 'Andar Bahar', DiceDuel: 'Dice Duel',
  ClassicSlots: 'Classic Slots', CasinoWar: 'Casino War', GuessTheCup: 'Guess The Cup',
  PenaltyShoot: 'Penalty Shoot', ThreeCardPoker: 'Three Card Poker',
  CaribbeanStud: 'Caribbean Stud', CardFlip: 'Card Flip', NumberMatch: 'Number Match',
  RedDog: 'Red Dog',
};

function formatGameName(raw: string): string {
  return GAME_NAMES[raw] ?? raw;
}

function maskUsername(name: string): string {
  if (name.length <= 4) return name[0] + '***' + name.slice(-1);
  return name.slice(0, 3) + '***' + name.slice(-3);
}

function timeAgo(createdAt: Date | string): string {
  const secs = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (secs < 15) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const PROMOS = [
  { icon: Gift,      label: 'Welcome Bonus',   desc: '100% up to $500 on first deposit',             href: '/promotions', color: '#f59e0b' },
  { icon: RotateCcw, label: 'Daily Free Spin',  desc: 'Spin every 24 hours — no deposit needed',      href: '/daily-spin', color: '#f59e0b' },
  { icon: Star,      label: 'VIP Program',      desc: 'Exclusive cashback, reloads & dedicated host', href: '/vip',        color: '#f59e0b' },
];

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = '#0d0d12';
const CARD_BG = '#141419';
const PURPLE  = 'rgba(255,255,255,0.35)';
const MAGENTA = '#4ade80';
const GOLD    = '#f59e0b';

// Compute seconds until next Sunday 23:59:59 UTC
function weeklySecondsLeft() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun
  const daysUntil = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  const target = new Date(now);
  target.setUTCDate(now.getUTCDate() + daysUntil);
  target.setUTCHours(23, 59, 59, 0);
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}

// Monday 00:00 UTC unix seconds (for weekly race query)
function mondayStartTs() {
  const now = new Date();
  const d = now.getUTCDay();
  const daysSince = d === 0 ? 6 : d - 1;
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() - daysSince);
  mon.setUTCHours(0, 0, 0, 0);
  return Math.floor(mon.getTime() / 1000);
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('all');
  const [secsLeft, setSecsLeft]   = useState(weeklySecondsLeft);

  // Live bets feed — polls every 3 seconds for new real transactions
  const liveFeedQuery = trpc.wallet.liveFeed.useQuery({ limit: 10 }, {
    refetchInterval: 3000,
    staleTime: 0,
  });
  const bets = liveFeedQuery.data ?? [];

  // Progressive jackpot — grows from real total wagered (seed $1,000 + 0.1% of all wagers)
  const jackpotQuery = trpc.wallet.jackpot.useQuery(undefined, {
    refetchInterval: 5000,
    staleTime: 0,
  });
  const jackpot = jackpotQuery.data?.amount ?? 1000;

  // Weekly race top wagerers since Monday
  const weeklyQuery = trpc.wallet.topWagerers.useQuery(
    { since: mondayStartTs(), limit: 3 },
    { refetchInterval: 30_000, staleTime: 0 }
  );
  const weeklyTop = weeklyQuery.data ?? [];

  // Live platform stats
  const liveStatsQuery = trpc.wallet.liveStats.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 0,
  });
  const activeUsers  = liveStatsQuery.data?.activeUsers  ?? 0;
  const wageredToday = liveStatsQuery.data?.wageredToday ?? 0;

  // Weekly countdown — real time to Sunday midnight UTC
  useEffect(() => {
    const iv = setInterval(() => setSecsLeft(weeklySecondsLeft()), 1000);
    return () => clearInterval(iv);
  }, []);

  const filteredGames = ALL_GAMES
    .filter(g => activeTab === 'all' ? true : activeTab === 'featured' ? g.featured : g.category === activeTab)
    .sort((a, b) => b.players - a.players)
    .slice(0, 12);

  const pad  = (n: number) => n.toString().padStart(2, '0');
  const cD   = Math.floor(secsLeft / 86400);
  const cH   = Math.floor((secsLeft % 86400) / 3600);
  const cM   = Math.floor((secsLeft % 3600) / 60);
  const cS   = secsLeft % 60;

  function fmtWagered(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
    return `$${n.toFixed(0)}`;
  }

  const RACE_PRIZES = ['$50', '$30', '$20'];

  return (
    <MainLayout>
      <div style={{ background: BG }}>

        {/* ═══════════════════════════════════════════════════════════════════
            HERO — cinematic split layout
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{
          position: 'relative', overflow: 'hidden',
          background: BG,
          paddingTop: 24, paddingBottom: 24,
          borderBottom: '1px solid rgba(255,255,255,0.0)',
        }}>
          {/* Atmospheric orbs */}
          <div style={{
            position: 'absolute', top: -140, left: -180, width: 800, height: 800,
            background: 'radial-gradient(circle, rgba(22,163,74,0.14) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: -40, right: -80, width: 560, height: 560,
            background: 'radial-gradient(circle, rgba(255,255,255,0.0) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -80, left: '45%', width: 700, height: 400,
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.0) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Subtle grid texture */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: [
              'linear-gradient(rgba(22,163,74,0.055) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(22,163,74,0.055) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '52px 52px',
          }} />
          {/* Left vignette over grid so text stays readable */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 100% at 15% 50%, rgba(6,4,15,0.9) 0%, transparent 70%)',
          }} />
          {/* Bottom fade */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 90,
            background: `linear-gradient(to bottom, transparent, ${BG})`,
            pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 280px',
              gap: 32,
              alignItems: 'center',
            }}>

              {/* ─── Left: Headline + CTAs ─── */}
              <div>
                {/* Badge row */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.0)', border: '1px solid rgba(74,222,128,0.28)',
                  }}>
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                      style={{ width: 5, height: 5, borderRadius: '50%', background: MAGENTA, display: 'inline-block' }}
                    />
                    <span style={{ fontSize: 10, fontWeight: 700, color: MAGENTA, letterSpacing: 1.5, textTransform: 'uppercase' }}>Live Casino</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users style={{ width: 12, height: 12 }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{activeUsers.toLocaleString()}</span> active now
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Zap style={{ width: 12, height: 12 }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{fmtWagered(wageredToday)}</span> wagered today
                  </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 'clamp(24px, 3.6vw, 44px)',
                    fontWeight: 900,
                    lineHeight: 1.04,
                    letterSpacing: -2,
                    color: '#fff',
                    marginBottom: 10,
                    maxWidth: 560,
                  }}>
                  The Casino<br />Built for{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 45%, #f97316 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>Winners.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', marginBottom: 18, maxWidth: 430, lineHeight: 1.6 }}>
                  Provably fair crypto gambling. 45+ in-house games. Instant payouts, no KYC, no compromises.
                </motion.p>

                {/* CTA row */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                  style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link href="/register">
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      style={{
                        height: 42, padding: '0 22px',
                        borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                        color: '#fff', fontSize: 13, fontWeight: 800,
                        display: 'flex', alignItems: 'center', gap: 8,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                      }}>
                      Get Started Free <ArrowRight style={{ width: 16, height: 16 }} />
                    </motion.button>
                  </Link>
                  <Link href="/casino">
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{
                        height: 42, padding: '0 20px',
                        borderRadius: 12, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.0)',
                        border: '1px solid rgba(22,163,74,0.38)',
                        color: 'rgba(255,255,255,0.72)', fontSize: 14, fontWeight: 600,
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                      }}>
                      Explore Games
                    </motion.button>
                  </Link>
                </motion.div>

                {/* Trust row */}
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
                  style={{ display: 'flex', gap: 22, marginTop: 14, flexWrap: 'wrap' }}>
                  {[
                    { icon: Shield,     label: 'Provably Fair'    },
                    { icon: Zap,        label: 'Instant Payouts'  },
                    { icon: TrendingUp, label: 'No KYC Required'  },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
                      <Icon style={{ width: 12, height: 12, color: 'rgba(22,163,74,0.75)' }} />
                      {label}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* ─── Right: Jackpot card ─── */}
              <motion.div
                initial={{ opacity: 0, x: 24, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  borderRadius: 20, overflow: 'hidden',
                  background: '#141419',
                  border: '1px solid rgba(255,255,255,0.09)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
                }}>
                {/* Jackpot block */}
                <div style={{
                  padding: '14px 18px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.03)',
                  position: 'relative',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Trophy style={{ width: 15, height: 15, color: GOLD }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.8, textTransform: 'uppercase' }}>Progressive Jackpot</span>
                  </div>
                  <div style={{
                    fontSize: 24, fontWeight: 900, letterSpacing: -1,
                    background: 'linear-gradient(135deg, #f59e0b, #fde68a)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    fontFamily: 'JetBrains Mono, monospace',
                    filter: 'drop-shadow(0 0 14px rgba(245,158,11,0.35))',
                    lineHeight: 1,
                  }}>
                    ${jackpot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.45)', marginTop: 6 }}>Growing every second</div>
                </div>

                {/* Live stats */}
                <div style={{ padding: '10px 18px' }}>
                  {[
                    { label: 'Active Players', value: activeUsers.toLocaleString(), icon: Users      },
                    { label: 'Wagered Today',  value: fmtWagered(wageredToday),     icon: TrendingUp },
                    { label: 'Avg. Payout',    value: '< 1 min',                   icon: Zap        },
                  ].map(({ label, value, icon: Icon }, i, arr) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.45)' }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Card CTA */}
                <div style={{ padding: '0 14px 10px' }}>
                  <Link href="/register">
                    <div style={{
                      borderRadius: 10, padding: '11px',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      textAlign: 'center', cursor: 'pointer',
                      fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                      transition: 'all 0.18s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLDivElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.7)'; }}>
                      Claim Your Bonus →
                    </div>
                  </Link>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ─── LIVE WINS TICKER ─────────────────────────────────────────── */}
        <BigWinsTicker />

        {/* ═══════════════════════════════════════════════════════════════════
            STATS STRIP
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 0',
        }}>
          <div style={{
            maxWidth: 1400, margin: '0 auto', padding: '0 32px',
            display: 'flex', flexWrap: 'wrap', gap: 0,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {[
              { label: 'Players Online',  value: '50,320+', grad: `#fff, rgba(255,255,255,0.7)`  },
              { label: 'Games Available', value: '45+',     grad: `#f59e0b, #fde68a` },
              { label: 'Total Wagered',   value: '$2.4M',   grad: `${GOLD}, #fde68a`    },
              { label: 'Instant Payouts', value: '< 1 min', grad: `#fff, rgba(255,255,255,0.7)`  },
              { label: 'House Edge',      value: '0.5–3%',  grad: `#fff, rgba(255,255,255,0.7)`  },
            ].map(({ label, value, grad }, i, arr) => (
              <div key={label} style={{
                textAlign: 'center', padding: '0 28px',
                borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{
                  fontSize: 20, fontWeight: 900, letterSpacing: -0.5, marginBottom: 3,
                  background: `linear-gradient(135deg, ${grad})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>{value}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.26)', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            GAMES SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 32px 16px' }}>

          {/* Section header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 6 }}>Casino</div>
              <h2 style={{
                fontSize: 18, fontWeight: 900, letterSpacing: -0.6, margin: 0,
                fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#fff',
              }}>
                All Games
                <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.22)', marginLeft: 10 }}>
                  {filteredGames.length} results
                </span>
              </h2>
            </div>
            <Link href="/casino">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                View All <ChevronRight style={{ width: 14, height: 14 }} />
              </div>
            </Link>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 4, marginBottom: 10, scrollbarWidth: 'none' }}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{
                    flexShrink: 0, padding: '5px 13px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.18s',
                    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.32)',
                    outline: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                    outlineOffset: '-1px',
                  }}>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Game grid */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {filteredGames.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.022 }}>
                <GameCard {...game} />
              </motion.div>
            ))}
          </motion.div>

        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            TWO-COLUMN: LIVE BETS + SIDEBAR
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{
          borderTop: '1px solid rgba(255,255,255,0.04)',
          padding: '14px 0 18px',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 320px',
              gap: 24,
              alignItems: 'stretch',
            }}>

              {/* ─── Left: Live Bets ─── */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', boxShadow: '0 0 8px rgba(255,255,255,0.3)' }} />
                    <motion.span
                      animate={{ scale: [1, 2.2, 1], opacity: [0.75, 0, 0.75] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                      style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', display: 'block' }} />
                  </div>
                  <span style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: -0.4, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Live Bets</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                    color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)', padding: '3px 9px', borderRadius: 6,
                  }}>LIVE</span>
                </div>

                {/* Table */}
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  overflow: 'hidden', background: BG,
                }}>
                  {/* Column headers */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 160px 1fr 88px 100px 125px',
                    padding: '8px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: BG,
                  }}>
                    {['Time', 'Player', 'Game', 'Bet', 'Mult', 'Payout'].map(col => (
                      <span key={col} style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>{col}</span>
                    ))}
                  </div>

                  {/* Rows */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    {bets.length === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>
                        No bets yet — be the first to play!
                      </div>
                    ) : (
                    <AnimatePresence initial={false}>
                      {bets.map((row, i) => {
                        const name = row.username;
                        const hue = (name.charCodeAt(0) * 47 + (name.charCodeAt(4) || 0) * 13) % 360;
                        const masked = maskUsername(name);
                        return (
                          <motion.div
                            key={row.id}
                            layout
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, borderBottomWidth: 0 }}
                            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ background: 'rgba(255,255,255,0.03)' } as any}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '80px 160px 1fr 88px 100px 125px',
                              padding: '7px 14px',
                              borderBottom: i < bets.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                              alignItems: 'center',
                              cursor: 'default',
                            }}>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{timeAgo(row.createdAt)}</span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                background: `hsl(${hue},40%,18%)`, border: `1px solid hsl(${hue},40%,28%)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 800, color: `hsl(${hue},55%,65%)`,
                              }}>{name[0].toUpperCase()}</div>
                              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.38)', fontFamily: 'JetBrains Mono, monospace' }}>{masked}</span>
                            </div>

                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{formatGameName(row.game)}</span>

                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', fontFamily: 'JetBrains Mono, monospace' }}>${row.bet.toFixed(2)}</span>

                            <span style={{ fontSize: 12, color: row.won ? '#86efac' : 'rgba(255,255,255,0.14)', fontFamily: 'JetBrains Mono, monospace' }}>
                              {row.won && row.mult !== null ? row.mult.toFixed(2) + '×' : '—'}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span style={{
                                fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                                background: row.won ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.08)',
                                color: row.won ? '#4ade80' : '#f87171', flexShrink: 0,
                              }}>{row.won ? 'Win' : 'Loss'}</span>
                              <span style={{
                                fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                                color: row.won ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.18)',
                              }}>
                                {row.won ? '+$' + row.payout.toFixed(2) : '-$' + row.bet.toFixed(2)}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    )}
                  </div>
                </div>

              </div>

              {/* ─── Right sidebar ─── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Weekly Race card */}
                <div style={{
                  borderRadius: 18, overflow: 'hidden',
                  background: CARD_BG,
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 4px 40px rgba(0,0,0,0.3)',
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Trophy style={{ width: 16, height: 16, color: GOLD }} />
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Weekly Race</span>
                      </div>
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                        padding: '2px 9px', borderRadius: 20, letterSpacing: 1.5,
                      }}>LIVE</span>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', marginBottom: 2 }}>Prize Pool</div>
                      <div style={{
                        fontSize: 22, fontWeight: 900, letterSpacing: -0.5,
                        background: 'linear-gradient(135deg, #f59e0b, #fde68a)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        lineHeight: 1,
                      }}>$100</div>
                    </div>

                    {/* Countdown — real time to Sunday midnight */}
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginBottom: 5 }}>Ends In</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[{ v: cD, l: 'D' }, { v: cH, l: 'H' }, { v: cM, l: 'M' }, { v: cS, l: 'S' }].map(({ v, l }) => (
                          <div key={l} style={{
                            flex: 1, textAlign: 'center', padding: '5px 0',
                            borderRadius: 9, background: 'rgba(0,0,0,0.35)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}>
                            <div style={{
                              fontSize: 15, fontWeight: 900, color: '#fff',
                              fontFamily: 'JetBrains Mono, monospace', lineHeight: 1,
                            }}>{pad(v)}</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 2, letterSpacing: 0.5 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live top wagerers this week */}
                  <div style={{ padding: '10px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Top Players This Week</div>
                    {weeklyTop.length === 0 ? (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', padding: '8px 0' }}>No bets placed yet this week</div>
                    ) : (
                      weeklyTop.map((p, idx) => {
                        const rankColors = ['#f59e0b', '#9ca3af', '#b45309'];
                        const color = rankColors[idx] ?? '#9ca3af';
                        return (
                          <div key={p.username} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '5px 0',
                            borderBottom: idx < weeklyTop.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                              background: `${color}18`, border: `1px solid ${color}42`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 900, color,
                            }}>{idx + 1}</div>
                            <span style={{ flex: 1, fontSize: 11.5, color: 'rgba(255,255,255,0.42)', fontFamily: 'JetBrains Mono, monospace' }}>{maskUsername(p.username)}</span>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{RACE_PRIZES[idx]}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', fontFamily: 'JetBrains Mono, monospace' }}>{fmtWagered(Number(p.wagered))}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <Link href="/leaderboard">
                      <div style={{
                        marginTop: 12, borderRadius: 9, padding: '10px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        textAlign: 'center', cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLDivElement).style.color = '#fff'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.6)'; }}>
                        View Full Leaderboard
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Promo cards */}
                {PROMOS.map(({ icon: Icon, label, desc, href, color }) => (
                  <Link key={label} href={href}>
                    <motion.div
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{
                        borderRadius: 14, padding: '9px 12px',
                        background: CARD_BG, border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', gap: 13,
                        cursor: 'pointer', transition: 'border-color 0.18s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}44`)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: `${color}14`, border: `1px solid ${color}28`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon style={{ width: 18, height: 18, color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.33)', lineHeight: 1.4 }}>{desc}</div>
                      </div>
                      <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
                    </motion.div>
                  </Link>
                ))}
              </div>

            </div>
          </div>
        </section>


      </div>
    </MainLayout>
  );
}





