import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [1, 5, 10, 25, 50, 100];

const PROFILES = {
  low: {
    segments: [0, 1.2, 0, 1.2, 0, 1.2, 0, 1.2, 0, 1.2, 1.4, 1.5, 1.8, 2.0, 2.8, 0],
    colors:   ['#0a0315','#1e0d3d','#0a0315','#1e0d3d','#0a0315','#2d1b69','#0a0315','#2d1b69','#0a0315','#4c1d95','#4c1d95','#4c1d95','#6d28d9','#6d28d9','#7c3aed','#0a0315'],
  },
  medium: {
    segments: [0, 0, 2.0, 0, 0, 2.5, 0, 0, 3.0, 0, 0, 4.0, 0, 0, 4.0, 0],
    colors:   ['#0a0315','#0a0315','#4c1d95','#0a0315','#0a0315','#6d28d9','#0a0315','#0a0315','#7c3aed','#0a0315','#0a0315','#a855f7','#0a0315','#0a0315','#a855f7','#0a0315'],
  },
  high: {
    segments: [0, 0, 0, 0, 0, 0, 3.0, 0, 0, 0, 0, 0, 5.0, 0, 0, 7.5],
    colors:   ['#0a0315','#0a0315','#0a0315','#0a0315','#0a0315','#0a0315','#6d28d9','#0a0315','#0a0315','#0a0315','#0a0315','#0a0315','#a855f7','#0a0315','#0a0315','#fbbf24'],
  },
};

type Risk = keyof typeof PROFILES;

const CX = 175, CY = 175, R = 160;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as [number, number];
}

function sector(i: number, n: number) {
  const deg = 360 / n;
  const [x1, y1] = polar(CX, CY, R, i * deg);
  const [x2, y2] = polar(CX, CY, R, (i + 1) * deg);
  return `M ${CX},${CY} L ${x1},${y1} A ${R},${R} 0 0,1 ${x2},${y2} Z`;
}

function WheelSVG({ segments, colors }: { segments: number[]; colors: string[] }) {
  const n = segments.length;
  const segDeg = 360 / n;
  return (
    <svg viewBox="0 0 350 350" className="w-full h-full" style={{ filter: 'drop-shadow(0 6px 28px rgba(0,0,0,0.9))' }}>
      <defs>
        <radialGradient id="wg_hub" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#3a1060"/>
          <stop offset="60%" stopColor="#1e0840"/>
          <stop offset="100%" stopColor="#0a0320"/>
        </radialGradient>
      </defs>

      {/* Outer dark rim */}
      <circle cx={CX} cy={CY} r={R + 20} fill="#0d0020"/>
      <circle cx={CX} cy={CY} r={R + 17} fill="none" stroke="#2a0a50" strokeWidth="5"/>

      {/* Purple-gold decorative rings */}
      <circle cx={CX} cy={CY} r={R + 14} fill="none" stroke="rgba(168,85,247,0.85)"  strokeWidth="1.5"/>
      <circle cx={CX} cy={CY} r={R + 8}  fill="none" stroke="rgba(168,85,247,0.15)"  strokeWidth="12"/>
      <circle cx={CX} cy={CY} r={R + 3}  fill="none" stroke="rgba(168,85,247,0.8)"   strokeWidth="2.5"/>
      <circle cx={CX} cy={CY} r={R}      fill="none" stroke="rgba(0,0,0,0.6)"         strokeWidth="2"/>

      {/* Gold dot accent at each separator */}
      {segments.map((_, i) => {
        const a = (i * segDeg - 90) * Math.PI / 180;
        return (
          <circle key={i}
            cx={CX + (R + 8) * Math.cos(a)}
            cy={CY + (R + 8) * Math.sin(a)}
            r="2" fill="rgba(251,191,36,0.6)"
          />
        );
      })}

      {/* Segments */}
      {segments.map((mult, i) => {
        const midDeg = i * segDeg + segDeg / 2;
        const [tx, ty] = polar(CX, CY, R * 0.68, midDeg);
        const rot = midDeg > 90 && midDeg <= 270 ? midDeg + 180 : midDeg;
        const label = mult === 0 ? '✕' : `${mult}×`;
        const fs = label.length > 4 ? 10 : 13;
        return (
          <g key={i}>
            <path d={sector(i, n)} fill={colors[i]} stroke="rgba(0,0,0,0.65)" strokeWidth="1.5"/>
            <path d={sector(i, n)} fill="rgba(255,255,255,0.05)" stroke="none"/>
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
              fill={mult === 0 ? 'rgba(255,100,100,0.45)' : mult >= 5 ? '#fbbf24' : 'rgba(255,255,255,0.9)'}
              fontSize={fs} fontWeight="900" fontFamily="system-ui"
              transform={`rotate(${rot},${tx},${ty})`}
              style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))' }}>
              {label}
            </text>
          </g>
        );
      })}

      {/* Inner ring before hub */}
      <circle cx={CX} cy={CY} r="36" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5"/>

      {/* Hub */}
      <circle cx={CX} cy={CY} r="32" fill="url(#wg_hub)" stroke="rgba(168,85,247,0.75)" strokeWidth="2.5"/>

      {/* Hub spokes */}
      {[0, 60, 120, 180, 240, 300].map(angle => {
        const rad = angle * Math.PI / 180;
        return (
          <line key={angle}
            x1={CX} y1={CY}
            x2={CX + 26 * Math.cos(rad)} y2={CY + 26 * Math.sin(rad)}
            stroke="rgba(168,85,247,0.25)" strokeWidth="1.5"
          />
        );
      })}

      {/* Hub inner rings */}
      <circle cx={CX} cy={CY} r="18" fill="none" stroke="rgba(168,85,247,0.45)" strokeWidth="1.5"/>
      <circle cx={CX} cy={CY} r="8"  fill="rgba(168,85,247,0.12)" stroke="rgba(168,85,247,0.55)" strokeWidth="1.5"/>

      {/* Center pin */}
      <circle cx={CX} cy={CY} r="5" fill="#a855f7"/>
      <circle cx={CX} cy={CY} r="2" fill="#0a0320"/>
    </svg>
  );
}

