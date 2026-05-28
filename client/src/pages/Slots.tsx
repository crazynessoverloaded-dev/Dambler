import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import { Zap } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const SYMBOLS = [
  { emoji: '🍒', name: 'cherry',  payout: 1.5, weight: 40 },
  { emoji: '🍋', name: 'lemon',   payout: 2,   weight: 32 },
  { emoji: '🍇', name: 'grape',   payout: 3,   weight: 24 },
  { emoji: '🔔', name: 'bell',    payout: 5,   weight: 12 },
  { emoji: '⭐', name: 'star',    payout: 8,   weight: 6  },
  { emoji: '💎', name: 'diamond', payout: 15,  weight: 2  },
  { emoji: '7️⃣', name: 'seven',   payout: 35,  weight: 1  },
];
const SCATTER = { emoji: '🎰', name: 'scatter', payout: 0, weight: 1 };
const ALL_SYMS = [...SYMBOLS, SCATTER];

const PAYLINES = [
  [1,1,1,1,1],
  [0,0,0,0,0],
  [2,2,2,2,2],
  [0,1,2,1,0],
  [2,1,0,1,2],
];

const SYM_H = 90;
const STRIP_LEN = 60;
const RESULT_IDX = 57;
const TARGET_Y = -(RESULT_IDX * SYM_H);
const STOP_DELAYS = [1100, 1500, 1900, 2300, 2700];

type Sym = (typeof ALL_SYMS)[0];
type SlotState = 'idle' | 'spinning' | 'evaluating' | 'free_spins' | 'bonus_result';

interface WinInfo {
  paylineIndex: number;
  symbol: string;
  matchCount: number;
  payout: number;
}

