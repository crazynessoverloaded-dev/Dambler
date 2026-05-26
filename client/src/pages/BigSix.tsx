import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

interface Segment { label: string; mult: number; color: string; textColor: string; count: number }

const SEGMENTS: Segment[] = [
  { label: '1×',    mult: 1,  color: '#15803d', textColor: '#d1fae5', count: 24 },
  { label: '2×',    mult: 2,  color: '#1d4ed8', textColor: '#bfdbfe', count: 15 },
  { label: '5×',    mult: 5,  color: '#b45309', textColor: '#fef3c7', count: 7  },
  { label: '10×',   mult: 10, color: '#c2410c', textColor: '#ffedd5', count: 4  },
  { label: '20×',   mult: 20, color: '#7e22ce', textColor: '#f3e8ff', count: 2  },
  { label: '40×',   mult: 40, color: '#991b1b', textColor: '#fee2e2', count: 1  },
  { label: 'JOKER', mult: 45, color: '#92400e', textColor: '#fef08a', count: 1  },
];

const TOTAL_SLOTS = SEGMENTS.reduce((s, seg) => s + seg.count, 0);
const WHEEL_FLAT: Segment[] = [];
for (const seg of SEGMENTS) for (let i = 0; i < seg.count; i++) WHEEL_FLAT.push(seg);

const SLOT_DEG = 360 / TOTAL_SLOTS;
const GROUPED = (() => {
  let angle = 0;
  return SEGMENTS.map(seg => {
    const start = angle;
    const span  = seg.count * SLOT_DEG;
    angle += span;
    return { ...seg, startAngle: start, endAngle: angle };
  });
})();

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as [number, number];
}

