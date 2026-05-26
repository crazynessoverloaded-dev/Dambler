import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const SYMBOLS = [
  { emoji: '🍒', name: 'Cherry',  payout: 2,  weight: 40 },
  { emoji: '🍋', name: 'Lemon',   payout: 3,  weight: 30 },
  { emoji: '🔔', name: 'Bell',    payout: 5,  weight: 16 },
  { emoji: '⭐', name: 'Star',    payout: 10, weight: 8  },
  { emoji: '💎', name: 'Diamond', payout: 20, weight: 4  },
  { emoji: '7️⃣', name: 'Seven',   payout: 50, weight: 2  },
];
const CHIPS = [5, 10, 25, 50, 100];

const SYM_H = 88;
const STRIP_LEN = 60;
const STOP_POS = 41;
const TARGET_Y = -(STOP_POS - 1) * SYM_H;

function buildPool() {
  const pool: number[] = [];
  SYMBOLS.forEach((s, i) => { for (let w = 0; w < s.weight; w++) pool.push(i); });
  return pool;
}
const POOL = buildPool();
const pick = () => POOL[Math.floor(Math.random() * POOL.length)];

function buildStrip(finalSym: number): number[] {
  const s = Array.from({ length: STRIP_LEN }, pick);
  s[STOP_POS] = finalSym;
  return s;
}

interface ReelProps {
  strip: number[];
  spinKey: number;
  reelDelay: number;
  onStop: () => void;
  isWinner: boolean;
}

