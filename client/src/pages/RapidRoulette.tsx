import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [5, 10, 25, 50, 100];

type BetOption = 'red' | 'black' | 'zero' | 'even' | 'odd' | 'low' | 'high';
type Phase = 'betting' | 'spinning' | 'result';

const RED_NUMS = new Set([1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35]);

const BET_OPTIONS: { id: BetOption; label: string; sub: string; payout: number; color: string; bg: string; border: string }[] = [
  { id: 'red',   label: 'Red',   sub: '18 numbers', payout: 1.9, color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.5)'    },
  { id: 'black', label: 'Black', sub: '18 numbers', payout: 1.9, color: '#d1d5db', bg: 'rgba(156,163,175,0.1)',  border: 'rgba(156,163,175,0.35)'  },
  { id: 'even',  label: 'Even',  sub: '1–36 even',  payout: 1.9, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.5)'    },
  { id: 'odd',   label: 'Odd',   sub: '1–36 odd',   payout: 1.9, color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.5)'   },
  { id: 'low',   label: '1–18',  sub: 'Low half',   payout: 1.9, color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.5)'    },
  { id: 'high',  label: '19–36', sub: 'High half',  payout: 1.9, color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.5)'    },
  { id: 'zero',  label: 'Zero',  sub: '0 only',     payout: 35,  color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.5)'    },
];

function isWin(bet: BetOption, num: number): boolean {
  if (num === 0) return bet === 'zero';
  if (bet === 'red')   return RED_NUMS.has(num);
  if (bet === 'black') return !RED_NUMS.has(num);
  if (bet === 'even')  return num % 2 === 0;
  if (bet === 'odd')   return num % 2 === 1;
  if (bet === 'low')   return num >= 1 && num <= 18;
  if (bet === 'high')  return num >= 19 && num <= 36;
  return false;
}

function numColor(n: number) {
  if (n === 0) return '#16a34a';
  return RED_NUMS.has(n) ? '#dc2626' : '#0e0e14';
}

const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const POCKET_ANGLE = 360 / 37;

function RouletteWheel() {
  const cx = 175, cy = 175;
  const outerR = 162;
  const innerR = 68;
  const hubR = 52;

  return (
    <svg viewBox="0 0 350 350" className="w-full h-full" style={{ filter: 'drop-shadow(0 6px 28px rgba(0,0,0,0.9))' }}>
      <defs>
        <radialGradient id="rr_hub" cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#4a3000"/>
          <stop offset="55%" stopColor="#2a1a00"/>
          <stop offset="100%" stopColor="#0f0800"/>
        </radialGradient>
        <radialGradient id="rr_rim" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3d2200"/>
          <stop offset="100%" stopColor="#1a0e00"/>
        </radialGradient>
      </defs>

      {/* Mahogany outer disc */}
      <circle cx={cx} cy={cy} r={outerR + 20} fill="url(#rr_rim)"/>
      <circle cx={cx} cy={cy} r={outerR + 17} fill="none" stroke="#5a3800" strokeWidth="5"/>

      {/* Gold decorative rings */}
      <circle cx={cx} cy={cy} r={outerR + 14} fill="none" stroke="rgba(255,215,0,0.9)"  strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={outerR + 8}  fill="none" stroke="rgba(255,215,0,0.15)" strokeWidth="12"/>
      <circle cx={cx} cy={cy} r={outerR + 3}  fill="none" stroke="rgba(255,215,0,0.85)" strokeWidth="3"/>
      <circle cx={cx} cy={cy} r={outerR}      fill="none" stroke="rgba(0,0,0,0.7)"      strokeWidth="2"/>

      {/* Gold dot pins at each separator */}
      {WHEEL_ORDER.map((_, i) => {
        const a = (i * POCKET_ANGLE - 90) * Math.PI / 180;
        return (
          <circle key={i}
            cx={cx + (outerR + 8) * Math.cos(a)}
            cy={cy + (outerR + 8) * Math.sin(a)}
            r="2" fill="rgba(255,215,0,0.7)"
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
              fill={numColor(num)} stroke="rgba(0,0,0,0.55)" strokeWidth="0.7"
            />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
              fill="#fff" fontSize="8" fontWeight="900" fontFamily="system-ui"
              transform={`rotate(${textAngle}, ${tx}, ${ty})`}
              style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.95))' }}>
              {num}
            </text>
          </g>
        );
      })}

      {/* Inner pocket ring */}
      <circle cx={cx} cy={cy} r={innerR + 1} fill="none" stroke="rgba(255,215,0,0.3)" strokeWidth="1.5"/>

      {/* Ball track */}
      <circle cx={cx} cy={cy} r={(innerR + hubR) / 2} fill="none"
        stroke="rgba(210,185,140,0.08)" strokeWidth={innerR - hubR - 4}/>
      <circle cx={cx} cy={cy} r={innerR - 2} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1"/>
      <circle cx={cx} cy={cy} r={hubR + 3}   fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1"/>

      {/* Hub ring */}
      <circle cx={cx} cy={cy} r={hubR + 2} fill="rgba(0,0,0,0.6)" stroke="rgba(255,215,0,0.65)" strokeWidth="2.5"/>

      {/* Hub fill */}
      <circle cx={cx} cy={cy} r={hubR} fill="url(#rr_hub)"/>

      {/* Hub spokes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
        const rad = angle * Math.PI / 180;
        return (
          <line key={angle}
            x1={cx} y1={cy}
            x2={cx + (hubR - 5) * Math.cos(rad)}
            y2={cy + (hubR - 5) * Math.sin(rad)}
            stroke="rgba(255,215,0,0.2)" strokeWidth="1.5"
          />
        );
      })}

      {/* Hub ornament rings */}
      <circle cx={cx} cy={cy} r={hubR * 0.56} fill="none" stroke="rgba(255,215,0,0.45)" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={hubR * 0.28} fill="rgba(255,215,0,0.08)" stroke="rgba(255,215,0,0.55)" strokeWidth="1.5"/>

      {/* Center pin */}
      <circle cx={cx} cy={cy} r="8" fill="#fbbf24"/>
      <circle cx={cx} cy={cy} r="3" fill="#3d2000"/>
    </svg>
  );
}

