import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

type Phase = 'idle' | 'countdown' | 'flying' | 'crashed';

const W = 700;
const H = 400;
const TICK_MS = 80;
const MAX_TICKS = 260;
const PAD_L = 48;
const PAD_B = 36;
const PAD_T = 20;
const PAD_R = 16;

function generateCrashPoint(): number {
  const r = Math.random();
  if (r < 0.05) return 1.0;
  return parseFloat(Math.max(1.01, 0.95 / (1 - r)).toFixed(2));
}

function multToY(mult: number, maxMult: number): number {
  const ratio = Math.min((mult - 1) / Math.max(maxMult - 1, 0.5), 1);
  return H - PAD_B - ratio * (H - PAD_B - PAD_T);
}

function tickToX(tick: number): number {
  return PAD_L + (tick / MAX_TICKS) * (W - PAD_L - PAD_R);
}

interface HistoryEntry { multiplier: number; won: boolean }

const QUICK_BETS = [5, 10, 25, 50, 100];

const BG = '#0d0d12';
const CARD = '#11111a';
const BORDER = 'rgba(255,255,255,0.07)';
const GOLD = '#f59e0b';

export default function Crash() {
  const { balance, balanceRef, setBalance } = useGameWallet('Crash');
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [multiplier, setMultiplier] = useState(1.0);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashOutMult, setCashOutMult] = useState(0);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; vx: number; vy: number; life: number }[]>([]);

  const crashPointRef  = useRef(0);
  const tickRef        = useRef(0);
  const multRef        = useRef(1.0);
  const cashedOutRef   = useRef(false);
  const betRef         = useRef(betAmount);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxMultRef     = useRef(2);
  const particleIdRef  = useRef(0);

  useEffect(() => { betRef.current = betAmount; }, [betAmount]);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  // Spawn particles from rocket tip
  const spawnParticles = useCallback((x: number, y: number) => {
    const count = 4;
    const now = Date.now();
    const newP = Array.from({ length: count }, (_, i) => ({
      id: particleIdRef.current++,
      x, y,
      vx: (Math.random() - 0.5) * 2.5,
      vy: Math.random() * 1.8 + 0.5,
      life: 1,
    }));
    setParticles(prev => [...prev.slice(-40), ...newP]);
  }, []);

  const startRound = useCallback(() => {
    if (balanceRef.current < betRef.current) return;
    setBalance(b => { const n = parseFloat((b - betRef.current).toFixed(2)); balanceRef.current = n; return n; });
    setCashedOut(false);
    cashedOutRef.current = false;
    setLastProfit(null);
    setMultiplier(1.0);
    multRef.current = 1.0;
    tickRef.current = 0;
    setPoints([{ x: tickToX(0), y: multToY(1, 2) }]);
    setParticles([]);
    maxMultRef.current = 2;
    crashPointRef.current = generateCrashPoint();
    maxMultRef.current = Math.max(2, crashPointRef.current * 1.15);

    setCountdown(3);
    setPhase('countdown');

    let cd = 3;
    const cdInterval = setInterval(() => {
      cd--;
      setCountdown(cd);
      if (cd <= 0) {
        clearInterval(cdInterval);
        setPhase('flying');
        timerRef.current = setInterval(() => {
          tickRef.current++;
          const raw = Math.pow(1.0135, tickRef.current);
          multRef.current = parseFloat(raw.toFixed(2));
          const newMult = multRef.current;

          // Auto cashout
          const ac = parseFloat(autoCashout);
          if (!cashedOutRef.current && !isNaN(ac) && ac >= 1.01 && newMult >= ac) {
            cashedOutRef.current = true;
            setCashedOut(true);
            setCashOutMult(newMult);
            const win = parseFloat((betRef.current * newMult).toFixed(2));
            const profit = parseFloat((win - betRef.current).toFixed(2));
            setBalance(b => { const n = parseFloat((b + win).toFixed(2)); balanceRef.current = n; return n; });
            setLastProfit(profit);
            setHistory(h => [{ multiplier: newMult, won: true }, ...h.slice(0, 19)]);
          }

          setMultiplier(newMult);
          const nx = tickToX(Math.min(tickRef.current, MAX_TICKS));
          const ny = multToY(newMult, maxMultRef.current);
          setPoints(prev => [...prev, { x: nx, y: ny }]);
          spawnParticles(nx, ny);

          if (newMult >= crashPointRef.current) {
            stopTimer();
            const finalMult = crashPointRef.current;
            setMultiplier(finalMult);
            setPhase('crashed');
            if (!cashedOutRef.current) {
              setLastProfit(-betRef.current);
              setHistory(h => [{ multiplier: finalMult, won: false }, ...h.slice(0, 19)]);
            }
          }
        }, TICK_MS);
      }
    }, 1000);
  }, [autoCashout, spawnParticles]);

  const cashOut = useCallback(() => {
    if (phase !== 'flying' || cashedOutRef.current) return;
    cashedOutRef.current = true;
    setCashedOut(true);
    const m = multRef.current;
    setCashOutMult(m);
    const win = parseFloat((betRef.current * m).toFixed(2));
    const profit = parseFloat((win - betRef.current).toFixed(2));
    setBalance(b => { const n = parseFloat((b + win).toFixed(2)); balanceRef.current = n; return n; });
    setLastProfit(profit);
    setHistory(h => [{ multiplier: m, won: true }, ...h.slice(0, 19)]);
  }, [phase]);

  useEffect(() => () => stopTimer(), []);

  // Decay particles
  useEffect(() => {
    if (phase !== 'flying') return;
    const iv = setInterval(() => {
      setParticles(prev => prev
        .map(p => ({ ...p, life: p.life - 0.07, x: p.x + p.vx, y: p.y + p.vy }))
        .filter(p => p.life > 0)
      );
    }, 50);
    return () => clearInterval(iv);
  }, [phase]);

  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const fillPoints = points.length > 1
    ? `${points[0].x},${H - PAD_B} ${polyPoints} ${points[points.length - 1].x},${H - PAD_B}`
    : '';

  const isBusy    = phase === 'flying' || phase === 'countdown';
  const isCrashed = phase === 'crashed';
  const isFlying  = phase === 'flying';

  const lineColor = isCrashed ? '#ef4444' : '#f59e0b';
  const glowHex   = isCrashed ? 'rgba(239,68,68,' : 'rgba(245,158,11,';

  const tip = points[points.length - 1];

  // Grid multiplier values
  const gridMults = [1, 1.5, 2, 3, 5, 10, 20].filter(v => {
    const y = multToY(v, maxMultRef.current);
    return y > PAD_T + 5 && y < H - PAD_B - 5;
  });

  return (
    <MainLayout>
      <div style={{ background: BG, minHeight: '100vh', paddingBottom: 60 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 0' }}>

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>🚀</div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -0.5, margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Crash</h1>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Cash out before the rocket crashes</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3 }}>Balance</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: GOLD, fontFamily: 'JetBrains Mono, monospace' }}>${balance.toFixed(2)}</div>
            </div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>

            {/* ── Left panel ── */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Bet controls */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Bet Amount</div>

                {/* Quick bets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, marginBottom: 10 }}>
                  {QUICK_BETS.map(a => (
                    <button key={a} onClick={() => setBetAmount(a)} disabled={isBusy}
                      style={{
                        padding: '5px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        border: betAmount === a ? '1px solid rgba(245,158,11,0.6)' : '1px solid rgba(255,255,255,0.08)',
                        background: betAmount === a ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                        color: betAmount === a ? GOLD : 'rgba(255,255,255,0.45)',
                        transition: 'all 0.15s', opacity: isBusy ? 0.4 : 1,
                      }}>
                      ${a}
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                <div style={{ position: 'relative', marginBottom: 4 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>$</span>
                  <input
                    type="number" value={betAmount} min={1}
                    onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))}
                    disabled={isBusy}
                    style={{
                      width: '100%', padding: '9px 10px 9px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', outline: 'none', boxSizing: 'border-box',
                      opacity: isBusy ? 0.4 : 1,
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 8 }}>
                  {[['½', 0.5], ['2×', 2]].map(([label, factor]) => (
                    <button key={String(label)} disabled={isBusy} onClick={() => setBetAmount(b => Math.max(1, parseFloat((b * Number(factor)).toFixed(2))))}
                      style={{
                        padding: '6px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.45)', transition: 'all 0.15s', opacity: isBusy ? 0.4 : 1,
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto cashout */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>Auto Cash Out</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" value={autoCashout} min={1.01} step={0.1}
                    onChange={e => setAutoCashout(e.target.value)}
                    placeholder="e.g. 2.00"
                    disabled={isBusy}
                    style={{
                      width: '100%', padding: '9px 32px 9px 10px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', outline: 'none', boxSizing: 'border-box',
                      opacity: isBusy ? 0.4 : 1,
                    }}
                  />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>×</span>
                </div>
              </div>

              {/* Action button */}
              <AnimatePresence mode="wait">
                {(phase === 'idle' || phase === 'crashed') && (
                  <motion.button key="bet" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    onClick={startRound} disabled={balance < betAmount}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 900,
                      background: balance < betAmount ? 'rgba(245,158,11,0.2)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                      border: '1px solid rgba(245,158,11,0.4)',
                      color: balance < betAmount ? 'rgba(255,255,255,0.3)' : '#0d0d12',
                      cursor: balance < betAmount ? 'not-allowed' : 'pointer',
                      letterSpacing: 1, fontFamily: 'Plus Jakarta Sans, sans-serif',
                      boxShadow: balance < betAmount ? 'none' : '0 4px 24px rgba(245,158,11,0.3)',
                      transition: 'all 0.2s',
                    }}>
                    {phase === 'crashed' ? 'BET AGAIN' : 'PLACE BET'}
                  </motion.button>
                )}

                {phase === 'countdown' && (
                  <motion.div key="cd" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    style={{
                      background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px',
                      textAlign: 'center',
                    }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: 1, marginBottom: 6 }}>STARTING IN</div>
                    <motion.div
                      key={countdown}
                      initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      style={{ fontSize: 44, fontWeight: 900, color: GOLD, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                      {countdown}
                    </motion.div>
                  </motion.div>
                )}

                {phase === 'flying' && (
                  <motion.button key="cashout" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    onClick={cashOut} disabled={cashedOut}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 900,
                      background: cashedOut
                        ? 'rgba(74,222,128,0.12)'
                        : 'linear-gradient(135deg, #22c55e, #16a34a)',
                      border: cashedOut ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(34,197,94,0.5)',
                      color: cashedOut ? '#4ade80' : '#fff',
                      cursor: cashedOut ? 'default' : 'pointer',
                      letterSpacing: 0.5, fontFamily: 'Plus Jakarta Sans, sans-serif',
                      boxShadow: cashedOut ? 'none' : '0 4px 24px rgba(34,197,94,0.35)',
                      transition: 'all 0.2s',
                    }}>
                    {cashedOut
                      ? `✓ Cashed @ ${cashOutMult.toFixed(2)}×`
                      : `CASH OUT  $${(betAmount * multiplier).toFixed(2)}`}
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Last result */}
              <AnimatePresence>
                {lastProfit !== null && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                    style={{
                      borderRadius: 12, padding: '12px 14px', textAlign: 'center',
                      background: lastProfit >= 0 ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${lastProfit >= 0 ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: 1, marginBottom: 4 }}>
                      {lastProfit >= 0 ? 'YOU WON' : 'YOU LOST'}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: lastProfit >= 0 ? '#4ade80' : '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>
                      {lastProfit >= 0 ? '+' : ''}${Math.abs(lastProfit).toFixed(2)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* History pills */}
              {history.length > 0 && (
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>History</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {history.slice(0, 12).map((h, i) => {
                      const color = h.multiplier >= 10 ? '#a855f7'
                        : h.multiplier >= 3 ? '#f59e0b'
                        : h.multiplier >= 2 ? '#4ade80'
                        : '#ef4444';
                      return (
                        <span key={i} style={{
                          padding: '3px 9px', borderRadius: 20, fontSize: 10.5, fontWeight: 800,
                          background: `${color}18`, border: `1px solid ${color}40`,
                          color, fontFamily: 'JetBrains Mono, monospace',
                        }}>
                          {h.multiplier.toFixed(2)}×
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── Chart panel ── */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 }}
              style={{
                background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20,
                overflow: 'hidden', position: 'relative',
                boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column',
              }}>

              {/* Multiplier overlay */}
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10,
              }}>
                <AnimatePresence mode="wait">
                  {phase === 'idle' && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.18)', letterSpacing: 1 }}>Place your bet to start</div>
                    </motion.div>
                  )}

                  {phase === 'countdown' && (
                    <motion.div key="cdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 }}>ROUND STARTING</div>
                      <motion.div
                        key={countdown}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ fontSize: 88, fontWeight: 900, color: GOLD, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1, filter: `drop-shadow(0 0 40px rgba(245,158,11,0.5))` }}>
                        {countdown}
                      </motion.div>
                    </motion.div>
                  )}

                  {(phase === 'flying' || phase === 'crashed') && (
                    <motion.div key="mult" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      style={{ textAlign: 'center' }}>
                      <motion.div
                        animate={phase === 'flying' ? { textShadow: [`0 0 40px ${glowHex}0.4)`, `0 0 80px ${glowHex}0.7)`, `0 0 40px ${glowHex}0.4)`] } : {}}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        style={{
                          fontSize: 92, fontWeight: 900, lineHeight: 1,
                          color: lineColor,
                          fontFamily: 'JetBrains Mono, monospace',
                          filter: `drop-shadow(0 0 32px ${glowHex}0.45))`,
                        }}>
                        {multiplier.toFixed(2)}×
                      </motion.div>

                      {phase === 'crashed' && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          style={{ fontSize: 18, fontWeight: 900, color: '#ef4444', letterSpacing: 4, marginTop: 8, textTransform: 'uppercase' }}>
                          Crashed!
                        </motion.div>
                      )}

                      {cashedOut && phase === 'flying' && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          style={{ fontSize: 15, fontWeight: 700, color: '#4ade80', marginTop: 8, letterSpacing: 0.5 }}>
                          ✓ Cashed out at {cashOutMult.toFixed(2)}×
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SVG chart */}
              <svg
                viewBox={`0 0 ${W} ${H}`}
                style={{ width: '100%', minHeight: 440, display: 'block' }}
                preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineColor} stopOpacity="0.28"/>
                    <stop offset="85%" stopColor={lineColor} stopOpacity="0.02"/>
                  </linearGradient>
                  <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d0d16"/>
                    <stop offset="100%" stopColor="#09090f"/>
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="10" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <clipPath id="chartArea">
                    <rect x={PAD_L} y={PAD_T} width={W - PAD_L - PAD_R} height={H - PAD_T - PAD_B}/>
                  </clipPath>
                </defs>

                {/* Background */}
                <rect width={W} height={H} fill="url(#bgGrad)"/>

                {/* Subtle grid */}
                {gridMults.map(v => {
                  const y = multToY(v, maxMultRef.current);
                  return (
                    <g key={v}>
                      <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                        stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="5,8"/>
                      <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.2)"
                        fontFamily="JetBrains Mono, monospace">{v}×</text>
                    </g>
                  );
                })}

                {/* Axis lines */}
                <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
                <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>

                {/* Area fill */}
                {points.length > 1 && (
                  <polygon points={fillPoints} fill="url(#cFill)" clipPath="url(#chartArea)"/>
                )}

                {/* Glow line */}
                {points.length > 1 && (
                  <polyline points={polyPoints} fill="none" stroke={lineColor}
                    strokeWidth="10" strokeOpacity="0.18" strokeLinecap="round" strokeLinejoin="round"
                    filter="url(#softGlow)" clipPath="url(#chartArea)"/>
                )}

                {/* Main curve */}
                {points.length > 1 && (
                  <polyline points={polyPoints} fill="none" stroke={lineColor}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    filter="url(#glow)" clipPath="url(#chartArea)"/>
                )}

                {/* Particles */}
                {particles.map(p => (
                  <circle key={p.id} cx={p.x} cy={p.y} r={2 * p.life}
                    fill={lineColor} opacity={p.life * 0.7}/>
                ))}

                {/* Rocket tip pulse rings */}
                {tip && phase === 'flying' && (
                  <>
                    <circle cx={tip.x} cy={tip.y} r="18" fill={lineColor} fillOpacity="0.07"/>
                    <circle cx={tip.x} cy={tip.y} r="10" fill={lineColor} fillOpacity="0.12"/>
                    <circle cx={tip.x} cy={tip.y} r="5" fill={lineColor} fillOpacity="0.9"
                      filter="url(#glow)"/>
                  </>
                )}
                {tip && phase === 'crashed' && (
                  <>
                    <circle cx={tip.x} cy={tip.y} r="14" fill="#ef4444" fillOpacity="0.12"/>
                    <circle cx={tip.x} cy={tip.y} r="5" fill="#ef4444" fillOpacity="0.85" filter="url(#glow)"/>
                  </>
                )}

                {/* Crash flash overlay */}
                {phase === 'crashed' && (
                  <rect width={W} height={H} fill="rgba(239,68,68,0.04)"/>
                )}
              </svg>

              {/* Bottom stats bar */}
              <div style={{
                padding: '10px 20px', borderTop: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', gap: 24,
                background: 'rgba(0,0,0,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: isFlying ? '#4ade80' : 'rgba(255,255,255,0.15)' }}/>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                    {isFlying ? 'LIVE' : isCrashed ? 'CRASHED' : 'WAITING'}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
                  Bet: <span style={{ color: GOLD, fontWeight: 700 }}>${betAmount}</span>
                </span>
                {isFlying && !cashedOut && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
                    Win: <span style={{ color: '#4ade80', fontWeight: 700 }}>${(betAmount * multiplier).toFixed(2)}</span>
                  </span>
                )}
                {cashedOut && lastProfit !== null && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>
                    +${lastProfit.toFixed(2)} at {cashOutMult.toFixed(2)}×
                  </span>
                )}
                {history.length > 0 && (
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginRight: 4 }}>LAST</span>
                    {history.slice(0, 5).map((h, i) => {
                      const c = h.multiplier >= 3 ? '#f59e0b' : h.multiplier >= 2 ? '#4ade80' : '#ef4444';
                      return (
                        <span key={i} style={{
                          fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
                          background: `${c}18`, color: c, fontFamily: 'JetBrains Mono, monospace',
                          border: `1px solid ${c}30`,
                        }}>{h.multiplier.toFixed(2)}×</span>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <GameRules gameId="crash" />
        </div>
      </div>
    </MainLayout>
  );
}
