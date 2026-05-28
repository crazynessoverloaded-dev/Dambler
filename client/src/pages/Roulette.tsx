import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const POCKET_ANGLE = 360 / 37;

type BetType = 'red' | 'black' | 'odd' | 'even' | '1-12' | '13-24' | '25-36' | 'number';
interface Bet { type: BetType; value?: number; amount: number }
type Phase = 'idle' | 'spinning' | 'result';

function numColor(n: number): 'green' | 'red' | 'black' {
  if (n === 0) return 'green';
  return RED_NUMBERS.has(n) ? 'red' : 'black';
}

function getPayoutMultiplier(bet: Bet, result: number): number {
  const col = numColor(result);
  switch (bet.type) {
    case 'red':    return col === 'red'   ? 1.9 : 0;
    case 'black':  return col === 'black' ? 1.9 : 0;
    case 'odd':    return result !== 0 && result % 2 !== 0 ? 1.9 : 0;
    case 'even':   return result !== 0 && result % 2 === 0 ? 1.9 : 0;
    case '1-12':   return result >= 1  && result <= 12 ? 2.85 : 0;
    case '13-24':  return result >= 13 && result <= 24 ? 2.85 : 0;
    case '25-36':  return result >= 25 && result <= 36 ? 2.85 : 0;
    case 'number': return bet.value === result ? 34 : 0;
    default: return 0;
  }
}

function pocketFill(n: number) {
  if (n === 0) return '#15803d';
  return RED_NUMBERS.has(n) ? '#b91c1c' : '#0e0e14';
}

function RouletteWheelSVG() {
  const cx = 200, cy = 200;
  const outerR = 186;
  const innerR = 78;
  const hubR = 60;

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full" style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.9))' }}>
      <defs>
        <radialGradient id="r_hub" cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#4a3000"/>
          <stop offset="55%" stopColor="#2a1a00"/>
          <stop offset="100%" stopColor="#0f0800"/>
        </radialGradient>
        <radialGradient id="r_rim" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3d2200"/>
          <stop offset="100%" stopColor="#1a0e00"/>
        </radialGradient>
      </defs>

      {/* Mahogany outer disc */}
      <circle cx={cx} cy={cy} r={outerR + 23} fill="url(#r_rim)"/>
      <circle cx={cx} cy={cy} r={outerR + 20} fill="none" stroke="#5a3800" strokeWidth="5"/>

      {/* Gold decorative rings */}
      <circle cx={cx} cy={cy} r={outerR + 17} fill="none" stroke="rgba(255,215,0,0.9)" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={outerR + 10} fill="none" stroke="rgba(255,215,0,0.15)" strokeWidth="13"/>
      <circle cx={cx} cy={cy} r={outerR + 4}  fill="none" stroke="rgba(255,215,0,0.85)" strokeWidth="3"/>
      <circle cx={cx} cy={cy} r={outerR}      fill="none" stroke="rgba(0,0,0,0.7)"      strokeWidth="2"/>

      {/* Gold dot pins at each pocket separator */}
      {WHEEL_ORDER.map((_, i) => {
        const a = (i * POCKET_ANGLE - 90) * Math.PI / 180;
        return (
          <circle key={i}
            cx={cx + (outerR + 10) * Math.cos(a)}
            cy={cy + (outerR + 10) * Math.sin(a)}
            r="2.5" fill="rgba(255,215,0,0.75)"
          />
        );
      })}

      {/* Pocket segments */}
      {WHEEL_ORDER.map((num, i) => {
        const startA = ((i * POCKET_ANGLE - 90) * Math.PI) / 180;
        const endA   = (((i + 1) * POCKET_ANGLE - 90) * Math.PI) / 180;
        const x1  = cx + outerR * Math.cos(startA), y1  = cy + outerR * Math.sin(startA);
        const x2  = cx + outerR * Math.cos(endA),   y2  = cy + outerR * Math.sin(endA);
        const xi1 = cx + innerR * Math.cos(startA), yi1 = cy + innerR * Math.sin(startA);
        const xi2 = cx + innerR * Math.cos(endA),   yi2 = cy + innerR * Math.sin(endA);
        const midA = ((i + 0.5) * POCKET_ANGLE - 90) * Math.PI / 180;
        const textR = innerR + (outerR - innerR) * 0.52;
        const tx = cx + textR * Math.cos(midA), ty = cy + textR * Math.sin(midA);
        const textAngle = (i + 0.5) * POCKET_ANGLE;
        return (
          <g key={num}>
            <path
              d={`M${xi1},${yi1} L${x1},${y1} A${outerR},${outerR} 0 0 1 ${x2},${y2} L${xi2},${yi2} A${innerR},${innerR} 0 0 0 ${xi1},${yi1} Z`}
              fill={pocketFill(num)} stroke="rgba(0,0,0,0.55)" strokeWidth="0.7"
            />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
              fill="#fff" fontSize="9" fontWeight="900" fontFamily="system-ui"
              transform={`rotate(${textAngle}, ${tx}, ${ty})`}
              style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.95))' }}>
              {num}
            </text>
          </g>
        );
      })}

      {/* Inner pocket ring */}
      <circle cx={cx} cy={cy} r={innerR + 1} fill="none" stroke="rgba(255,215,0,0.35)" strokeWidth="1.5"/>

      {/* Ball track */}
      <circle cx={cx} cy={cy} r={(innerR + hubR) / 2} fill="none"
        stroke="rgba(210,185,140,0.1)" strokeWidth={innerR - hubR - 6}/>
      <circle cx={cx} cy={cy} r={innerR - 3} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
      <circle cx={cx} cy={cy} r={hubR + 4}   fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>

      {/* Hub ring */}
      <circle cx={cx} cy={cy} r={hubR + 3} fill="rgba(0,0,0,0.6)" stroke="rgba(255,215,0,0.7)" strokeWidth="2.5"/>

      {/* Hub fill */}
      <circle cx={cx} cy={cy} r={hubR} fill="url(#r_hub)"/>

      {/* Hub spokes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
        const rad = angle * Math.PI / 180;
        return (
          <line key={angle}
            x1={cx} y1={cy}
            x2={cx + (hubR - 5) * Math.cos(rad)}
            y2={cy + (hubR - 5) * Math.sin(rad)}
            stroke="rgba(255,215,0,0.22)" strokeWidth="1.5"
          />
        );
      })}

      {/* Hub concentric ornament rings */}
      <circle cx={cx} cy={cy} r={hubR * 0.56} fill="none" stroke="rgba(255,215,0,0.45)" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={hubR * 0.28} fill="rgba(255,215,0,0.08)" stroke="rgba(255,215,0,0.55)" strokeWidth="1.5"/>

      {/* Center pin */}
      <circle cx={cx} cy={cy} r="9" fill="#fbbf24"/>
      <circle cx={cx} cy={cy} r="4" fill="#3d2000"/>
    </svg>
  );
}