export default function RapidRoulette() {
  const { balance, balanceRef, setBalance } = useGameWallet('RapidRoulette');
  const [bet, setBet]         = useState(10);
  const [betType, setBetType] = useState<BetOption | null>(null);
  const [phase, setPhase]     = useState<Phase>('betting');
  const [rotation, setRotation] = useState(0);
  const [result, setResult]   = useState<number | null>(null);
  const [profit, setProfit]   = useState(0);
  const [showWinRings, setShowWinRings] = useState(false);
  const spinningRef = useRef(false);

  const spin = () => {
    if (!betType || bet > balance || spinningRef.current) return;
    spinningRef.current = true;
    setBalance(b => +(b - bet).toFixed(2));
    setPhase('spinning');

    const num = Math.floor(Math.random() * 37);
    const pocketIdx = WHEEL_ORDER.indexOf(num);
    const landAngle = pocketIdx * POCKET_ANGLE + POCKET_ANGLE / 2;
    const finalRotation = 8 * 360 + (360 - landAngle);
    setRotation(prev => prev + finalRotation);

    setTimeout(() => {
      setResult(num);
      const won = isWin(betType, num);
      const cfg = BET_OPTIONS.find(o => o.id === betType)!;
      if (won) {
        const pay = +(bet * cfg.payout).toFixed(2);
        setBalance(b => +(b + pay).toFixed(2));
        setProfit(+(pay - bet).toFixed(2));
        setShowWinRings(true);
        setTimeout(() => setShowWinRings(false), 2200);
      } else {
        setProfit(-bet);
      }
      setPhase('result');
      spinningRef.current = false;
    }, 3800);
  };

  const reset = () => { setPhase('betting'); setResult(null); setBetType(null); };

  const won = result !== null && betType ? isWin(betType, result) : false;
  const selectedBet = BET_OPTIONS.find(o => o.id === betType);

  function resultColor(n: number) {
    if (n === 0) return '#4ade80';
    return RED_NUMS.has(n) ? '#ef4444' : '#d1d5db';
  }

  return (
    <MainLayout>
      {/* Win rings overlay */}
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
        <div className="max-w-5xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: 5,
                background: 'linear-gradient(90deg, #ef4444 0%, #fbbf24 40%, #ef4444 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>RAPID ROULETTE</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>Pick a bet · Spin the European wheel · Win up to 35×</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24', letterSpacing: 1 }}>${balance.toFixed(2)}</div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* ── LEFT PANEL ── */}
            <div className="space-y-4">

              {/* Chips */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12, letterSpacing: 1 }}>BET AMOUNT</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {CHIPS.map(c => (
                    <motion.button key={c} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setBet(c)} disabled={phase !== 'betting'}
                      style={{
                        width: 50, height: 50, borderRadius: '50%',
                        border: `2px solid ${bet === c ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                        background: bet === c ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                        color: bet === c ? '#ef4444' : 'rgba(255,255,255,0.45)',
                        fontWeight: 900, fontSize: 12, cursor: 'pointer',
                        boxShadow: bet === c ? '0 0 16px rgba(239,68,68,0.3)' : 'none',
                        opacity: phase !== 'betting' ? 0.5 : 1, transition: 'all 0.2s',
                      }}>
                      ${c}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Bet type */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12, letterSpacing: 1 }}>BET TYPE</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {BET_OPTIONS.map(o => {
                    const sel = betType === o.id;
                    return (
                      <motion.button key={o.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { if (phase === 'betting') setBetType(o.id); }}
                        disabled={phase !== 'betting'}
                        style={{
                          padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${sel ? o.border : 'rgba(255,255,255,0.06)'}`,
                          background: sel ? o.bg : 'rgba(255,255,255,0.02)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          boxShadow: sel ? `0 0 14px ${o.bg}` : 'none',
                          opacity: phase !== 'betting' ? 0.5 : 1, transition: 'all 0.2s',
                        }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: sel ? o.color : 'rgba(255,255,255,0.6)' }}>{o.label}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{o.sub}</div>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: o.color }}>{o.payout}×</div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Result */}
              <AnimatePresence>
                {phase === 'result' && (
                  <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                    style={{
                      borderRadius: 14, padding: '16px', textAlign: 'center',
                      background: won ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1.5px solid ${won ? 'rgba(251,191,36,0.45)' : 'rgba(239,68,68,0.4)'}`,
                    }}>
                    <motion.p animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                      style={{ fontSize: 28, fontWeight: 900, color: won ? '#fbbf24' : '#ef4444' }}>
                      {won ? `+$${profit.toFixed(2)}` : `-$${bet.toFixed(2)}`}
                    </motion.p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                      Landed: <span style={{ fontWeight: 900, color: result !== null ? resultColor(result) : '#fff' }}>{result}</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Spin / Reset */}
              <motion.button
                whileHover={phase !== 'spinning' ? { scale: 1.02 } : {}}
                whileTap={phase !== 'spinning' ? { scale: 0.97 } : {}}
                onClick={phase === 'result' ? reset : spin}
                disabled={phase === 'spinning' || (phase === 'betting' && (!betType || bet > balance))}
                style={{
                  width: '100%', padding: '18px 0', borderRadius: 14, border: 'none',
                  cursor: phase === 'spinning' ? 'not-allowed' : 'pointer',
                  fontSize: 16, fontWeight: 900, letterSpacing: 3, color: '#fff',
                  background: phase === 'spinning' ? 'rgba(255,255,255,0.07)'
                    : phase === 'result' ? 'linear-gradient(135deg, #059669, #10b981)'
                    : 'linear-gradient(135deg, #b91c1c, #ef4444)',
                  boxShadow: phase === 'spinning' ? 'none'
                    : phase === 'result' ? '0 0 30px rgba(16,185,129,0.35)'
                    : '0 0 35px rgba(239,68,68,0.35)',
                  opacity: (phase === 'betting' && (!betType || bet > balance)) ? 0.4 : 1,
                  transition: 'all 0.25s',
                }}>
                {phase === 'spinning' ? '◈  SPINNING  ◈'
                  : phase === 'result' ? '↺  SPIN AGAIN'
                  : betType ? `⚡  SPIN  —  $${bet}` : 'PICK A BET'}
              </motion.button>
            </div>

            {/* ── WHEEL ── */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  borderRadius: 24,
                  background: 'linear-gradient(160deg, #070200 0%, #0c0808 100%)',
                  border: '2px solid rgba(255,215,0,0.18)',
                  boxShadow: '0 0 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,215,0,0.1)',
                  overflow: 'hidden',
                }}>

                {/* Marquee */}
                <div style={{
                  background: 'linear-gradient(90deg, #1a0800, #4a1800, #8b3a00, #4a1800, #1a0800)',
                  padding: '13px 0', textAlign: 'center',
                  borderBottom: '1px solid rgba(255,215,0,0.2)',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: 7, color: '#fef08a', textShadow: '0 0 24px rgba(254,240,138,0.6)' }}>
                    ◆ EUROPEAN WHEEL ◆
                  </span>
                </div>

                <div style={{ padding: '28px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

                  {/* Pointer + Wheel */}
                  <div style={{ position: 'relative', width: 360, height: 360, maxWidth: '100%' }}>
                    <div style={{
                      position: 'absolute', inset: -6, borderRadius: '50%',
                      background: 'radial-gradient(ellipse, rgba(255,215,0,0.04) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }}/>
                    <div style={{
                      position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
                      width: 0, height: 0,
                      borderLeft: '13px solid transparent', borderRight: '13px solid transparent',
                      borderTop: '30px solid #fbbf24',
                      filter: 'drop-shadow(0 0 14px rgba(251,191,36,1))',
                    }}/>
                    <motion.div style={{ width: '100%', height: '100%' }}
                      animate={{ rotate: rotation }}
                      transition={phase === 'spinning' ? { duration: 3.6, ease: [0.12, 0.8, 0.35, 1] } : { duration: 0 }}>
                      <RouletteWheel />
                    </motion.div>
                  </div>

                  {/* Status display */}
                  <div style={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AnimatePresence mode="wait">
                      {phase === 'spinning' && (
                        <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.65 }}
                            style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, letterSpacing: 5, textAlign: 'center' }}>
                            ◈  BALL IN MOTION  ◈
                          </motion.div>
                        </motion.div>
                      )}
                      {phase === 'result' && result !== null && (
                        <motion.div key="r"
                          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                          style={{ textAlign: 'center' }}>
                          <motion.div
                            animate={{ scale: [1, 1.07, 1] }}
                            transition={{ repeat: Infinity, duration: 0.9 }}
                            style={{
                              width: 76, height: 76, borderRadius: '50%', margin: '0 auto 12px',
                              background: result === 0
                                ? 'linear-gradient(135deg, #14532d, #16a34a)'
                                : RED_NUMS.has(result)
                                  ? 'linear-gradient(135deg, #991b1b, #dc2626)'
                                  : 'linear-gradient(135deg, #111827, #1f2937)',
                              border: `3px solid ${result === 0 ? 'rgba(74,222,128,0.7)' : RED_NUMS.has(result) ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.18)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 28, fontWeight: 900, color: '#fff',
                              boxShadow: result === 0 ? '0 0 28px rgba(74,222,128,0.5)' : RED_NUMS.has(result) ? '0 0 28px rgba(239,68,68,0.5)' : '0 0 18px rgba(255,255,255,0.08)',
                            }}>
                            {result}
                          </motion.div>
                          <div style={{
                            fontSize: won ? 24 : 20, fontWeight: 900, letterSpacing: 2,
                            color: won ? '#fbbf24' : '#ef4444',
                            textShadow: won ? '0 0 24px rgba(251,191,36,0.5)' : '0 0 18px rgba(239,68,68,0.4)',
                          }}>
                            {won ? 'WIN!' : 'MISS'}
                          </div>
                        </motion.div>
                      )}
                      {phase === 'betting' && (
                        <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ textAlign: 'center', color: 'rgba(255,255,255,0.22)', fontSize: 12, letterSpacing: 1 }}>
                          {selectedBet
                            ? <span style={{ color: selectedBet.color, fontWeight: 700 }}>Betting on {selectedBet.label} · {selectedBet.payout}× payout</span>
                            : 'Select a bet type to play'}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── RULES ── */}
            <div><GameRules gameId="rapid-roulette" variant="side" /></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
