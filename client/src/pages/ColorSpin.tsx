import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [5, 10, 25, 50, 100];

type Color = 'red' | 'blue' | 'gold';

// Payouts at 97% RTP per color: payout = 0.97 / chance
// Red (50%): 1.94×, Blue (35%): 2.77×, Gold (15%): 6.47×
const COLORS = [
  { id: 'red'  as Color, label: 'RED',  emoji: '🔴', chance: 0.50, payout: 1.94, color: '#ef4444', glow: 'rgba(239,68,68,0.25)', border: 'rgba(239,68,68,0.6)', bg: 'rgba(239,68,68,0.1)'  },
  { id: 'blue' as Color, label: 'BLUE', emoji: '🔵', chance: 0.35, payout: 2.77, color: '#3b82f6', glow: 'rgba(59,130,246,0.25)',  border: 'rgba(59,130,246,0.6)',  bg: 'rgba(59,130,246,0.1)' },
  { id: 'gold' as Color, label: 'GOLD', emoji: '🟡', chance: 0.15, payout: 6.47, color: '#eab308', glow: 'rgba(234,179,8,0.25)',   border: 'rgba(234,179,8,0.6)',   bg: 'rgba(234,179,8,0.1)'  },
];

const WHEEL_SEGMENTS = [
  { color: 'red',  startAngle: 0,   endAngle: 180, fill: '#dc2626', fillLight: '#ef4444' },
  { color: 'blue', startAngle: 180, endAngle: 306, fill: '#1d4ed8', fillLight: '#3b82f6' },
  { color: 'gold', startAngle: 306, endAngle: 360, fill: '#a16207', fillLight: '#eab308' },
];

const LAND_ANGLE: Record<Color, number> = { red: 90, blue: 243, gold: 333 };

function pickColor(): Color {
  const r = Math.random();
  if (r < 0.50) return 'red';
  if (r < 0.85) return 'blue';
  return 'gold';
}