function SlotSymbol({ name, size = 62 }: { name: string; size?: number }) {
  const p = { width: size, height: size };
  switch (name) {
    case 'cherry': return (
      <svg {...p} viewBox="0 0 64 64" fill="none">
        <path d="M32 48C34 38 42 30 44 22" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M32 48C30 36 20 30 18 22" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="44" cy="19" r="12" fill="#b91c1c"/>
        <circle cx="44" cy="19" r="12" fill="url(#cg)" opacity="0"/>
        <circle cx="40" cy="14" r="4.5" fill="rgba(255,255,255,0.38)"/>
        <circle cx="44" cy="19" r="12" stroke="#fca5a5" strokeWidth="1.2" fill="none"/>
        <circle cx="19" cy="19" r="10" fill="#b91c1c"/>
        <circle cx="16" cy="14" r="3.5" fill="rgba(255,255,255,0.38)"/>
        <circle cx="19" cy="19" r="10" stroke="#fca5a5" strokeWidth="1.2" fill="none"/>
      </svg>
    );
    case 'lemon': return (
      <svg {...p} viewBox="0 0 64 64" fill="none">
        <path d="M32 6L32 3" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M28 7 Q22 4 25 9" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <ellipse cx="32" cy="35" rx="22" ry="18" fill="#fbbf24"/>
        <ellipse cx="32" cy="35" rx="22" ry="18" stroke="#f59e0b" strokeWidth="1.5" fill="none"/>
        <ellipse cx="23" cy="27" rx="7" ry="4.5" fill="rgba(255,255,255,0.28)" transform="rotate(-25 23 27)"/>
        <path d="M32 53L32 57" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    );
    case 'grape': return (
      <svg {...p} viewBox="0 0 64 64" fill="none">
        <path d="M32 4 Q39 11 32 17 Q25 11 32 4Z" fill="#22c55e"/>
        <path d="M32 4L32 17" stroke="#16a34a" strokeWidth="1.2"/>
        <circle cx="22" cy="25" r="9" fill="#7c3aed" stroke="#a78bfa" strokeWidth="1"/>
        <circle cx="42" cy="25" r="9" fill="#7c3aed" stroke="#a78bfa" strokeWidth="1"/>
        <circle cx="12" cy="41" r="8.5" fill="#6d28d9" stroke="#a78bfa" strokeWidth="1"/>
        <circle cx="32" cy="41" r="8.5" fill="#7c3aed" stroke="#a78bfa" strokeWidth="1"/>
        <circle cx="52" cy="41" r="8.5" fill="#6d28d9" stroke="#a78bfa" strokeWidth="1"/>
        <circle cx="22" cy="56" r="7.5" fill="#5b21b6" stroke="#a78bfa" strokeWidth="1"/>
        <circle cx="42" cy="56" r="7.5" fill="#5b21b6" stroke="#a78bfa" strokeWidth="1"/>
        <circle cx="19" cy="22" r="2.8" fill="rgba(255,255,255,0.38)"/>
        <circle cx="39" cy="22" r="2.8" fill="rgba(255,255,255,0.38)"/>
      </svg>
    );
    case 'bell': return (
      <svg {...p} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="57" r="5.5" fill="#ca8a04"/>
        <line x1="32" y1="51" x2="32" y2="43" stroke="#ca8a04" strokeWidth="2.5"/>
        <path d="M10 46 Q12 22 32 14 Q52 22 54 46Z" fill="#fbbf24"/>
        <path d="M10 46 Q12 22 32 14 Q52 22 54 46Z" stroke="#f59e0b" strokeWidth="1.5" fill="none"/>
        <path d="M6 46 Q19 55 32 55 Q45 55 58 46" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round"/>
        <path d="M21 20 Q24 15 29 17" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    );
    case 'star': return (
      <svg {...p} viewBox="0 0 64 64" fill="none">
        <polygon points="32,4 38,22 58,22 43,34 49,53 32,42 15,53 21,34 6,22 26,22" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5"/>
        <polygon points="32,10 36,22 50,22 39,30 43,44 32,36 21,44 25,30 14,22 28,22" fill="#fef08a" opacity="0.45"/>
      </svg>
    );
    case 'diamond': return (
      <svg {...p} viewBox="0 0 64 64" fill="none">
        <path d="M32 4 L58 30 L32 60 L6 30 Z" fill="#0ea5e9"/>
        <path d="M32 4 L58 30 L32 35 Z" fill="#7dd3fc" opacity="0.85"/>
        <path d="M32 4 L6 30 L32 35 Z" fill="#0284c7" opacity="0.85"/>
        <path d="M32 35 L6 30 L32 60 Z" fill="#075985" opacity="0.75"/>
        <path d="M32 35 L58 30 L32 60 Z" fill="#0ea5e9" opacity="0.55"/>
        <path d="M32 4 L58 30 L32 60 L6 30 Z" stroke="#38bdf8" strokeWidth="1.5" fill="none"/>
        <circle cx="32" cy="25" r="4" fill="rgba(255,255,255,0.55)"/>
      </svg>
    );
    case 'seven': return (
      <svg {...p} viewBox="0 0 64 64">
        <rect x="4" y="4" width="56" height="56" rx="10" fill="#dc2626"/>
        <rect x="4" y="4" width="56" height="56" rx="10" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
        <rect x="4" y="4" width="56" height="26" rx="10" fill="rgba(255,255,255,0.08)"/>
        <text x="32" y="49" textAnchor="middle" fontSize="42" fontWeight="900" fill="#fef08a" fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="-2">7</text>
      </svg>
    );
    case 'scatter': return (
      <svg {...p} viewBox="0 0 64 64">
        <rect x="2" y="15" width="60" height="34" rx="9" fill="#ca8a04"/>
        <rect x="2" y="15" width="60" height="34" rx="9" stroke="#fbbf24" strokeWidth="1.5" fill="none"/>
        <rect x="2" y="15" width="60" height="16" rx="9" fill="rgba(255,255,255,0.1)"/>
        <text x="32" y="38" textAnchor="middle" fontSize="18" fontWeight="900" fill="#451a03" fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="1">BAR</text>
        <text x="12" y="13" textAnchor="middle" fontSize="9" fill="#fbbf24">★</text>
        <text x="52" y="13" textAnchor="middle" fontSize="9" fill="#fbbf24">★</text>
      </svg>
    );
    default: return (
      <svg {...p} viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="#374151"/>
        <text x="32" y="38" textAnchor="middle" fontSize="22" fill="#9ca3af">?</text>
      </svg>
    );
  }
}

const pick = (): Sym => {
  const total = ALL_SYMS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of ALL_SYMS) { r -= s.weight; if (r <= 0) return s; }
  return ALL_SYMS[0];
};

const buildStrip = (r0: Sym, r1: Sym, r2: Sym): Sym[] => {
  const s: Sym[] = Array.from({ length: RESULT_IDX }, pick);
  s.push(r0, r1, r2);
  return s;
};

const initStrip = (): Sym[] => buildStrip(pick(), pick(), pick());