const OUTSIDE_BETS: { type: BetType; label: string; chipColor: string }[] = [
  { type: 'red',   label: 'Red',   chipColor: '#ef4444' },
  { type: 'black', label: 'Black', chipColor: '#9ca3af' },
  { type: 'odd',   label: 'Odd',   chipColor: '#c084fc' },
  { type: 'even',  label: 'Even',  chipColor: '#60a5fa' },
  { type: '1-12',  label: '1–12',  chipColor: '#34d399' },
  { type: '13-24', label: '13–24', chipColor: '#34d399' },
  { type: '25-36', label: '25–36', chipColor: '#34d399' },
];

export default function Roulette() {
  const { balance, balanceRef, setBalance } = useGameWallet('Roulette');
  const [betAmount, setBetAmount] = useState(10);
  const [bets, setBets] = useState<Bet[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [history, setHistory] = useState<{ result: number; profit: number }[]>([]);
  const [showWinRings, setShowWinRings] = useState(false);

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);

  const placeBet = useCallback((type: BetType, value?: number) => {
    if (phase !== 'idle') return;
    setBets(prev => {
      const existing = prev.findIndex(b => b.type === type && b.value === value);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], amount: next[existing].amount + betAmount };
        return next;
      }
      return [...prev, { type, value, amount: betAmount }];
    });
  }, [phase, betAmount]);

  const spin = useCallback(async () => {
    if (bets.length === 0 || balance < totalBet) return;
    setBalance(b => parseFloat((b - totalBet).toFixed(2)));
    setPhase('spinning');
    setResult(null);

    const finalResult = Math.floor(Math.random() * 37);
    const pocketIdx = WHEEL_ORDER.indexOf(finalResult);
    const landAngle = pocketIdx * POCKET_ANGLE + POCKET_ANGLE / 2;
    const newRotation = rotation + 8 * 360 + (360 - landAngle);
    setRotation(newRotation);

    await new Promise(r => setTimeout(r, 3800));

    setResult(finalResult);
    const totalWin = bets.reduce((sum, bet) => sum + bet.amount * getPayoutMultiplier(bet, finalResult), 0);
    const profit = parseFloat((totalWin - totalBet).toFixed(2));
    if (totalWin > 0) setBalance(b => parseFloat((b + totalWin).toFixed(2)));
    setLastProfit(profit);
    setHistory(h => [{ result: finalResult, profit }, ...h.slice(0, 19)]);
    setPhase('result');
    if (profit > 0) {
      setShowWinRings(true);
      setTimeout(() => setShowWinRings(false), 2200);
    }
  }, [bets, balance, totalBet, rotation]);

  const clearBets = () => { setBets([]); setLastProfit(null); setPhase('idle'); };

  const col = result !== null ? numColor(result) : null;

  return (
    <MainLayout>
      {/* Win ring overlay */}
      <AnimatePresence>
        {showWinRings && (
          <motion.div key="rings" initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                style={{ position: 'absolute', borderRadius: '50%', border: '3px solid rgba(251,191,36,0.8)' }}
                initial={{ width: 80, height: 80, opacity: 1 }}
                animate={{ width: 760, height: 760, opacity: 0, borderWidth: 1 }}
                transition={{ duration: 1.5, delay: i * 0.3, ease: 'easeOut' }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ background: '#0d0d12', minHeight: '100vh' }} className="py-6 pb-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: 5,
                background: 'linear-gradient(90deg, #ef4444 0%, #fbbf24 40%, #ef4444 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>ROULETTE</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>European Roulette · Straight-up pays 36×</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24', letterSpacing: 1 }}>${balance.toFixed(2)}</div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* ── LEFT SIDEBAR ── */}
            <div className="space-y-4">

              {/* Chip selector */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12, letterSpacing: 1 }}>CHIP VALUE</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
                  {[1, 5, 10, 50].map(a => (
                    <motion.button key={a} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setBetAmount(a)} disabled={phase === 'spinning'}
                      style={{
                        width: 48, height: 48, borderRadius: '50%',
                        border: `2px solid ${betAmount === a ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
                        background: betAmount === a ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                        color: betAmount === a ? '#fbbf24' : 'rgba(255,255,255,0.45)',
                        fontWeight: 900, fontSize: 12, cursor: 'pointer',
                        boxShadow: betAmount === a ? '0 0 16px rgba(251,191,36,0.3)' : 'none',
                        transition: 'all 0.2s',
                      }}>
                      ${a}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Active bets */}
              {bets.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '12px 14px', maxHeight: 160, overflowY: 'auto' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: 1 }}>YOUR BETS · ${totalBet}</p>
                  {bets.map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{b.type}{b.value !== undefined ? ` (${b.value})` : ''}</span>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>${b.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Result */}
              <AnimatePresence>
                {lastProfit !== null && result !== null && (
                  <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                    style={{
                      borderRadius: 14, padding: '14px', textAlign: 'center',
                      background: lastProfit >= 0 ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1.5px solid ${lastProfit >= 0 ? 'rgba(251,191,36,0.45)' : 'rgba(239,68,68,0.4)'}`,
                    }}>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                      Result: <strong style={{ color: col === 'red' ? '#ef4444' : col === 'black' ? '#e5e7eb' : '#4ade80' }}>{result}</strong>
                    </p>
                    <p style={{ fontSize: 22, fontWeight: 900, color: lastProfit >= 0 ? '#fbbf24' : '#ef4444' }}>
                      {lastProfit >= 0 ? '+' : ''}${lastProfit.toFixed(2)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={clearBets} disabled={phase === 'spinning'}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Clear
                </button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={spin} disabled={bets.length === 0 || phase === 'spinning' || balance < totalBet}
                  style={{
                    flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                    cursor: bets.length === 0 || phase === 'spinning' ? 'not-allowed' : 'pointer',
                    background: bets.length > 0 && phase !== 'spinning'
                      ? 'linear-gradient(135deg, #b91c1c, #ef4444)'
                      : 'rgba(255,255,255,0.08)',
                    color: bets.length > 0 && phase !== 'spinning' ? '#fff' : 'rgba(255,255,255,0.3)',
                    fontWeight: 900, fontSize: 15, letterSpacing: 2,
                    boxShadow: bets.length > 0 && phase !== 'spinning' ? '0 0 30px rgba(239,68,68,0.35)' : 'none',
                    opacity: bets.length === 0 || balance < totalBet ? 0.5 : 1, transition: 'all 0.2s',
                  }}>
                  {phase === 'spinning' ? '◈ ...' : 'SPIN'}
                </motion.button>
              </div>

              {/* History */}
              {history.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: 1 }}>HISTORY</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {history.slice(0, 14).map((h, i) => {
                      const c = numColor(h.result);
                      return (
                        <div key={i} style={{
                          width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 900, color: '#fff',
                          background: c === 'red' ? '#b91c1c' : c === 'green' ? '#15803d' : '#1f2937',
                          border: `1px solid ${c === 'red' ? '#ef4444' : c === 'green' ? '#4ade80' : '#374151'}`,
                        }}>{h.result}</div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── CENTER: WHEEL + TABLE ── */}
            <div className="lg:col-span-4 space-y-4">

              {/* Wheel card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  borderRadius: 24,
                  background: 'linear-gradient(160deg, #070200 0%, #0c0808 100%)',
                  border: '2px solid rgba(255,215,0,0.18)',
                  boxShadow: '0 0 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,215,0,0.1)',
                  overflow: 'hidden',
                }}>

                {/* Marquee bar */}
                <div style={{
                  background: 'linear-gradient(90deg, #1a0800, #4a1800, #8b3a00, #4a1800, #1a0800)',
                  padding: '13px 0', textAlign: 'center',
                  borderBottom: '1px solid rgba(255,215,0,0.2)',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: 7, color: '#fef08a', textShadow: '0 0 24px rgba(254,240,138,0.6)' }}>
                    ◆ EUROPEAN ROULETTE ◆
                  </span>
                </div>

                <div style={{ padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

                  {/* Pointer + Wheel */}
                  <div style={{ position: 'relative', width: 420, height: 420, maxWidth: '100%' }}>
                    {/* Glowing ring behind wheel */}
                    <div style={{
                      position: 'absolute', inset: -6, borderRadius: '50%',
                      background: 'radial-gradient(ellipse, rgba(255,215,0,0.04) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }}/>
                    {/* Pointer */}
                    <div style={{
                      position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
                      width: 0, height: 0,
                      borderLeft: '14px solid transparent', borderRight: '14px solid transparent',
                      borderTop: '32px solid #fbbf24',
                      filter: 'drop-shadow(0 0 14px rgba(251,191,36,1))',
                    }}/>
                    <motion.div style={{ width: '100%', height: '100%' }}
                      animate={{ rotate: rotation }}
                      transition={{ duration: 3.8, ease: [0.12, 0.8, 0.35, 1] }}>
                      <RouletteWheelSVG />
                    </motion.div>
                  </div>

                  {/* Result display */}
                  <div style={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AnimatePresence mode="wait">
                      {phase === 'spinning' && (
                        <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.65 }}
                            style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, letterSpacing: 5 }}>
                            ◈  BALL IN MOTION  ◈
                          </motion.div>
                        </motion.div>
                      )}
                      {phase === 'result' && result !== null && (
                        <motion.div key="r"
                          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                          <motion.div animate={{ scale: [1, 1.07, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                            style={{
                              width: 76, height: 76, borderRadius: '50%',
                              background: col === 'red' ? 'linear-gradient(135deg, #991b1b, #dc2626)' : col === 'green' ? 'linear-gradient(135deg, #14532d, #16a34a)' : 'linear-gradient(135deg, #111827, #1f2937)',
                              border: `3px solid ${col === 'red' ? 'rgba(239,68,68,0.7)' : col === 'green' ? 'rgba(74,222,128,0.7)' : 'rgba(255,255,255,0.2)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 28, fontWeight: 900, color: '#fff',
                              boxShadow: col === 'red' ? '0 0 32px rgba(239,68,68,0.55)' : col === 'green' ? '0 0 32px rgba(74,222,128,0.55)' : '0 0 18px rgba(255,255,255,0.08)',
                            }}>
                            {result}
                          </motion.div>
                          <div>
                            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 2,
                              color: lastProfit && lastProfit >= 0 ? '#fbbf24' : '#ef4444',
                              textShadow: lastProfit && lastProfit >= 0 ? '0 0 24px rgba(251,191,36,0.5)' : '0 0 20px rgba(239,68,68,0.4)',
                            }}>
                              {lastProfit && lastProfit >= 0 ? 'WIN!' : 'MISS'}
                            </div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                              {col === 'red' ? 'Red' : col === 'green' ? 'Green' : 'Black'} · {result % 2 === 0 && result !== 0 ? 'Even' : result !== 0 ? 'Odd' : '0'}
                            </div>
                          </div>
                        </motion.div>
                      )}
                      {phase === 'idle' && (
                        <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, letterSpacing: 1 }}>
                          Place chips on the betting table below
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* ── BETTING TABLE ── */}
              <div style={{
                background: 'linear-gradient(160deg, #071508 0%, #041208 100%)',
                border: '2px solid rgba(255,215,0,0.18)',
                borderRadius: 20, padding: '18px 20px',
                boxShadow: '0 0 40px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,80,0,0.06)',
              }}>
                <p style={{ fontSize: 10, color: 'rgba(255,215,0,0.45)', letterSpacing: 2, marginBottom: 14 }}>
                  BETTING TABLE — click to place · click again to add more
                </p>

                {/* Outside bets row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 10 }}>
                  {OUTSIDE_BETS.map(({ type, label, chipColor }) => {
                    const existing = bets.find(b => b.type === type);
                    return (
                      <motion.button key={type} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => placeBet(type)} disabled={phase !== 'idle'}
                        style={{
                          padding: '12px 4px', borderRadius: 10, cursor: 'pointer', position: 'relative',
                          border: `1.5px solid ${existing ? chipColor : 'rgba(255,255,255,0.07)'}`,
                          background: existing ? `rgba(${chipColor === '#ef4444' ? '239,68,68' : chipColor === '#9ca3af' ? '156,163,175' : chipColor === '#c084fc' ? '192,132,252' : chipColor === '#60a5fa' ? '96,165,250' : '52,211,153'},0.12)` : 'rgba(255,255,255,0.03)',
                          color: '#fff', fontWeight: 800, fontSize: 12, textAlign: 'center',
                          boxShadow: existing ? `0 0 12px ${chipColor}25` : 'none',
                          opacity: phase !== 'idle' ? 0.6 : 1, transition: 'all 0.2s',
                        }}>
                        <div style={{ color: chipColor, fontWeight: 900 }}>{label}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                          {['1-12','13-24','25-36'].includes(type) ? '3:1' : '2:1'}
                        </div>
                        {existing && (
                          <div style={{
                            position: 'absolute', top: -8, right: -6,
                            background: '#fbbf24', color: '#000', borderRadius: '50%',
                            width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, fontWeight: 900,
                          }}>${existing.amount}</div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Number grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(12, 1fr)', gap: 4 }}>
                  {/* Zero */}
                  <button onClick={() => placeBet('number', 0)} disabled={phase !== 'idle'}
                    style={{
                      gridRow: '1 / 4', padding: '4px', borderRadius: 8,
                      background: bets.find(b => b.value === 0) ? 'rgba(74,222,128,0.15)' : '#14532d',
                      border: bets.find(b => b.value === 0) ? '2px solid #4ade80' : '1px solid rgba(255,255,255,0.08)',
                      color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer',
                      opacity: phase !== 'idle' ? 0.6 : 1, transition: 'all 0.15s', position: 'relative',
                    }}>
                    0
                    {bets.find(b => b.value === 0) && (
                      <div style={{ position: 'absolute', top: -6, right: -6, background: '#fbbf24', color: '#000', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 900 }}>$</div>
                    )}
                  </button>

                  {/* Numbers 1–36 in 3 rows of 12 */}
                  {[3, 2, 1].map(row =>
                    Array.from({ length: 12 }, (_, col) => {
                      const n = col * 3 + row;
                      const c = numColor(n);
                      const existing = bets.find(b => b.type === 'number' && b.value === n);
                      return (
                        <motion.button key={n} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                          onClick={() => placeBet('number', n)} disabled={phase !== 'idle'}
                          style={{
                            padding: '10px 2px', borderRadius: 7, fontWeight: 900, fontSize: 12,
                            background: existing
                              ? (c === 'red' ? 'rgba(185,28,28,0.55)' : 'rgba(30,30,50,0.8)')
                              : (c === 'red' ? '#b91c1c' : '#0e0e16'),
                            border: existing ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.06)',
                            color: '#fff', cursor: 'pointer', position: 'relative',
                            boxShadow: existing ? '0 0 10px rgba(251,191,36,0.4)' : 'none',
                            opacity: phase !== 'idle' ? 0.6 : 1, transition: 'all 0.15s',
                          }}>
                          {n}
                          {existing && (
                            <div style={{ position: 'absolute', top: -6, right: -4, background: '#fbbf24', color: '#000', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 900 }}>$</div>
                          )}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <GameRules gameId="roulette" />
      </div>
    </MainLayout>
  );
}