function BigSixWheelSVG() {
  const cx = 175, cy = 175, R = 158, innerR = 32;

  return (
    <svg viewBox="0 0 350 350" className="w-full h-full" style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.9))' }}>
      <defs>
        <radialGradient id="bs_hub" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#4a3000"/>
          <stop offset="55%" stopColor="#2a1a00"/>
          <stop offset="100%" stopColor="#0f0800"/>
        </radialGradient>
        <radialGradient id="bs_rim" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3d2200"/>
          <stop offset="100%" stopColor="#1a0e00"/>
        </radialGradient>
      </defs>

      {/* Mahogany outer disc */}
      <circle cx={cx} cy={cy} r={R + 20} fill="url(#bs_rim)"/>
      <circle cx={cx} cy={cy} r={R + 17} fill="none" stroke="#5a3800" strokeWidth="5"/>

      {/* Gold decorative rings */}
      <circle cx={cx} cy={cy} r={R + 14} fill="none" stroke="rgba(255,215,0,0.9)"  strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={R + 8}  fill="none" stroke="rgba(255,215,0,0.18)" strokeWidth="12"/>
      <circle cx={cx} cy={cy} r={R + 3}  fill="none" stroke="rgba(255,215,0,0.88)" strokeWidth="3"/>
      <circle cx={cx} cy={cy} r={R}      fill="none" stroke="rgba(0,0,0,0.7)"       strokeWidth="2"/>

      {/* Gold dot pins at slot separators (showing major ones only for clarity) */}
      {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
        const a = (i * SLOT_DEG - 90) * Math.PI / 180;
        return (
          <circle key={i}
            cx={cx + (R + 8) * Math.cos(a)}
            cy={cy + (R + 8) * Math.sin(a)}
            r="1.8" fill="rgba(255,215,0,0.5)"
          />
        );
      })}

      {/* Segments */}
      {GROUPED.map(seg => {
        const startA = seg.startAngle, endA = seg.endAngle;
        const large  = endA - startA > 180 ? 1 : 0;
        const [x1, y1] = polar(cx, cy, R, startA);
        const [x2, y2] = polar(cx, cy, R, endA);
        const [xi1, yi1] = polar(cx, cy, innerR, startA);
        const [xi2, yi2] = polar(cx, cy, innerR, endA);

        const midA  = (startA + endA) / 2;
        const textR = (R + innerR) / 2;
        const [tx, ty] = polar(cx, cy, textR, midA);
        const textRotate = midA + 90;

        const dividers = [];
        for (let k = 1; k < seg.count; k++) {
          const a = seg.startAngle + k * SLOT_DEG;
          const [dx1, dy1] = polar(cx, cy, innerR, a);
          const [dx2, dy2] = polar(cx, cy, R, a);
          dividers.push({ dx1, dy1, dx2, dy2 });
        }

        const span = endA - startA;
        const fontSize = span >= 80 ? 18 : span >= 40 ? 14 : span >= 15 ? 11 : 9;
        const subFontSize = span >= 80 ? 10 : span >= 40 ? 9 : 0;

        return (
          <g key={seg.label}>
            <path
              d={`M ${xi1},${yi1} L ${x1},${y1} A ${R},${R} 0 ${large} 1 ${x2},${y2} L ${xi2},${yi2} A ${innerR},${innerR} 0 ${large} 0 ${xi1},${yi1} Z`}
              fill={seg.color} stroke="rgba(0,0,0,0.55)" strokeWidth="1.5"
            />
            <path
              d={`M ${xi1},${yi1} L ${x1},${y1} A ${R},${R} 0 ${large} 1 ${x2},${y2} L ${xi2},${yi2} A ${innerR},${innerR} 0 ${large} 0 ${xi1},${yi1} Z`}
              fill="rgba(255,255,255,0.06)" stroke="none"
            />
            {dividers.map((d, i) => (
              <line key={i} x1={d.dx1} y1={d.dy1} x2={d.dx2} y2={d.dy2} stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/>
            ))}
            {span >= 7 && (
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                fill={seg.textColor} fontSize={fontSize} fontWeight="900" fontFamily="system-ui"
                transform={`rotate(${textRotate}, ${tx}, ${ty})`}
                style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))' }}>
                {seg.label}
              </text>
            )}
            {subFontSize > 0 && (
              <text x={tx} y={ty + fontSize * 0.9} textAnchor="middle" dominantBaseline="middle"
                fill={seg.textColor} fontSize={subFontSize} fontWeight="600" fontFamily="system-ui"
                opacity="0.6"
                transform={`rotate(${textRotate}, ${tx}, ${ty + fontSize * 0.9})`}>
                {seg.count} slots
              </text>
            )}
          </g>
        );
      })}

      {/* Inner ring before hub */}
      <circle cx={cx} cy={cy} r={innerR + 4} fill="none" stroke="rgba(255,215,0,0.35)" strokeWidth="1.5"/>

      {/* Hub fill */}
      <circle cx={cx} cy={cy} r={innerR + 2} fill="url(#bs_hub)" stroke="rgba(255,215,0,0.65)" strokeWidth="2.5"/>

      {/* Hub spokes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
        const rad = angle * Math.PI / 180;
        return (
          <line key={angle}
            x1={cx} y1={cy}
            x2={cx + (innerR - 2) * Math.cos(rad)}
            y2={cy + (innerR - 2) * Math.sin(rad)}
            stroke="rgba(255,215,0,0.2)" strokeWidth="1.5"
          />
        );
      })}

      {/* Hub ornament rings */}
      <circle cx={cx} cy={cy} r={innerR * 0.58} fill="none" stroke="rgba(255,215,0,0.45)" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={innerR * 0.28} fill="rgba(255,215,0,0.08)" stroke="rgba(255,215,0,0.55)" strokeWidth="1.5"/>

      {/* Center pin */}
      <circle cx={cx} cy={cy} r="7" fill="#fbbf24"/>
      <circle cx={cx} cy={cy} r="3" fill="#3d2000"/>
    </svg>
  );
}

type Phase = 'betting' | 'spinning' | 'result';

