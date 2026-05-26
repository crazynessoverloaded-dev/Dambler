import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [5, 10, 25, 50, 100];

const SYMBOLS = ['🃏', '7️⃣', '💎', '🍒', '⭐', '🍋', '🔔', '🍇'] as const;
type Symbol = typeof SYMBOLS[number];

const WEIGHTS = [3, 5, 7, 20, 15, 20, 15, 15];
const WEIGHT_CUM = WEIGHTS.reduce<number[]>((acc, w, i) => [...acc, (acc[i - 1] ?? 0) + w], []);
const TOTAL_W = WEIGHT_CUM[WEIGHT_CUM.length - 1];

const PAYOUTS: Record<Symbol, number> = {
  '🃏': 50, '7️⃣': 20, '💎': 12, '⭐': 6, '🔔': 4, '🍒': 3, '🍇': 2, '🍋': 2,
};

const PAYOUT_LABELS: { sym: Symbol; label: string; color: string }[] = [
  { sym: '🃏', label: 'Triple Joker',  color: '#c084fc' },
  { sym: '7️⃣', label: 'Triple Seven',  color: '#f87171' },
  { sym: '💎', label: 'Diamonds',      color: '#38bdf8' },
  { sym: '⭐', label: 'Stars',         color: '#fbbf24' },
  { sym: '🔔', label: 'Bells',         color: '#fbbf24' },
  { sym: '🍒', label: 'Cherries',      color: '#fb7185' },
  { sym: '🍇', label: 'Grapes',        color: '#4ade80' },
  { sym: '🍋', label: 'Lemons',        color: '#86efac' },
];

function pickSymbol(): Symbol {
  const r = Math.random() * TOTAL_W;
  const idx = WEIGHT_CUM.findIndex(c => r < c);
  return SYMBOLS[idx] as Symbol;
}

function buildStrip(forced: Symbol): Symbol[] {
  const strip: Symbol[] = Array.from({ length: 60 }, () => pickSymbol());
  strip[41] = forced;
  return strip;
}

const SYM_H = 110;
const STOP_POS = 41;
const TARGET_Y = -(STOP_POS - 1) * SYM_H;
const REEL_H = SYM_H * 3;

interface ReelProps {
  strip: Symbol[];
  spinKey: number;
  reelDelay: number;
  onStop: () => void;
  isWin: boolean;
}