function Reel({ strip, spinKey, reelDelay, onStop, isWinner }: ReelProps) {
  const controls = useAnimation();
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (spinKey === 0) return;
    let active = true;
    setSpinning(true);
    controls.set({ y: 0 });
    controls.start({
      y: TARGET_Y,
      transition: { duration: 1.9 + reelDelay * 0.35, ease: [0.05, 0.02, 0.2, 1] },
    }).then(() => {
      if (!active) return;
      setSpinning(false);
      onStop();
    });
    return () => { active = false; };
  }, [spinKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative rounded-2xl"
      style={{
        width: 100, height: SYM_H * 3, overflow: 'hidden',
        background: 'rgba(0,0,0,0.6)',
        border: `2.5px solid ${isWinner ? 'rgba(245,158,11,0.7)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isWinner ? '0 0 28px rgba(245,158,11,0.4), inset 0 0 20px rgba(0,0,0,0.5)' : 'inset 0 0 20px rgba(0,0,0,0.6)',
        transition: 'border 0.3s, box-shadow 0.3s'
      }}>
      {/* Centre-row highlight band */}
      <div className="absolute inset-x-0 z-10 pointer-events-none"
        style={{ top: SYM_H, height: SYM_H, background: 'rgba(245,158,11,0.04)', borderTop: '1px solid rgba(245,158,11,0.2)', borderBottom: '1px solid rgba(245,158,11,0.2)' }} />
      {/* Top/bottom fade */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none" style={{ height: 48, background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)' }} />
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none" style={{ height: 48, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }} />
      {/* Motion blur overlay */}
      {spinning && <div className="absolute inset-0 z-20 pointer-events-none" style={{ backdropFilter: 'blur(1.5px)', background: 'rgba(0,0,0,0.08)' }} />}
      <motion.div animate={controls} initial={{ y: 0 }}>
        {strip.map((symIdx, i) => (
          <div key={i} style={{ height: SYM_H }} className="flex items-center justify-center text-5xl select-none">
            {SYMBOLS[symIdx].emoji}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function ClassicSlots() {
  const { balance, balanceRef, setBalance } = useGameWallet('ClassicSlots');
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [strips, setStrips] = useState<number[][]>(() => [buildStrip(0), buildStrip(1), buildStrip(2)]);
  const [spinKey, setSpinKey] = useState(0);
  const [result, setResult] = useState<{ payout: number; label: string } | null>(null);
  const [winnerReel, setWinnerReel] = useState(false);

  const spinRef = useRef(false);
  const finalSymsRef = useRef<number[]>([0, 1, 2]);
  const betRef = useRef(bet);
  useEffect(() => { betRef.current = bet; }, [bet]);
  const stoppedRef = useRef(0);

  const handleReelStop = () => {
    stoppedRef.current += 1;
    if (stoppedRef.current < 3) return;
    stoppedRef.current = 0;

    const [s0, s1, s2] = finalSymsRef.current;
    const currentBet = betRef.current;
    let payout = 0;
    let label = '';

    if (s0 === s1 && s1 === s2) {
      payout = +(currentBet * SYMBOLS[s0].payout).toFixed(2);
      label = `3× ${SYMBOLS[s0].name} — ${SYMBOLS[s0].payout}× bet`;
      setWinnerReel(true);
    } else if (s1 === s0 || s1 === s2) {
      const sym = s1;
      payout = +(currentBet * Math.max(1, Math.floor(SYMBOLS[sym].payout * 0.4))).toFixed(2);
      label = `2× ${SYMBOLS[sym].name} — partial payout`;
      setWinnerReel(false);
    } else {
      label = 'No match';
      setWinnerReel(false);
    }

    if (payout > 0) setBalance(b => +(b + payout).toFixed(2));
    setResult({ payout, label });
    setSpinning(false);
    spinRef.current = false;
  };

  const spin = () => {
    if (spinRef.current || bet > balance) return;
    spinRef.current = true;
    stoppedRef.current = 0;
    setSpinning(true);
    setResult(null);
    setWinnerReel(false);
    setBalance(b => +(b - bet).toFixed(2));

    const finalSyms = [pick(), pick(), pick()];
    finalSymsRef.current = finalSyms;
    setStrips(finalSyms.map(sym => buildStrip(sym)));
    setSpinKey(k => k + 1);
  };

  const isWin = result && result.payout > 0;
  const accentColor = '#f59e0b';

  return (
    <MainLayout>
      <div className="min-h-screen py-8 pb-16 relative" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.2) 0%, transparent 55%), radial-gradient(ellipse at 80% 60%, rgba(245,158,11,0.12) 0%, transparent 45%), var(--background)'
      }}>
        <div className="max-w-4xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 text-xs font-bold tracking-widest uppercase" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', color: accentColor }}>
                <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }}>🎰</motion.span>
                CLASSIC SLOTS · 3 REELS
                <motion.span animate={{ rotate: [0, -15, 15, 0] }} transition={{ repeat: Infinity, duration: 2 }}>🎰</motion.span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1" style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 50%, #ef4444 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Classic Slots</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Match 3 symbols on the centre line to win.</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">

            {/* Controls */}
            <div className="rounded-2xl border p-5 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>

              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Bet Amount</p>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {CHIPS.map(c => (
                    <button key={c} onClick={() => setBet(c)} disabled={spinning}
                      className="py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-40"
                      style={{
                        border: `1.5px solid ${bet === c ? accentColor : 'rgba(255,255,255,0.1)'}`,
                        background: bet === c ? `${accentColor}22` : 'transparent',
                        color: bet === c ? accentColor : 'var(--muted-foreground)'
                      }}>
                      ${c}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {result && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: isWin ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.1)',
                      border: `1.5px solid ${isWin ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}`,
                      boxShadow: isWin ? '0 0 20px rgba(245,158,11,0.25)' : 'none'
                    }}>
                    <p className="text-xl font-black" style={{ color: isWin ? accentColor : '#ef4444' }}>
                      {isWin ? `+$${(result.payout - bet).toFixed(2)}` : `-$${bet.toFixed(2)}`}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>{result.label}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={spin} disabled={spinning || bet > balance}
                className="w-full py-3.5 rounded-xl font-black text-base transition-all disabled:opacity-40"
                style={{
                  background: spinning ? `${accentColor}44` : `linear-gradient(135deg, #ef4444, #dc2626)`,
                  color: '#fff',
                  boxShadow: spinning ? 'none' : '0 0 24px rgba(239,68,68,0.4)'
                }}>
                {spinning ? 'SPINNING…' : 'SPIN'}
              </button>

              {/* Paytable */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1.5px solid rgba(245,158,11,0.12)' }}>
                <p className="text-xs font-black mb-2" style={{ color: accentColor }}>3× Paytable</p>
                <div className="space-y-1.5">
                  {SYMBOLS.map(s => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--foreground)' }}>{s.emoji} {s.name}</span>
                      <span className="font-black" style={{ color: accentColor }}>{s.payout}×</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] mt-2" style={{ color: 'var(--muted-foreground)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
                  2× middle match = partial payout
                </p>
              </div>
            </div>

            {/* Machine */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(170deg, #100800 0%, #080500 100%)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="p-8 flex flex-col items-center gap-8 min-h-[460px] justify-center">

                {/* Machine header */}
                <div className="flex items-center gap-3">
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-3 h-3 rounded-full" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                  <p className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: accentColor }}>Classic Slots</p>
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }}
                    className="w-3 h-3 rounded-full" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                </div>

                {/* Reel housing */}
                <div className="relative rounded-2xl px-6 py-5"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: `2.5px solid ${isWin ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: isWin ? `0 0 40px rgba(245,158,11,0.25), inset 0 0 40px rgba(0,0,0,0.7)` : 'inset 0 0 40px rgba(0,0,0,0.7)',
                    transition: 'border 0.3s, box-shadow 0.4s'
                  }}>
                  {/* Payline rule */}
                  <div className="absolute left-0 right-0 z-30 pointer-events-none flex items-center px-3" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                    <div className="flex-1 mx-2" style={{ height: 1, background: `${accentColor}77` }} />
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                  </div>

                  <div className="flex gap-4">
                    {strips.map((strip, ri) => (
                      <Reel key={ri} strip={strip} spinKey={spinKey} reelDelay={ri} onStop={handleReelStop} isWinner={winnerReel && !spinning} />
                    ))}
                  </div>
                </div>

                {/* Payline label */}
                <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <div className="w-8" style={{ height: 1, background: `${accentColor}44` }} />
                  Pay Line
                  <div className="w-8" style={{ height: 1, background: `${accentColor}44` }} />
                </div>

                {/* Win banner */}
                <AnimatePresence>
                  {isWin && result && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="rounded-2xl px-10 py-4 text-center"
                      style={{
                        background: 'rgba(245,158,11,0.12)',
                        border: '2px solid rgba(245,158,11,0.5)',
                        boxShadow: '0 0 40px rgba(245,158,11,0.3)'
                      }}>
                      <motion.p animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                        className="text-2xl font-black" style={{ color: accentColor }}>
                        🎰 WIN! +${(result.payout - bet).toFixed(2)}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 lg:px-6 mt-6">
          <GameRules gameId="classic-slots" />
        </div>
      </div>
    </MainLayout>
  );
}