const RISK_CONFIG = {
  low:    { label: 'Low',    desc: 'Frequent small wins',   color: '#22c55e', accent: 'rgba(34,197,94,0.12)' },
  medium: { label: 'Medium', desc: 'Balanced risk/reward',  color: '#a855f7', accent: 'rgba(168,85,247,0.12)' },
  high:   { label: 'High',   desc: 'Rare massive payouts',  color: '#ef4444', accent: 'rgba(239,68,68,0.12)' },
};

export default function WheelGame() {
  const { balance, balanceRef, setBalance } = useGameWallet('WheelGame');
  const [bet, setBet] = useState(10);
  const [risk, setRisk] = useState<Risk>('medium');
  const [spinning, setSpinning] = useState(false);
  const [displayRot, setDisplayRot] = useState(0);
  const [result, setResult] = useState<{ mult: number; profit: number } | null>(null);
  const [history, setHistory] = useState<{ mult: number; profit: number }[]>([]);
  const [showWinRings, setShowWinRings] = useState(false);
  const rotRef = useRef(0);

  const profile = PROFILES[risk];
  const n = profile.segments.length;
  const segDeg = 360 / n;
  const rc = RISK_CONFIG[risk];

  const spin = () => {
    if (spinning || bet > balance) return;
    const idx = Math.floor(Math.random() * n);
    const segCenter = idx * segDeg + segDeg / 2;
    const targetAngle = ((360 - segCenter) % 360 + 360) % 360;
    const delta = ((targetAngle - (rotRef.current % 360)) + 360) % 360 || 360;
    const newRot = rotRef.current + 5 * 360 + delta;
    rotRef.current = newRot;
    setSpinning(true);
    setResult(null);
    setDisplayRot(newRot);
    setTimeout(() => {
      const mult = profile.segments[idx];
      const profit = mult === 0 ? -bet : +(bet * (mult - 1)).toFixed(2);
      setBalance(prev => +(prev + profit).toFixed(2));
      setResult({ mult, profit });
      setHistory(prev => [{ mult, profit }, ...prev.slice(0, 9)]);
      setSpinning(false);
      if (profit > 0) {
        setShowWinRings(true);
        setTimeout(() => setShowWinRings(false), 2200);
      }
    }, 4200);
  };

  const isBigWin = result && result.mult >= 4;
  const isMegaWin = result && result.mult >= 7;

  return (
    <MainLayout>
      {/* Win rings overlay */}
      <AnimatePresence>
        {showWinRings && (
          <motion.div key="rings" initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                style={{ position: 'absolute', borderRadius: '50%', border: '3px solid rgba(168,85,247,0.8)' }}
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
                background: 'linear-gradient(90deg, #a855f7 0%, #e879f9 40%, #fbbf24 80%, #a855f7 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>WHEEL</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>Choose your risk · Spin for big multipliers</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24', letterSpacing: 1 }}>${balance.toFixed(2)}</div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* ── LEFT PANEL ── */}
            <div className="space-y-4">

              {/* Risk Level */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12, letterSpacing: 1 }}>RISK LEVEL</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(Object.entries(RISK_CONFIG) as [Risk, typeof RISK_CONFIG[Risk]][]).map(([key, cfg]) => (
                    <motion.button key={key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => !spinning && setRisk(key)} disabled={spinning}
                      style={{
                        padding: '12px 14px', borderRadius: 11, cursor: 'pointer',
                        border: `2px solid ${risk === key ? cfg.color : 'rgba(255,255,255,0.07)'}`,
                        background: risk === key ? cfg.accent : 'rgba(255,255,255,0.03)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        boxShadow: risk === key ? `0 0 18px ${cfg.color}22` : 'none',
                        opacity: spinning ? 0.5 : 1, transition: 'all 0.2s',
                      }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: risk === key ? cfg.color : 'rgba(255,255,255,0.6)' }}>{cfg.label}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{cfg.desc}</div>
                      </div>
                      {risk === key && <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }}/>}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Bet amount */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12, letterSpacing: 1 }}>BET AMOUNT</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginBottom: 12 }}>
                  {CHIPS.map(c => (
                    <motion.button key={c} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                      onClick={() => !spinning && setBet(c)}
                      style={{
                        width: 44, height: 44, borderRadius: '50%',
                        border: `2px solid ${bet === c ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                        background: bet === c ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                        color: bet === c ? '#a855f7' : 'rgba(255,255,255,0.45)',
                        fontWeight: 900, fontSize: 11, cursor: 'pointer',
                        boxShadow: bet === c ? '0 0 14px rgba(168,85,247,0.3)' : 'none',
                        transition: 'all 0.2s',
                      }}>
                      ${c}
                    </motion.button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setBet(p => Math.max(1, Math.floor(p / 2)))} disabled={spinning}
                    style={{ flex: 1, padding: '9px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>½</button>
                  <div style={{ flex: 2, padding: '9px', borderRadius: 9, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', fontWeight: 900, color: '#fff', fontSize: 14 }}>${bet}</div>
                  <button onClick={() => setBet(p => Math.min(balance, p * 2))} disabled={spinning}
                    style={{ flex: 1, padding: '9px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>2×</button>
                </div>
              </div>

              {/* Result */}
              <AnimatePresence>
                {result && !spinning && (
                  <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                    style={{
                      borderRadius: 14, padding: '16px', textAlign: 'center',
                      background: result.profit >= 0 ? 'rgba(168,85,247,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1.5px solid ${result.profit >= 0 ? 'rgba(168,85,247,0.45)' : 'rgba(239,68,68,0.4)'}`,
                    }}>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                      {result.mult === 0 ? 'No win' : `${result.mult}× multiplier`}
                    </p>
                    <motion.p animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                      style={{ fontSize: 28, fontWeight: 900, color: result.profit >= 0 ? '#a855f7' : '#ef4444' }}>
                      {result.profit >= 0 ? `+$${result.profit}` : `-$${Math.abs(result.profit)}`}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Spin button */}
              <motion.button whileHover={!spinning ? { scale: 1.02 } : {}} whileTap={!spinning ? { scale: 0.97 } : {}}
                onClick={spin} disabled={spinning || bet > balance}
                style={{
                  width: '100%', padding: '18px 0', borderRadius: 14, border: 'none',
                  cursor: spinning ? 'not-allowed' : 'pointer',
                  fontSize: 16, fontWeight: 900, letterSpacing: 3, color: spinning ? 'rgba(255,255,255,0.4)' : '#fff',
                  background: spinning ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)',
                  boxShadow: spinning ? 'none' : '0 0 40px rgba(168,85,247,0.4)',
                  opacity: bet > balance ? 0.4 : 1, transition: 'all 0.25s',
                }}>
                {spinning ? '◈  SPINNING  ◈' : `⚡  SPIN  —  $${bet}`}
              </motion.button>
            </div>

            {/* ── WHEEL ── */}
            <div className="lg:col-span-3 space-y-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  borderRadius: 24,
                  background: 'linear-gradient(160deg, #05010f 0%, #070212 100%)',
                  border: '2px solid rgba(168,85,247,0.18)',
                  boxShadow: '0 0 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(168,85,247,0.1)',
                  overflow: 'hidden',
                }}>

                {/* Marquee */}
                <div style={{
                  background: 'linear-gradient(90deg, #0a0020, #1e0840, #3b0764, #1e0840, #0a0020)',
                  padding: '13px 0', textAlign: 'center',
                  borderBottom: '1px solid rgba(168,85,247,0.2)',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: 7, color: '#e879f9', textShadow: '0 0 24px rgba(232,121,249,0.6)' }}>
                    ◆ WHEEL OF FORTUNE ◆
                  </span>
                </div>

                <div style={{ padding: '32px 24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

                  {/* Pointer + Wheel */}
                  <div style={{ position: 'relative', width: 380, height: 380 }}>
                    <div style={{
                      position: 'absolute', inset: -8, borderRadius: '50%',
                      background: 'radial-gradient(ellipse, rgba(168,85,247,0.05) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }}/>
                    <div style={{
                      position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
                      width: 0, height: 0,
                      borderLeft: '13px solid transparent', borderRight: '13px solid transparent',
                      borderTop: '30px solid #a855f7',
                      filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.95))',
                    }}/>
                    <motion.div style={{ width: '100%', height: '100%', originX: '50%', originY: '50%' }}
                      animate={{ rotate: displayRot }}
                      transition={{ duration: 4.2, ease: [0.12, 0.65, 0.1, 1.0] }}>
                      <WheelSVG segments={profile.segments} colors={profile.colors} />
                    </motion.div>
                  </div>

                  {/* Status */}
                  <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AnimatePresence mode="wait">
                      {spinning && (
                        <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.65 }}
                            style={{ color: '#a855f7', fontSize: 13, fontWeight: 700, letterSpacing: 5 }}>◈  SPINNING  ◈</motion.div>
                        </motion.div>
                      )}
                      {result && !spinning && (
                        <motion.div key="r"
                          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                          style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: isMegaWin ? 42 : isBigWin ? 34 : 26, fontWeight: 900,
                            color: result.profit >= 0 ? '#a855f7' : '#ef4444',
                            textShadow: result.profit >= 0 ? '0 0 30px rgba(168,85,247,0.6)' : '0 0 20px rgba(239,68,68,0.4)',
                            letterSpacing: 2,
                          }}>
                            {isMegaWin ? 'MEGA WIN!' : isBigWin ? 'BIG WIN!' : result.profit >= 0 ? 'WIN!' : 'NO WIN'}
                          </div>
                          {result.mult > 0 && (
                            <div style={{ color: '#fbbf24', fontSize: 14, marginTop: 4, fontWeight: 700 }}>{result.mult}× multiplier</div>
                          )}
                        </motion.div>
                      )}
                      {!spinning && !result && (
                        <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ color: 'rgba(255,255,255,0.22)', fontSize: 13, letterSpacing: 1 }}>
                          Choose your risk · Set your bet · Spin
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* History */}
              {history.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 10, letterSpacing: 1 }}>RECENT SPINS</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {history.map((h, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 800,
                          background: h.profit >= 0 ? 'rgba(168,85,247,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${h.profit >= 0 ? 'rgba(168,85,247,0.35)' : 'rgba(239,68,68,0.3)'}`,
                          color: h.profit >= 0 ? '#a855f7' : '#ef4444',
                        }}>
                        {h.mult === 0 ? '✕' : `${h.mult}×`}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <GameRules gameId="wheel" />
      </div>
    </MainLayout>
  );
}