function Reel({ strip, spinKey, reelDelay, onStop, isWin }: ReelProps) {
  const controls = useAnimation();
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (spinKey === 0) return;
    let active = true;
    setSpinning(true);
    controls.set({ y: 0 });
    controls.start({
      y: TARGET_Y,
      transition: { duration: 2.0 + reelDelay * 0.42, ease: [0.05, 0.02, 0.18, 1] },
    }).then(() => {
      if (!active) return;
      setSpinning(false);
      onStop();
    });
    return () => { active = false; };
  }, [spinKey]);

  return (
    <div style={{
      width: SYM_H, height: REEL_H,
      overflow: 'hidden',
      borderRadius: 14,
      background: '#030010',
      border: isWin ? '2.5px solid #fbbf24' : '2px solid rgba(22,163,74,0.55)',
      boxShadow: isWin
        ? '0 0 28px rgba(251,191,36,0.5), inset 0 0 25px rgba(0,0,0,0.9)'
        : 'inset 0 0 25px rgba(0,0,0,0.9)',
      position: 'relative',
      flexShrink: 0,
      transition: 'border-color 0.3s, box-shadow 0.4s',
    }}>
      {/* Top shadow fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 58, zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(3,0,16,0.97), transparent)',
        pointerEvents: 'none',
      }} />
      {/* Bottom shadow fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 58, zIndex: 10,
        background: 'linear-gradient(to top, rgba(3,0,16,0.97), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Motion blur during spin */}
      <div style={{ filter: spinning ? 'blur(2px)' : 'none', transition: 'filter 0.15s ease-out' }}>
        <motion.div animate={controls} style={{ willChange: 'transform' }}>
          {strip.map((sym, i) => (
            <motion.div
              key={i}
              style={{ width: SYM_H, height: SYM_H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, userSelect: 'none' }}
              animate={isWin && i === STOP_POS ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.7, repeat: isWin ? Infinity : 0, ease: 'easeInOut' }}
            >
              {sym}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function evaluateWin(syms: Symbol[]): { mult: number; label: string } {
  const jokerCount = syms.filter(s => s === '🃏').length;
  const nonJokers = syms.filter(s => s !== '🃏');
  if (jokerCount === 3) return { mult: PAYOUTS['🃏'], label: '🃏 🃏 🃏  TRIPLE JOKER!' };
  if (jokerCount === 2 && nonJokers.length === 1) return { mult: PAYOUTS[nonJokers[0]], label: `🃏 Wild ×2 + ${nonJokers[0]}` };
  if (jokerCount === 1 && nonJokers.length === 2 && nonJokers[0] === nonJokers[1]) return { mult: PAYOUTS[nonJokers[0]], label: `🃏 Wild + ${nonJokers[0]} ${nonJokers[0]}` };
  if (syms[0] === syms[1] && syms[1] === syms[2]) return { mult: PAYOUTS[syms[0]], label: `${syms[0]} ${syms[0]} ${syms[0]}` };
  return { mult: 0, label: 'No match' };
}

type Phase = 'betting' | 'spinning' | 'result';

export default function SlotJoker() {
  const { balance, balanceRef, setBalance } = useGameWallet('SlotJoker');
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState<Phase>('betting');
  const [strips, setStrips] = useState<[Symbol[], Symbol[], Symbol[]]>([
    ['🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔'] as Symbol[],
    ['🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍇','🔔','🍋','⭐','🍒','💎','7️⃣','🃏','🍇','🔔','🍋','⭐','🍒','💎','7️⃣','🃏','🍇','🔔','🍋','⭐'] as Symbol[],
    ['7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','7️⃣','💎','🍒','⭐','🍋','🔔','🍇','🃏','🔔','🍋','⭐','🍒','💎','7️⃣','🃏','🍇','🔔','🍋','⭐','🍒','💎','7️⃣','🃏','🍇','🔔','🍋','⭐','🍒'] as Symbol[],
  ]);
  const [spinKey, setSpinKey] = useState(0);
  const [result, setResult] = useState<{ syms: Symbol[]; mult: number; label: string } | null>(null);
  const [profit, setProfit] = useState(0);

  const betRef = useRef(bet);
  const stoppedRef = useRef(0);
  const landedSyms = useRef<Symbol[]>([]);

  const spin = () => {
    if (phase === 'spinning') return;
    if (bet > balance) return;
    betRef.current = bet;
    stoppedRef.current = 0;
    landedSyms.current = [];
    setResult(null);
    setBalance(b => +(b - bet).toFixed(2));
    setPhase('spinning');
    const s0 = pickSymbol(), s1 = pickSymbol(), s2 = pickSymbol();
    setStrips([buildStrip(s0), buildStrip(s1), buildStrip(s2)]);
    setSpinKey(k => k + 1);
  };

  const handleReelStop = (reelIdx: number, sym: Symbol) => {
    landedSyms.current[reelIdx] = sym;
    stoppedRef.current += 1;
    if (stoppedRef.current === 3) {
      const syms = landedSyms.current as Symbol[];
      const { mult, label } = evaluateWin(syms);
      const pay = +(betRef.current * mult).toFixed(2);
      if (pay > 0) setBalance(b => +(b + pay).toFixed(2));
      setProfit(+(pay - betRef.current).toFixed(2));
      setResult({ syms, mult, label });
      setPhase('result');
    }
  };

  const reset = () => { setPhase('betting'); setResult(null); };

  const isWin = phase === 'result' && (result?.mult ?? 0) > 0;
  const isBigWin = isWin && (result?.mult ?? 0) >= 12;

  return (
    <MainLayout>
      {/* Page with purple ambient atmosphere */}
      <div style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(6,78,59,0.22) 0%, transparent 65%)' }}
        className="py-6 pb-12 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} className="mb-7"
            style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: 5,
                background: 'linear-gradient(90deg, #4ade80 0%, #fbbf24 45%, #4ade80 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                textShadow: 'none',
              }}>
                SLOT JOKER
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                🃏 The Joker is wild — match 3 symbols on the payline
              </p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* ── LEFT PANEL ── */}
            <div className="space-y-4">



              {/* Bet chips */}
              <div style={{
                background: 'rgba(255,255,255,0.0)',
                border: '1px solid rgba(255,255,255,0.0)',
                borderRadius: 16, padding: '14px 16px',
              }}>
                <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12, letterSpacing: 1 }}>BET AMOUNT</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                  {CHIPS.map(c => (
                    <motion.button
                      key={c}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setBet(c)}
                      disabled={phase === 'spinning'}
                      style={{
                        width: 54, height: 54,
                        borderRadius: '50%',
                        background: bet === c
                          ? 'linear-gradient(135deg, #16a34a, #4ade80)'
                          : 'rgba(255,255,255,0.0)',
                        border: `2px solid ${bet === c ? '#4ade80' : 'rgba(255,255,255,0.0)'}`,
                        color: bet === c ? '#fff' : '#86efac',
                        fontWeight: 900, fontSize: 12,
                        cursor: phase === 'spinning' ? 'not-allowed' : 'pointer',
                        boxShadow: bet === c ? '0 0 18px rgba(22,163,74,0.45)' : 'none',
                        opacity: phase === 'spinning' ? 0.5 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      ${c}
                    </motion.button>
                  ))}
                </div>
                <p style={{ textAlign: 'center', marginTop: 10, color: '#86efac', fontSize: 12 }}>
                  Bet: <span style={{ fontWeight: 900 }}>${bet}</span>
                </p>
              </div>

              {/* Payout table */}
              <div style={{
                background: 'rgba(255,255,255,0.0)',
                border: '1px solid rgba(22,163,74,0.25)',
                borderRadius: 16, padding: '14px 16px',
              }}>
                <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10, letterSpacing: 1 }}>PAYOUTS (3-of-a-kind)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {PAYOUT_LABELS.map(({ sym, label, color }) => (
                    <div key={sym} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 14 }}>{sym}{sym}{sym}</span>
                      </div>
                      <span style={{ color, fontWeight: 900, fontSize: 13 }}>{PAYOUTS[sym]}×</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(22,163,74,0.2)', marginTop: 6, paddingTop: 6, color: '#9ca3af', fontSize: 11 }}>
                    🃏 Joker substitutes any symbol
                  </div>
                </div>
              </div>

              {/* Result panel */}
              <AnimatePresence>
                {phase === 'result' && result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.88, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      borderRadius: 16, padding: '16px',
                      textAlign: 'center',
                      background: result.mult > 0
                        ? 'linear-gradient(135deg, rgba(234,179,8,0.12), rgba(255,255,255,0.0))'
                        : 'rgba(239,68,68,0.1)',
                      border: `1.5px solid ${result.mult > 0 ? 'rgba(234,179,8,0.45)' : 'rgba(239,68,68,0.4)'}`,
                    }}
                  >
                    {result.mult > 0 ? (
                      <>
                        <motion.p
                          animate={{ scale: [1, 1.06, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          style={{ fontSize: 28, fontWeight: 900, color: '#fbbf24' }}
                        >
                          +${profit.toFixed(2)}
                        </motion.p>
                        <p style={{ fontSize: 12, color: '#86efac', marginTop: 4 }}>{result.label}</p>
                      </>
                    ) : (
                      <>
                        <p style={{ fontSize: 22, fontWeight: 900, color: '#f87171' }}>✕ No Match</p>
                        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Lost ${bet.toFixed(2)}</p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── MACHINE CENTER ── */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  borderRadius: 24,
                  background: 'linear-gradient(160deg, #10032a 0%, #06001a 100%)',
                  border: '2px solid rgba(22,163,74,0.65)',
                  boxShadow: '0 0 80px rgba(6,78,59,0.2), 0 0 200px rgba(0,0,0,0.8)',
                  overflow: 'hidden',
                }}
              >
                {/* Top marquee */}
                <div style={{
                  background: 'linear-gradient(90deg, #052e16, #15803d, #4ade80, #15803d, #052e16)',
                  padding: '14px 0',
                  textAlign: 'center',
                  boxShadow: '0 4px 30px rgba(0,0,0,0.6)',
                }}>
                  <div style={{
                    fontSize: 18, fontWeight: 900, letterSpacing: 6,
                    color: '#fef08a',
                    textShadow: '0 0 25px rgba(254,240,138,0.7)',
                  }}>
                    ✦ SLOT JOKER ✦
                  </div>
                  <div style={{ fontSize: 10, color: '#86efac', letterSpacing: 3, marginTop: 2 }}>
                    🃏 WILD CARD SLOTS
                  </div>
                </div>

                {/* Inner area */}
                <div style={{ padding: '22px 24px' }}>

                  {/* Ambient glow behind reels */}
                  <div style={{
                    position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
                    width: '90%', height: 340,
                    background: 'radial-gradient(ellipse, rgba(255,255,255,0.0) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }} />

                  {/* Reel frame */}
                  <div style={{
                    background: 'rgba(0,0,0,0.75)',
                    borderRadius: 18,
                    border: '1px solid rgba(255,255,255,0.0)',
                    padding: '18px 14px 14px',
                    boxShadow: 'inset 0 0 50px rgba(0,0,0,0.85)',
                    position: 'relative',
                  }}>
                    {/* Payline label row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 32, height: 1.5, background: '#fbbf24', opacity: 0.6 }} />
                        <span style={{ color: '#fbbf24', fontSize: 9, fontWeight: 700, letterSpacing: 2, opacity: 0.8 }}>PAY LINE</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#fbbf24', fontSize: 9, fontWeight: 700, letterSpacing: 2, opacity: 0.8 }}>PAY LINE</span>
                        <div style={{ width: 32, height: 1.5, background: '#fbbf24', opacity: 0.6 }} />
                      </div>
                    </div>

                    {/* Reels row */}
                    <div style={{ position: 'relative', display: 'flex', gap: 14, justifyContent: 'center' }}>
                      {/* Gold payline band */}
                      <div style={{
                        position: 'absolute',
                        top: SYM_H,
                        left: -14, right: -14,
                        height: SYM_H,
                        background: 'rgba(251,191,36,0.04)',
                        borderTop: '1.5px solid rgba(251,191,36,0.4)',
                        borderBottom: '1.5px solid rgba(251,191,36,0.4)',
                        pointerEvents: 'none', zIndex: 20,
                      }} />

                      {[0, 1, 2].map(i => (
                        <Reel
                          key={i}
                          strip={strips[i]}
                          spinKey={spinKey}
                          reelDelay={i}
                          onStop={() => handleReelStop(i, strips[i][STOP_POS])}
                          isWin={isWin}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Status display */}
                  <div style={{ marginTop: 20, minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AnimatePresence mode="wait">
                      {phase === 'spinning' && (
                        <motion.div key="spinning"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ textAlign: 'center' }}
                        >
                          <motion.div
                            animate={{ opacity: [1, 0.45, 1] }}
                            transition={{ repeat: Infinity, duration: 0.7 }}
                            style={{ color: '#4ade80', fontSize: 16, fontWeight: 700, letterSpacing: 4 }}
                          >
                            ◈  SPINNING  ◈
                          </motion.div>
                        </motion.div>
                      )}
                      {phase === 'result' && result && (
                        <motion.div key="result"
                          initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          style={{ textAlign: 'center' }}
                        >
                          {result.mult > 0 ? (
                            <>
                              <motion.div
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ repeat: Infinity, duration: 0.9 }}
                                style={{
                                  fontSize: isBigWin ? 36 : 26,
                                  fontWeight: 900,
                                  color: '#fbbf24',
                                  textShadow: '0 0 30px rgba(251,191,36,0.6)',
                                  letterSpacing: 2,
                                }}
                              >
                                {isBigWin ? '🏆 BIG WIN!' : '🎉 WIN!'}
                              </motion.div>
                              <div style={{ color: '#e5e7eb', fontSize: 14, marginTop: 4, fontWeight: 700 }}>
                                {result.label}
                              </div>
                              <div style={{ color: '#00ff88', fontSize: 20, fontWeight: 900, marginTop: 4 }}>
                                +${profit.toFixed(2)}
                              </div>
                            </>
                          ) : (
                            <div style={{ color: '#f87171', fontSize: 22, fontWeight: 700 }}>
                              ✕ No Match
                            </div>
                          )}
                        </motion.div>
                      )}
                      {phase === 'betting' && (
                        <motion.div key="idle"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ color: 'rgba(134,239,172,0.45)', fontSize: 13, textAlign: 'center', letterSpacing: 1 }}
                        >
                          Match 3 symbols on the centre payline
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* SPIN button */}
                <div style={{ padding: '0 24px 24px' }}>
                  <motion.button
                    whileHover={phase !== 'spinning' ? { scale: 1.02 } : {}}
                    whileTap={phase !== 'spinning' ? { scale: 0.97 } : {}}
                    onClick={phase === 'result' ? reset : spin}
                    disabled={phase === 'spinning' || (bet > balance && phase !== 'result')}
                    style={{
                      width: '100%',
                      padding: '18px 0',
                      borderRadius: 14,
                      border: 'none',
                      cursor: phase === 'spinning' ? 'not-allowed' : 'pointer',
                      fontSize: 18, fontWeight: 900, letterSpacing: 4,
                      color: '#ffffff',
                      background: phase === 'spinning'
                        ? 'rgba(255,255,255,0.0)'
                        : phase === 'result'
                          ? 'linear-gradient(135deg, #059669, #10b981)'
                          : 'linear-gradient(135deg, #15803d 0%, #4ade80 50%, #16a34a 100%)',
                      boxShadow: phase === 'spinning'
                        ? 'none'
                        : phase === 'result'
                          ? '0 0 35px rgba(16,185,129,0.4)'
                          : '0 0 40px rgba(22,163,74,0.5)',
                      textShadow: '0 0 20px rgba(255,255,255,0.4)',
                      opacity: (bet > balance && phase !== 'result') ? 0.4 : 1,
                      transition: 'background 0.25s, box-shadow 0.25s',
                    }}
                  >
                    {phase === 'spinning' ? '◈  SPINNING  ◈'
                      : phase === 'result' ? '↺  SPIN AGAIN'
                        : `⚡  SPIN  —  $${bet}`}
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* ── RULES ── */}
            <div><GameRules gameId="slot-joker" variant="side" /></div>
          </div>
        </div>

        {/* Big win fullscreen overlay */}
        <AnimatePresence>
          {isBigWin && result && (result.mult >= 20) && (
            <motion.div
              key="bigwin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
                background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.0) 0%, transparent 70%)',
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.07, 1] }}
                transition={{ repeat: Infinity, duration: 0.85 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{
                  fontSize: 72, fontWeight: 900, letterSpacing: 4,
                  background: 'linear-gradient(90deg, #fbbf24, #f97316, #fbbf24)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.6))',
                }}>
                  {result.mult >= 30 ? 'MEGA WIN!' : 'BIG WIN!'}
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#00ff88', marginTop: 8, textShadow: '0 0 30px rgba(0,255,136,0.6)' }}>
                  +${profit.toFixed(2)}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}