const BET_AMOUNTS = [0.1, 0.5, 1, 5, 10, 50, 100, 1000];

export default function Slots() {
  const { balance, balanceRef, setBalance } = useGameWallet('Slots');
  const [betPerLine, setBetPerLine] = useState(1);
  const totalBet = betPerLine;

  const [strips, setStrips] = useState<Sym[][]>(() => Array.from({ length: 5 }, initStrip));
  const [state, setState] = useState<SlotState>('idle');
  const [wins, setWins] = useState<WinInfo[]>([]);
  const [totalWinAmount, setTotalWinAmount] = useState(0);
  const [winningPaylines, setWinningPaylines] = useState<number[]>([]);
  const [reelBlur, setReelBlur] = useState<boolean[]>(Array(5).fill(false));
  const [autoSpins, setAutoSpins] = useState(0);
  const [winHistory, setWinHistory] = useState<number[]>([]);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(0);
  const [bonusWinnings, setBonusWinnings] = useState(0);
  const [spinResult, setSpinResult] = useState<number | null>(null);

  const ra0 = useAnimation();
  const ra1 = useAnimation();
  const ra2 = useAnimation();
  const ra3 = useAnimation();
  const ra4 = useAnimation();
  const reelControls = [ra0, ra1, ra2, ra3, ra4];

  const isSpinning = useRef(false);
  const autoSpinsRef = useRef(autoSpins);
  useEffect(() => { autoSpinsRef.current = autoSpins; }, [autoSpins]);
  const freeSpinsRef = useRef(freeSpinsRemaining);
  useEffect(() => { freeSpinsRef.current = freeSpinsRemaining; }, [freeSpinsRemaining]);
  const betRef = useRef(betPerLine);
  useEffect(() => { betRef.current = betPerLine; }, [betPerLine]);

  const checkWins = (g: Sym[][]): { wins: WinInfo[]; totalPayout: number; winningPaylines: number[]; hasScatter: boolean } => {
    const foundWins: WinInfo[] = [];
    const winPls: number[] = [];
    let total = 0;

    let scatters = 0;
    for (let ri = 0; ri < 5; ri++)
      for (let row = 0; row < 3; row++)
        if (g[ri][row].name === 'scatter') scatters++;

    const hasScatter = scatters >= 3;
    if (hasScatter) foundWins.push({ paylineIndex: -1, symbol: '🎰', matchCount: scatters, payout: 0 });

    PAYLINES.forEach((payline, plIdx) => {
      const syms = payline.map((row, ri) => g[ri][row]);
      const first = syms[0];
      if (first.name === 'scatter') return;
      let count = 1;
      for (let i = 1; i < syms.length; i++) {
        if (syms[i].name === first.name) count++; else break;
      }
      if (count >= 3) {
        const mult = count === 3 ? 1 : count === 4 ? 3 : 10;
        const payout = first.payout * betRef.current * mult;
        foundWins.push({ paylineIndex: plIdx, symbol: first.emoji, matchCount: count, payout });
        total += payout;
        winPls.push(plIdx);
      }
    });

    return { wins: foundWins, totalPayout: total, winningPaylines: winPls, hasScatter };
  };

  const runSpin = async (isFree = false) => {
    if (isSpinning.current) return;
    if (!isFree && balance < totalBet) return;
    isSpinning.current = true;

    if (!isFree) setBalance(b => b - betRef.current);
    setState('spinning');
    setWins([]);
    setWinningPaylines([]);
    setTotalWinAmount(0);
    setSpinResult(null);

    const results: [Sym, Sym, Sym][] = Array.from({ length: 5 }, () => [pick(), pick(), pick()]);
    const newStrips = results.map(([r0, r1, r2]) => buildStrip(r0, r1, r2));
    setStrips(newStrips);

    for (let i = 0; i < 5; i++) reelControls[i].set({ y: 0 });
    setReelBlur(Array(5).fill(true));

    const animPromises = reelControls.map((ctrl, i) => {
      const duration = (STOP_DELAYS[i] + 500) / 1000;
      return ctrl.start({ y: TARGET_Y, transition: { duration, ease: [0.06, 0.0, 0.18, 1] } })
        .then(() => { setReelBlur(prev => { const next = [...prev]; next[i] = false; return next; }); });
    });

    await Promise.all(animPromises);
    isSpinning.current = false;

    const grid: Sym[][] = results.map(([r0, r1, r2]) => [r0, r1, r2]);
    const { wins: foundWins, totalPayout, winningPaylines: winPls, hasScatter } = checkWins(grid);

    setWins(foundWins);
    setTotalWinAmount(totalPayout);
    setWinningPaylines(winPls);

    if (!isFree && hasScatter) {
      setBonusWinnings(0);
      setFreeSpinsRemaining(10);
      freeSpinsRef.current = 10;
      setState('free_spins');
      return;
    }

    if (totalPayout > 0) setBalance(b => b + totalPayout);

    if (isFree) {
      setBonusWinnings(b => b + totalPayout);
      setSpinResult(totalPayout);
      const remaining = freeSpinsRef.current - 1;
      setFreeSpinsRemaining(remaining);
      freeSpinsRef.current = remaining;
      setState(remaining > 0 ? 'free_spins' : 'bonus_result');
      return;
    }

    const net = totalPayout - betRef.current;
    setSpinResult(net);
    setWinHistory(h => [net, ...h.slice(0, 9)]);
    setState('idle');

    if (autoSpinsRef.current > 0) {
      setAutoSpins(n => n - 1);
      setTimeout(() => runSpin(), 1200);
    }
  };

  useEffect(() => {
    if (state === 'free_spins' && freeSpinsRef.current > 0) {
      const t = setTimeout(() => runSpin(true), 1000);
      return () => clearTimeout(t);
    }
  }, [state, freeSpinsRemaining]);

  const accentColor = '#00ff88';

  return (
    <MainLayout>
      <div className="min-h-screen py-8 pb-16 relative" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.1) 0%, transparent 60%), var(--background)'
      }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 text-xs font-bold tracking-widest uppercase" style={{ borderColor: 'rgba(0,255,136,0.25)', background: 'rgba(0,255,136,0.07)', color: accentColor }}>
                <motion.span animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}>★</motion.span>
                5-REEL SLOTS · 5 PAYLINES
                <motion.span animate={{ rotate: [0, -360] }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}>★</motion.span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1" style={{
                background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 45%, #4ade80 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Slots</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Match 3, 4, or 5 symbols on a payline — 3+ scatters trigger 10 Free Spins.</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Betting Panel */}
            <div className="rounded-2xl border p-5 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(0,255,136,0.12)' }}>

              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Bet Per Line</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {BET_AMOUNTS.map(amount => (
                    <button key={amount} onClick={() => setBetPerLine(amount)} disabled={state !== 'idle'}
                      className="py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-40"
                      style={{
                        border: `1.5px solid ${betPerLine === amount ? accentColor : 'rgba(255,255,255,0.1)'}`,
                        background: betPerLine === amount ? `${accentColor}18` : 'transparent',
                        color: betPerLine === amount ? accentColor : 'var(--muted-foreground)'
                      }}>
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl px-3 py-2.5 flex items-center justify-between" style={{ background: 'rgba(0,255,136,0.06)', border: '1.5px solid rgba(0,255,136,0.15)' }}>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Total Bet</span>
                <span className="font-black" style={{ color: accentColor }}>${betPerLine.toFixed(2)}</span>
              </div>

              <button onClick={() => runSpin()} disabled={state !== 'idle' || balance < totalBet}
                className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, #00c96e, #00a85a)`, color: '#000', boxShadow: `0 0 24px rgba(0,255,136,0.35)` }}>
                <Zap className="h-4 w-4" />
                SPIN
              </button>

              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Auto Spin</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[10, 50, 100].map(count => (
                    <button key={count} onClick={() => { setAutoSpins(count); runSpin(); }}
                      disabled={state !== 'idle' || balance < totalBet}
                      className="py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-40"
                      style={{ border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)', background: 'transparent' }}>
                      {count}×
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {spinResult !== null && (
                  <motion.div key={winHistory.length} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: spinResult > 0 ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1.5px solid ${spinResult > 0 ? 'rgba(0,255,136,0.35)' : 'rgba(239,68,68,0.35)'}`
                    }}>
                    <p className="text-xs mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Last spin</p>
                    <p className="text-xl font-black" style={{ color: spinResult > 0 ? accentColor : '#ef4444' }}>
                      {spinResult > 0 ? '+' : ''}${spinResult.toFixed(2)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {winHistory.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Spin History</p>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {winHistory.map((net, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span style={{ color: 'var(--muted-foreground)' }}>Spin {idx + 1}</span>
                        <span className="font-black" style={{ color: net > 0 ? accentColor : '#ef4444' }}>
                          {net > 0 ? '+' : ''}${net.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Game Area */}
            <div className="lg:col-span-3 rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(0,255,136,0.12)' }}>
              <div className="p-6">

                {/* Free Spins counter */}
                {state === 'free_spins' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 text-center">
                    <div className="inline-block px-6 py-2 rounded-xl"
                      style={{ background: 'rgba(0,255,136,0.15)', border: `2px solid ${accentColor}`, boxShadow: `0 0 24px ${accentColor}44` }}>
                      <p className="text-xs mb-0.5" style={{ color: 'rgba(0,255,136,0.7)' }}>Free Spins Remaining</p>
                      <p className="text-2xl font-black" style={{ color: accentColor }}>{freeSpinsRemaining}</p>
                    </div>
                  </motion.div>
                )}

                {/* Reel Machine */}
                <div className="relative rounded-2xl p-4 mb-4"
                  style={{ background: 'linear-gradient(180deg, #060c0a 0%, #030605 100%)', border: '2px solid rgba(0,255,136,0.18)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.02), inset 0 0 50px rgba(0,0,0,0.98), 0 8px 32px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,255,136,0.06)' }}>
                  {/* Payline guides */}
                  {[0.5, 1.5, 2.5].map((row, i) => (
                    <div key={i} className="absolute left-3 right-3 pointer-events-none" style={{ top: `${12 + row * SYM_H}px`, zIndex: 20 }}>
                      <div className={`h-px ${i === 1 ? '' : ''}`} style={{ background: i === 1 ? 'rgba(0,255,136,0.35)' : 'rgba(255,255,255,0.06)' }} />
                    </div>
                  ))}

                  {/* Reels */}
                  <div className="flex gap-2">
                    {strips.map((strip, ri) => (
                      <div key={ri} className="flex-1 relative rounded-xl"
                        style={{ height: SYM_H * 3, overflow: 'hidden', background: 'rgba(0,0,0,0.75)', boxShadow: 'inset 0 0 24px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none" style={{ height: 40, background: 'linear-gradient(to bottom, rgba(0,0,0,0.92), transparent)' }} />
                        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none" style={{ height: 40, background: 'linear-gradient(to top, rgba(0,0,0,0.92), transparent)' }} />
                        <div style={{ filter: reelBlur[ri] ? 'blur(2px)' : 'none', transition: 'filter 0.15s ease-out' }}>
                          <motion.div animate={reelControls[ri]} style={{ willChange: 'transform' }}>
                            {strip.map((sym, j) => {
                              const row = j - RESULT_IDX;
                              const isWin = row >= 0 && row <= 2 && winningPaylines.some(pl => PAYLINES[pl][ri] === row);
                              return (
                                <motion.div key={j} className="flex items-center justify-center select-none"
                                  style={{ height: SYM_H, borderRadius: 8, background: isWin ? 'rgba(0,255,136,0.18)' : 'transparent', border: isWin ? '2px solid rgba(0,255,136,0.65)' : '2px solid transparent', boxShadow: isWin ? '0 0 24px rgba(0,255,136,0.4), inset 0 0 12px rgba(0,255,136,0.08)' : 'none', transition: 'background 0.3s, border 0.3s, box-shadow 0.3s' }}
                                  animate={isWin ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                                  transition={{ duration: 0.75, repeat: isWin ? Infinity : 0, ease: 'easeInOut' }}>
                                  <SlotSymbol name={sym.name} size={58} />
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Win Display */}
                <AnimatePresence>
                  {wins.length > 0 && state !== 'spinning' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center mb-4">
                      {totalWinAmount >= 500 && (
                        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.6, repeat: Infinity }}
                          className="text-5xl font-black mb-2" style={{ color: accentColor, textShadow: `0 0 30px ${accentColor}` }}>
                          MEGA WIN!
                        </motion.div>
                      )}
                      {totalWinAmount >= 100 && totalWinAmount < 500 && (
                        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                          className="text-4xl font-black mb-2" style={{ color: accentColor }}>
                          BIG WIN!
                        </motion.div>
                      )}
                      {totalWinAmount > 0 && (
                        <p className="text-3xl font-black" style={{ color: '#22c55e' }}>+${totalWinAmount.toFixed(2)}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['RTP', '96.5%'], ['Paylines', '5'], ['Status', state === 'spinning' ? 'Spinning…' : state === 'free_spins' ? 'Free Spins!' : 'Ready']].map(([label, val]) => (
                    <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(0,255,136,0.05)', border: '1.5px solid rgba(0,255,136,0.1)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
                      <p className="text-sm font-black" style={{ color: accentColor }}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payout Table */}
            <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(0,255,136,0.1)' }}>
              <div>
                <p className="text-xs font-black mb-0.5" style={{ color: 'var(--foreground)' }}>How to Win</p>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>Match 3–5 left→right on any payline. Payouts at <span style={{ color: accentColor }}>$1 bet</span>.</p>
              </div>

              <div className="space-y-1.5 pt-1" style={{ borderTop: '1px solid rgba(0,255,136,0.08)' }}>
                {[
                  { n: 'Cherry',  m3: 2,   m4: 6,   m5: 20  },
                  { n: 'Lemon',   m3: 3,   m4: 9,   m5: 30  },
                  { n: 'Grape',   m3: 4,   m4: 12,  m5: 40  },
                  { n: 'Bell',    m3: 6,   m4: 18,  m5: 60  },
                  { n: 'Star',    m3: 10,  m4: 30,  m5: 100 },
                  { n: 'Diamond', m3: 20,  m4: 60,  m5: 200 },
                  { n: 'Seven',   m3: 50,  m4: 150, m5: 500 },
                ].map(row => (
                  <div key={row.n} className="text-[10px]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <SlotSymbol name={row.n.toLowerCase()} size={20} />
                      <span className="font-bold" style={{ color: 'var(--foreground)' }}>{row.n}</span>
                    </div>
                    <div className="flex gap-1 text-[9px]">
                      {[['3×', row.m3], ['4×', row.m4], ['5×', row.m5]].map(([label, val], i) => (
                        <span key={label as string} className="flex-1 rounded px-1 py-0.5 text-center"
                          style={{ background: i === 2 ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.04)', color: i === 2 ? accentColor : 'var(--muted-foreground)' }}>
                          {label} <span style={{ color: i === 2 ? accentColor : 'var(--foreground)', fontWeight: 700 }}>+${val}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-[10px]" style={{ borderTop: '1px solid rgba(0,255,136,0.08)', paddingTop: 8 }}>
                <div className="rounded-lg p-2" style={{ background: 'rgba(0,255,136,0.06)' }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <SlotSymbol name="scatter" size={20} />
                    <p className="font-bold" style={{ color: accentColor }}>BAR Scatter</p>
                  </div>
                  <p style={{ color: 'var(--muted-foreground)' }}>3+ anywhere → <strong style={{ color: 'var(--foreground)' }}>10 Free Spins</strong></p>
                </div>
                <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="font-bold mb-0.5" style={{ color: 'var(--foreground)' }}>Big Wins</p>
                  <p style={{ color: 'var(--muted-foreground)' }}>100×→ <span style={{ color: accentColor }}>BIG WIN</span><br />500×→ <span style={{ color: accentColor }}>MEGA WIN</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bonus Result Modal */}
        <AnimatePresence>
          {state === 'bonus_result' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              style={{ background: 'rgba(0,0,0,0.75)' }}>
              <motion.div initial={{ y: 20, scale: 0.9 }} animate={{ y: 0, scale: 1 }}
                className="rounded-2xl p-8 max-w-md w-full text-center"
                style={{ background: 'rgba(6,14,8,0.98)', border: `2px solid rgba(0,255,136,0.3)`, boxShadow: `0 0 60px rgba(0,255,136,0.2)` }}>
                <h2 className="text-3xl font-black mb-2" style={{ color: accentColor }}>Free Spins Complete!</h2>
                <p className="text-base mb-6" style={{ color: 'var(--muted-foreground)' }}>
                  Total bonus winnings: <span className="text-2xl font-black" style={{ color: '#22c55e' }}>${bonusWinnings.toFixed(2)}</span>
                </p>
                <button onClick={() => { setState('idle'); setFreeSpinsRemaining(0); setWins([]); setWinningPaylines([]); setTotalWinAmount(0); setBonusWinnings(0); }}
                  className="w-full py-3 rounded-xl font-black text-sm"
                  style={{ background: `linear-gradient(135deg, #00c96e, #00a85a)`, color: '#000', boxShadow: '0 0 24px rgba(0,255,136,0.35)' }}>
                  Continue
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