function WheelSVG() {
  const cx = 150, cy = 150, r = 138;
  return (
    <svg viewBox="0 0 300 300" className="w-full h-full">
      <defs>
        <radialGradient id="hubGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#2a2a2a"/>
          <stop offset="100%" stopColor="#0a0a0a"/>
        </radialGradient>
        <filter id="segGlow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Outer decorative ring */}
      <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"/>
      <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2"/>

      {/* Segments */}
      {WHEEL_SEGMENTS.map(seg => {
        const startRad = ((seg.startAngle - 90) * Math.PI) / 180;
        const endRad   = ((seg.endAngle   - 90) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad),   y2 = cy + r * Math.sin(endRad);
        const large = seg.endAngle - seg.startAngle > 180 ? 1 : 0;

        // Text position
        const midAngle = (seg.startAngle + seg.endAngle) / 2;
        const midRad = ((midAngle - 90) * Math.PI) / 180;
        const textR = r * 0.62;
        const tx = cx + textR * Math.cos(midRad);
        const ty = cy + textR * Math.sin(midRad);

        // Divider lines (tick marks)
        const TICK_COUNT = seg.color === 'red' ? 7 : seg.color === 'blue' ? 5 : 2;
        const tickStep = (seg.endAngle - seg.startAngle) / TICK_COUNT;

        return (
          <g key={seg.color}>
            <path
              d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`}
              fill={seg.fill} stroke="#000" strokeWidth="1.5"
            />
            {/* Lighter inner arc overlay for 3D feel */}
            <path
              d={`M${cx + r*0.28*Math.cos(startRad)},${cy + r*0.28*Math.sin(startRad)} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${cx + r*0.28*Math.cos(endRad)},${cy + r*0.28*Math.sin(endRad)}`}
              fill="none" stroke={seg.fillLight} strokeWidth="28" strokeOpacity="0.15"
            />
            {/* Tick marks */}
            {Array.from({ length: TICK_COUNT - 1 }, (_, k) => {
              const ta = seg.startAngle + (k + 1) * tickStep;
              const tRad = ((ta - 90) * Math.PI) / 180;
              return (
                <line key={k}
                  x1={cx + r * 0.7 * Math.cos(tRad)} y1={cy + r * 0.7 * Math.sin(tRad)}
                  x2={cx + r * Math.cos(tRad)}        y2={cy + r * Math.sin(tRad)}
                  stroke="#000" strokeWidth="1" opacity="0.4"
                />
              );
            })}
            {/* Label + payout grouped under one rotation so they stack correctly */}
            <g transform={`rotate(${midAngle + (midAngle > 180 ? -90 : 90)}, ${tx}, ${ty})`}>
              <text x={tx} y={ty - 9} textAnchor="middle" dominantBaseline="middle"
                fill="#fff" fontSize="19" fontWeight="900" fontFamily="system-ui" letterSpacing="2"
                style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))' }}>
                {seg.color.toUpperCase()}
              </text>
              <text x={tx} y={ty + 13} textAnchor="middle" dominantBaseline="middle"
                fill="rgba(255,255,255,0.85)" fontSize="13" fontWeight="800" fontFamily="system-ui"
                style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}>
                {seg.color === 'red' ? '1.94×' : seg.color === 'blue' ? '2.77×' : '6.47×'}
              </text>
            </g>
          </g>
        );
      })}

      {/* Outer gold ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,215,0,0.5)" strokeWidth="3"/>

      {/* Inner hub */}
      <circle cx={cx} cy={cy} r="28" fill="url(#hubGrad)" stroke="rgba(255,215,0,0.6)" strokeWidth="2"/>
      <circle cx={cx} cy={cy} r="14" fill="rgba(255,215,0,0.15)" stroke="rgba(255,215,0,0.5)" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r="5"  fill="rgba(255,215,0,0.6)"/>
    </svg>
  );
}

type Phase = 'betting' | 'spinning' | 'result';

export default function ColorSpin() {
  const { balance, balanceRef, setBalance } = useGameWallet('ColorSpin');
  const [bet, setBet] = useState(10);
  const [pick, setPick] = useState<Color | null>(null);
  const [phase, setPhase] = useState<Phase>('betting');
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Color | null>(null);
  const [profit, setProfit] = useState(0);
  const spinRef = useRef(false);

  const spin = () => {
    if (!pick || bet > balance || spinRef.current) return;
    spinRef.current = true;
    setBalance(b => +(b - bet).toFixed(2));
    setPhase('spinning');

    const landed = pickColor();
    const extraSpins = 5 * 360;
    const targetAngle = extraSpins + (360 - LAND_ANGLE[landed]);
    setRotation(prev => prev + targetAngle);

    setTimeout(() => {
      setResult(landed);
      const won = pick === landed;
      const colorData = COLORS.find(c => c.id === landed)!;
      if (won) {
        const pay = +(bet * colorData.payout).toFixed(2);
        setBalance(b => +(b + pay).toFixed(2));
        setProfit(+(pay - bet).toFixed(2));
      } else {
        setProfit(-bet);
      }
      setPhase('result');
      spinRef.current = false;
    }, 3200);
  };

  const reset = () => { setPhase('betting'); setResult(null); setPick(null); };
  const won = result !== null && pick === result;
  const resultData = result ? COLORS.find(c => c.id === result)! : null;
  const pickData = pick ? COLORS.find(c => c.id === pick)! : null;

  // Ambient color based on current pick
  const ambientColor = pickData?.glow ?? 'rgba(0,255,136,0.08)';

  return (
    <MainLayout>
      <div style={{
        background: `radial-gradient(ellipse at 50% 0%, ${ambientColor} 0%, transparent 60%)`,
        transition: 'background 0.6s ease',
        minHeight: '100vh',
      }} className="py-6 pb-12">
        <div className="max-w-5xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} className="mb-7"
            style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: 5,
                background: 'linear-gradient(90deg, #ef4444 0%, #3b82f6 40%, #eab308 75%, #ef4444 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                COLOR SPIN
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Pick a color · Spin the wheel · Hit your number</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* ── LEFT PANEL ── */}
            <div className="space-y-4">


              {/* Chip bet */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12, letterSpacing: 1 }}>BET AMOUNT</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {CHIPS.map(c => (
                    <motion.button key={c} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setBet(c)} disabled={phase === 'spinning'}
                      style={{
                        width: 50, height: 50, borderRadius: '50%', border: `2px solid ${bet === c ? '#00ff88' : 'rgba(255,255,255,0.12)'}`,
                        background: bet === c ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)',
                        color: bet === c ? '#00ff88' : 'rgba(255,255,255,0.5)',
                        fontWeight: 900, fontSize: 12, cursor: 'pointer',
                        boxShadow: bet === c ? '0 0 16px rgba(0,255,136,0.3)' : 'none',
                        opacity: phase === 'spinning' ? 0.5 : 1, transition: 'all 0.2s',
                      }}>
                      ${c}
                    </motion.button>
                  ))}
                </div>
                <p style={{ textAlign: 'center', marginTop: 10, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  Bet: <span style={{ fontWeight: 900, color: '#fff' }}>${bet}</span>
                </p>
              </div>

              {/* Color pick */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12, letterSpacing: 1 }}>PICK A COLOR</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {COLORS.map(c => {
                    const selected = pick === c.id;
                    return (
                      <motion.button key={c.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { if (phase === 'betting') setPick(c.id); }}
                        disabled={phase !== 'betting'}
                        style={{
                          padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                          border: `2px solid ${selected ? c.border : 'rgba(255,255,255,0.07)'}`,
                          background: selected ? c.bg : 'rgba(255,255,255,0.03)',
                          boxShadow: selected ? `0 0 20px ${c.glow}` : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          opacity: phase !== 'betting' ? 0.5 : 1,
                          transition: 'all 0.2s',
                        }}>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 15, fontWeight: 900, color: selected ? c.color : 'rgba(255,255,255,0.7)' }}>
                            {c.emoji} {c.label}
                          </div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                            {(c.chance * 100).toFixed(0)}% chance
                          </div>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: c.color }}>
                          {c.payout}×
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Result */}
              <AnimatePresence>
                {phase === 'result' && (
                  <motion.div initial={{ opacity: 0, scale: 0.88, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      borderRadius: 14, padding: '16px', textAlign: 'center',
                      background: won ? 'rgba(0,255,136,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1.5px solid ${won ? 'rgba(0,255,136,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    }}>
                    <motion.p animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                      style={{ fontSize: 28, fontWeight: 900, color: won ? '#00ff88' : '#ef4444' }}>
                      {won ? `+$${profit.toFixed(2)}` : `-$${bet.toFixed(2)}`}
                    </motion.p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                      Landed: <span style={{ color: resultData?.color, fontWeight: 700 }}>{resultData?.emoji} {resultData?.label}</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Spin button */}
              <motion.button
                whileHover={phase !== 'spinning' ? { scale: 1.02 } : {}}
                whileTap={phase !== 'spinning' ? { scale: 0.97 } : {}}
                onClick={phase === 'result' ? reset : spin}
                disabled={phase === 'spinning' || (phase === 'betting' && (!pick || bet > balance))}
                style={{
                  width: '100%', padding: '18px 0', borderRadius: 14, border: 'none',
                  cursor: phase === 'spinning' ? 'not-allowed' : 'pointer',
                  fontSize: 16, fontWeight: 900, letterSpacing: 3, color: '#fff',
                  background: phase === 'spinning'
                    ? 'rgba(255,255,255,0.1)'
                    : phase === 'result'
                      ? 'linear-gradient(135deg, #059669, #10b981)'
                      : pickData
                        ? `linear-gradient(135deg, ${pickData.color}cc, ${pickData.color}88)`
                        : 'rgba(255,255,255,0.1)',
                  boxShadow: phase === 'spinning' || !pickData ? 'none'
                    : phase === 'result' ? '0 0 30px rgba(16,185,129,0.35)'
                    : `0 0 30px ${pickData?.glow ?? 'transparent'}`,
                  opacity: (phase === 'betting' && (!pick || bet > balance)) ? 0.4 : 1,
                  transition: 'all 0.25s',
                }}>
                {phase === 'spinning' ? '◈  SPINNING  ◈'
                  : phase === 'result' ? '↺  SPIN AGAIN'
                  : pick ? `⚡  SPIN  —  $${bet}` : 'PICK A COLOR'}
              </motion.button>
            </div>

            {/* ── WHEEL CENTER ── */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  borderRadius: 24,
                  background: 'linear-gradient(160deg, #0e1016 0%, #080a10 100%)',
                  border: '2px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 0 80px rgba(0,0,0,0.6)',
                  overflow: 'hidden',
                }}>

                {/* Marquee */}
                <div style={{
                  background: 'linear-gradient(90deg, #1a0505, #3d0c0c, #7f1d1d, #3d0c0c, #1a0505)',
                  padding: '12px 0', textAlign: 'center',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: 6, color: '#fef08a', textShadow: '0 0 20px rgba(254,240,138,0.5)' }}>
                    ◆ COLOR SPIN ◆
                  </div>
                </div>

                {/* Wheel area */}
                <div style={{ padding: '32px 24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

                  {/* Pointer + Wheel */}
                  <div style={{ position: 'relative', width: 300, height: 300 }}>
                    {/* Fixed pointer */}
                    <div style={{
                      position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
                      width: 0, height: 0,
                      borderLeft: '11px solid transparent', borderRight: '11px solid transparent',
                      borderTop: '24px solid #00ff88',
                      filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.9))',
                    }} />
                    {/* Outer glow ring */}
                    <div style={{
                      position: 'absolute', inset: -8, borderRadius: '50%',
                      background: `radial-gradient(circle, transparent 60%, ${pickData?.glow ?? 'rgba(0,255,136,0.08)'} 100%)`,
                      transition: 'background 0.5s',
                      pointerEvents: 'none',
                    }} />
                    <motion.div style={{ width: '100%', height: '100%' }}
                      animate={{ rotate: rotation }}
                      transition={phase === 'spinning' ? { duration: 3.2, ease: [0.12, 0, 0.08, 1] } : { duration: 0 }}>
                      <WheelSVG />
                    </motion.div>
                  </div>

                  {/* Status */}
                  <div style={{ minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AnimatePresence mode="wait">
                      {phase === 'spinning' && (
                        <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}
                            style={{ color: '#4ade80', fontSize: 15, fontWeight: 700, letterSpacing: 4 }}>
                            ◈  SPINNING  ◈
                          </motion.div>
                        </motion.div>
                      )}
                      {phase === 'result' && resultData && (
                        <motion.div key="result" initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: 26, fontWeight: 900, letterSpacing: 2,
                            color: won ? '#00ff88' : '#ef4444',
                            textShadow: `0 0 24px ${won ? 'rgba(0,255,136,0.5)' : 'rgba(239,68,68,0.5)'}`,
                          }}>
                            {won ? '🎉 YOU WIN!' : '✕ MISS'}
                          </div>
                          <div style={{ fontSize: 13, color: resultData.color, marginTop: 4, fontWeight: 700 }}>
                            Landed on {resultData.emoji} {resultData.label}
                          </div>
                        </motion.div>
                      )}
                      {phase === 'betting' && (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', letterSpacing: 1 }}>
                          {pick
                            ? <span>Picked <span style={{ color: pickData?.color, fontWeight: 700 }}>{pickData?.emoji} {pickData?.label}</span> · {pickData?.payout}× payout</span>
                            : 'Select a color to get started'
                          }
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── RULES ── */}
            <div><GameRules gameId="color-spin" variant="side" /></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