export default function BigSix() {
  const { balance, balanceRef, setBalance } = useGameWallet('BigSix');
  const [bets, setBets] = useState<Record<string, number>>({});
  const [chipValue, setChipValue] = useState(5);
  const [phase, setPhase] = useState<Phase>('betting');
  const [result, setResult] = useState<Segment | null>(null);
  const [rotation, setRotation] = useState(0);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [showWinRings, setShowWinRings] = useState(false);
  const totalBet = Object.values(bets).reduce((s, v) => s + v, 0);
  const rotRef = useRef(0);

  const placeBet = (label: string) => {
    if (phase !== 'betting') return;
    setBets(prev => ({ ...prev, [label]: (prev[label] || 0) + chipValue }));
  };

  const spin = useCallback(async () => {
    if (totalBet === 0 || balance < totalBet) return;
    setBalance(b => parseFloat((b - totalBet).toFixed(2)));
    setPhase('spinning');

    const idx = Math.floor(Math.random() * TOTAL_SLOTS);
    const winner = WHEEL_FLAT[idx];

    const segAngle = 360 / TOTAL_SLOTS;
    const targetAngle = idx * segAngle;
    const spins = 5 + Math.floor(Math.random() * 3);
    const newRotation = rotRef.current + spins * 360 + (360 - targetAngle);
    rotRef.current = newRotation;
    setRotation(newRotation);

    await new Promise(r => setTimeout(r, 3500));

    setResult(winner);
    let profit = -totalBet;
    const betAmt = bets[winner.label] || 0;
    if (betAmt > 0) {
      const win = parseFloat((betAmt * (winner.mult + 1)).toFixed(2));
      setBalance(b => parseFloat((b + win).toFixed(2)));
      profit = parseFloat((win - totalBet).toFixed(2));
    }
    setLastProfit(profit);
    setPhase('result');
    if (profit > 0) {
      setShowWinRings(true);
      setTimeout(() => setShowWinRings(false), 2200);
    }
  }, [totalBet, balance, bets]);

  const reset = () => { setPhase('betting'); setBets({}); setResult(null); setLastProfit(null); };

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
                background: 'linear-gradient(90deg, #fbbf24 0%, #f97316 40%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>BIG SIX</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>Place chips on multipliers · Spin the Big Wheel</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24', letterSpacing: 1 }}>${balance.toFixed(2)}</div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* ── LEFT PANEL ── */}
            <div className="space-y-4">

              {/* Chip value */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12, letterSpacing: 1 }}>CHIP VALUE</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {[1, 5, 10, 25].map(a => (
                    <motion.button key={a} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setChipValue(a)} disabled={phase !== 'betting'}
                      style={{
                        width: 50, height: 50, borderRadius: '50%',
                        border: `2px solid ${chipValue === a ? '#fbbf24' : 'rgba(255,255,255,0.12)'}`,
                        background: chipValue === a ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
                        color: chipValue === a ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                        fontWeight: 900, fontSize: 12, cursor: 'pointer',
                        boxShadow: chipValue === a ? '0 0 16px rgba(251,191,36,0.3)' : 'none',
                        opacity: phase !== 'betting' ? 0.5 : 1, transition: 'all 0.2s',
                      }}>
                      ${a}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Current bets */}
              {totalBet > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 10, letterSpacing: 1 }}>YOUR BETS — ${totalBet}</p>
                  {Object.entries(bets).filter(([, v]) => v > 0).map(([label, amt]) => {
                    const seg = SEGMENTS.find(s => s.label === label)!;
                    return (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: seg.textColor }}>{label}</span>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>${amt}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Result */}
              <AnimatePresence>
                {lastProfit !== null && (
                  <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                    style={{
                      borderRadius: 14, padding: '16px', textAlign: 'center',
                      background: lastProfit >= 0 ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1.5px solid ${lastProfit >= 0 ? 'rgba(251,191,36,0.45)' : 'rgba(239,68,68,0.4)'}`,
                    }}>
                    {result && <p style={{ fontSize: 12, color: result.textColor, marginBottom: 4, fontWeight: 700 }}>{result.label} landed!</p>}
                    <p style={{ fontSize: 28, fontWeight: 900, color: lastProfit >= 0 ? '#fbbf24' : '#ef4444' }}>
                      {lastProfit >= 0 ? '+' : ''}${lastProfit.toFixed(2)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wheel odds reference */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: 1 }}>WHEEL ODDS</p>
                {SEGMENTS.map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.textColor }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{s.count}/{TOTAL_SLOTS}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── WHEEL + BETS ── */}
            <div className="lg:col-span-3 space-y-4">

              {/* Wheel cabinet */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  borderRadius: 24,
                  background: 'linear-gradient(160deg, #070500 0%, #08060a 100%)',
                  border: '2px solid rgba(251,191,36,0.22)',
                  boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(251,191,36,0.1)',
                  overflow: 'hidden',
                }}>

                {/* Gold marquee */}
                <div style={{
                  background: 'linear-gradient(90deg, #451a00, #92400e, #d97706, #92400e, #451a00)',
                  padding: '13px 0', textAlign: 'center',
                  borderBottom: '1px solid rgba(251,191,36,0.2)',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: 7, color: '#fef08a', textShadow: '0 0 24px rgba(254,240,138,0.65)' }}>
                    ◆ BIG SIX WHEEL ◆
                  </span>
                </div>

                <div style={{ padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

                  {/* Pointer + Wheel */}
                  <div style={{ position: 'relative', width: 370, height: 370, maxWidth: '100%' }}>
                    <div style={{
                      position: 'absolute', inset: -6, borderRadius: '50%',
                      background: 'radial-gradient(ellipse, rgba(251,191,36,0.05) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }}/>
                    <div style={{
                      position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
                      width: 0, height: 0,
                      borderLeft: '14px solid transparent', borderRight: '14px solid transparent',
                      borderTop: '32px solid #fbbf24',
                      filter: 'drop-shadow(0 0 14px rgba(251,191,36,1))',
                    }}/>
                    <motion.div style={{ width: '100%', height: '100%' }}
                      animate={{ rotate: rotation }}
                      transition={{ duration: 3.5, ease: [0.15, 0.75, 0.2, 1] }}>
                      <BigSixWheelSVG />
                    </motion.div>
                  </div>

                  {/* Status */}
                  <div style={{ minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AnimatePresence mode="wait">
                      {phase === 'spinning' && (
                        <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.65 }}
                            style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, letterSpacing: 5 }}>◈  SPINNING  ◈</motion.div>
                        </motion.div>
                      )}
                      {phase === 'result' && result && (
                        <motion.div key="r"
                          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                          style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: result.mult >= 20 ? 38 : 28, fontWeight: 900,
                            color: result.textColor,
                            textShadow: `0 0 28px ${result.color}90`,
                          }}>
                            {result.label}
                          </div>
                          {lastProfit !== null && (
                            <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4, color: lastProfit >= 0 ? '#fbbf24' : '#ef4444' }}>
                              {lastProfit >= 0 ? `+$${lastProfit.toFixed(2)}` : `−$${Math.abs(lastProfit).toFixed(2)}`}
                            </div>
                          )}
                        </motion.div>
                      )}
                      {phase === 'betting' && (
                        <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ color: 'rgba(255,255,255,0.22)', fontSize: 12, letterSpacing: 1 }}>
                          Click the tiles below to place chips
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* Bet tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {SEGMENTS.map(seg => {
                  const betAmt = bets[seg.label] || 0;
                  const isWinner = phase === 'result' && result?.label === seg.label;
                  return (
                    <motion.button key={seg.label}
                      whileHover={phase === 'betting' ? { scale: 1.06, y: -2 } : {}}
                      whileTap={phase === 'betting' ? { scale: 0.95 } : {}}
                      onClick={() => placeBet(seg.label)}
                      disabled={phase !== 'betting'}
                      style={{
                        padding: '14px 4px', borderRadius: 14,
                        border: `2px solid ${betAmt > 0 || isWinner ? seg.color : 'rgba(255,255,255,0.08)'}`,
                        background: isWinner
                          ? `${seg.color}30`
                          : betAmt > 0
                            ? `${seg.color}18`
                            : 'rgba(255,255,255,0.03)',
                        cursor: phase !== 'betting' ? 'not-allowed' : 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        position: 'relative',
                        boxShadow: isWinner ? `0 0 28px ${seg.color}70` : betAmt > 0 ? `0 0 14px ${seg.color}30` : 'none',
                        transition: 'all 0.2s',
                        opacity: phase === 'spinning' ? 0.6 : 1,
                      }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: seg.textColor }}>{seg.label}</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{seg.mult}:1</span>
                      {betAmt > 0 && (
                        <div style={{
                          position: 'absolute', top: -10, right: -8,
                          background: '#fbbf24', color: '#000',
                          borderRadius: '50%', width: 22, height: 22,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 900,
                        }}>${betAmt}</div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                {phase === 'betting' && (
                  <>
                    <button onClick={() => setBets({})}
                      style={{ padding: '14px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      Clear
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={spin} disabled={totalBet === 0 || balance < totalBet}
                      style={{
                        flex: 1, padding: '16px 0', borderRadius: 12, border: 'none',
                        cursor: totalBet === 0 ? 'not-allowed' : 'pointer',
                        background: totalBet > 0 ? 'linear-gradient(135deg, #b45309, #fbbf24, #b45309)' : 'rgba(255,255,255,0.08)',
                        color: totalBet > 0 ? '#000' : 'rgba(255,255,255,0.3)',
                        fontWeight: 900, fontSize: 17, letterSpacing: 3,
                        boxShadow: totalBet > 0 ? '0 0 40px rgba(251,191,36,0.4)' : 'none',
                        opacity: totalBet === 0 || balance < totalBet ? 0.5 : 1,
                        transition: 'all 0.25s',
                      }}>
                      ⚡ SPIN — ${totalBet}
                    </motion.button>
                  </>
                )}
                {phase === 'result' && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={reset}
                    style={{
                      width: '100%', padding: '16px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      color: '#fff', fontWeight: 900, fontSize: 17, letterSpacing: 3,
                      boxShadow: '0 0 30px rgba(16,185,129,0.35)',
                    }}>
                    ↺  SPIN AGAIN
                  </motion.button>
                )}
                {phase === 'spinning' && (
                  <div style={{ width: '100%', padding: '16px 0', borderRadius: 12, background: 'rgba(255,255,255,0.06)', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 15, letterSpacing: 3 }}>
                    ◈  SPINNING  ◈
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <GameRules gameId="bigsix" />
    </MainLayout>
  );
}
