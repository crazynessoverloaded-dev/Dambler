import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';
import { Flame } from 'lucide-react';

// P(safe) = 4/6. MULTS[n-1] = 0.99 × (3/2)^n (99% RTP at any cashout point)
const MULTS = [1.5, 2.3, 3.4, 5.1, 7.6, 11.4, 17.1, 25.6, 38.5, 57.7];

const CHIP_VALUES = [1, 5, 10, 25, 50, 100];
const CHIP_COLORS: Record<number, string> = {
  1:'#e2e8f0', 5:'#ef4444', 10:'#3b82f6', 25:'#10b981', 50:'#f59e0b', 100:'#8b5cf6',
};

const BUST_VALUES = new Set([1, 3]);

const PIP: Record<number, [number,number][]> = {
  1:[[50,50]],
  2:[[28,28],[72,72]],
  3:[[28,28],[50,50],[72,72]],
  4:[[28,28],[72,28],[28,72],[72,72]],
  5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
  6:[[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]],
};

function heatColor(rolls: number): string {
  if (rolls === 0) return 'rgba(255,255,255,0.1)';
  if (rolls <= 2)  return '#f97316';
  if (rolls <= 4)  return '#ef4444';
  return '#dc2626';
}

function heatGlow(rolls: number): string {
  if (rolls === 0) return 'none';
  if (rolls <= 2)  return '0 0 0 3px #f97316, 0 0 28px rgba(249,115,22,0.45)';
  if (rolls <= 4)  return '0 0 0 3px #ef4444, 0 0 36px rgba(239,68,68,0.55)';
  return                   '0 0 0 3px #dc2626, 0 0 48px rgba(220,38,38,0.65)';
}

function multColor(i: number): string {
  if (i < 2)  return '#f97316';
  if (i < 4)  return '#ef4444';
  if (i < 6)  return '#dc2626';
  return '#9f1239';
}

export default function HotDice() {
  const { balance, setBalance } = useGameWallet('HotDice');
  const [bet, setBet]         = useState(10);
  const [phase, setPhase]     = useState<'betting' | 'playing' | 'result'>('betting');
  const [dieValue, setDieValue] = useState(4);
  const [safeRolls, setSafeRolls] = useState(0);
  const [busted, setBusted]   = useState(false);
  const [profit, setProfit]   = useState(0);
  const [rolling, setRolling] = useState(false);
  const [rollKey, setRollKey] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [history, setHistory] = useState<{ rolls: number; profit: number; bust: boolean }[]>([]);

  const betRef       = useRef(bet);
  const safeRef      = useRef(0);

  const multFor  = (n: number) => MULTS[Math.min(n - 1, MULTS.length - 1)] ?? 57.7;
  const cashAmt  = safeRolls > 0 ? parseFloat((betRef.current * multFor(safeRolls)).toFixed(2)) : 0;
  const curMult  = safeRolls > 0 ? multFor(safeRolls) : null;
  const nextMult = multFor(safeRolls + 1);

  const startGame = () => {
    if (bet > balance) return;
    betRef.current = bet;
    safeRef.current = 0;
    setBalance(b => parseFloat((b - bet).toFixed(2)));
    setSafeRolls(0);
    setBusted(false);
    setShowOverlay(false);
    setDieValue(4);
    setPhase('playing');
  };

  const rollDie = () => {
    if (rolling || phase !== 'playing') return;
    setRolling(true);
    setRollKey(k => k + 1);

    setTimeout(() => {
      const val = Math.floor(Math.random() * 6) + 1;
      setDieValue(val);
      if (BUST_VALUES.has(val)) {
        setBusted(true);
        setProfit(-betRef.current);
        setHistory(h => [{ rolls: safeRef.current, profit: -betRef.current, bust: true }, ...h.slice(0, 11)]);
        setRolling(false);
        setPhase('result');
        setTimeout(() => setShowOverlay(true), 400);
      } else {
        safeRef.current += 1;
        setSafeRolls(safeRef.current);
        setRolling(false);
      }
    }, 750);
  };

  const cashOut = () => {
    if (safeRolls === 0 || phase !== 'playing' || rolling) return;
    const pay = parseFloat((betRef.current * multFor(safeRolls)).toFixed(2));
    setBalance(b => parseFloat((b + pay).toFixed(2)));
    const p = parseFloat((pay - betRef.current).toFixed(2));
    setProfit(p);
    setBusted(false);
    setHistory(h => [{ rolls: safeRolls, profit: p, bust: false }, ...h.slice(0, 11)]);
    setPhase('result');
    setTimeout(() => setShowOverlay(true), 200);
  };

  const reset = () => {
    setPhase('betting');
    setSafeRolls(0);
    setBusted(false);
    setShowOverlay(false);
  };

  const isBust = busted && phase === 'result';
  const isWin  = !busted && phase === 'result';

  const pipColor = isBust ? '#ef4444'
    : phase === 'playing' && safeRolls > 0 ? heatColor(safeRolls)
    : '#1a1a2e';

  return (
    <MainLayout>
      <div style={{ background: '#0d0d12', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

        {/* Ambient glows — intensify with heat */}
        <motion.div
          animate={{ opacity: phase === 'playing' ? 0.12 + safeRolls * 0.03 : 0.08 }}
          style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 900, height: 550, background: 'radial-gradient(ellipse, #f97316 0%, transparent 65%)', pointerEvents: 'none' }} />
        <motion.div
          animate={{ opacity: phase === 'playing' && safeRolls > 3 ? 0.1 : 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'absolute', top: 200, left: '20%', width: 500, height: 400, background: 'radial-gradient(ellipse, #dc2626 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', padding: '3px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20 }}>
                  🔥 Risk Game
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [-5, 5, -5] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
                  <Flame style={{ width: 36, height: 36, color: '#f97316' }} />
                </motion.div>
                <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: 0, color: '#ffffff' }}>Hot Dice</h1>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '4px 0 0' }}>
                Roll safely to grow your multiplier — roll 1 or 3 and you bust
              </p>
            </div>
            <div style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Balance</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '196px 1fr 196px', gap: 16, alignItems: 'start' }}>

            {/* Left panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Chip selector */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Bet Amount</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 10 }}>
                  {CHIP_VALUES.map(v => {
                    const active = bet === v;
                    return (
                      <button key={v} onClick={() => { if (phase === 'betting') setBet(v); }}
                        disabled={phase !== 'betting'}
                        style={{
                          padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 800,
                          border: `2px solid ${active ? CHIP_COLORS[v] : 'rgba(255,255,255,0.08)'}`,
                          background: active ? `${CHIP_COLORS[v]}20` : 'rgba(255,255,255,0.03)',
                          color: active ? CHIP_COLORS[v] : 'rgba(255,255,255,0.35)',
                          cursor: phase !== 'betting' ? 'default' : 'pointer',
                          transition: 'all 0.15s', opacity: phase !== 'betting' ? 0.5 : 1,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: CHIP_COLORS[v], opacity: active ? 1 : 0.35, border: '2px dashed rgba(255,255,255,0.35)' }} />
                        ${v}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <button onClick={() => { if (phase === 'betting') setBet(p => Math.max(1, Math.floor(p / 2))); }}
                    disabled={phase !== 'betting'}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>½</button>
                  <div style={{ flex: 2, padding: '6px 0', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, fontWeight: 900, color: '#fff', textAlign: 'center' }}>${bet}</div>
                  <button onClick={() => { if (phase === 'betting') setBet(p => Math.min(balance, p * 2)); }}
                    disabled={phase !== 'betting'}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>2×</button>
                </div>
              </div>

              {/* Danger info */}
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Danger Faces</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {[1, 3].map(n => (
                    <div key={n} style={{ flex: 1, borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 0', textAlign: 'center' }}>
                      <div style={{ width: 36, height: 36, margin: '0 auto 4px', borderRadius: 8, background: 'white' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                          {(PIP[n]||[]).map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="10" fill="#ef4444" />)}
                        </svg>
                      </div>
                      <div style={{ fontSize: 10, color: '#f87171', fontWeight: 700 }}>BUST</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, textAlign: 'center' }}>
                  2 of 6 faces bust.<br />
                  <span style={{ color: '#f97316', fontWeight: 700 }}>33%</span> bust chance per roll.
                </div>
              </div>

              {/* History */}
              {history.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>History</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {history.slice(0, 6).map((h, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 8px', borderRadius: 7,
                          background: h.bust ? 'rgba(248,113,113,0.07)' : 'rgba(74,222,128,0.07)',
                        }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)' }}>{h.bust ? '💥 Bust' : `${h.rolls} rolls`}</span>
                        <span style={{ color: h.bust ? '#f87171' : '#4ade80', fontWeight: 700 }}>
                          {h.profit > 0 ? '+' : ''}${h.profit.toFixed(0)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Center: die arena */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Heat meter */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' }}>Heat Level</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: safeRolls > 0 ? heatColor(safeRolls) : 'rgba(255,255,255,0.2)' }}>
                    {safeRolls === 0 ? 'Cold' : safeRolls <= 2 ? '🔥 Warm' : safeRolls <= 4 ? '🔥🔥 Hot' : '🔥🔥🔥 Inferno'}
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${Math.min((safeRolls / MULTS.length) * 100, 100)}%` }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 120 }}
                    style={{
                      height: '100%', borderRadius: 4,
                      background: safeRolls <= 2
                        ? 'linear-gradient(90deg, #f97316, #ef4444)'
                        : 'linear-gradient(90deg, #ef4444, #dc2626, #991b1b)',
                      boxShadow: safeRolls > 0 ? `0 0 10px ${heatColor(safeRolls)}` : 'none',
                    }} />
                </div>
              </div>

              {/* Die stage */}
              <div style={{
                borderRadius: 20, overflow: 'hidden', position: 'relative',
                background: 'linear-gradient(160deg, #0f1520 0%, #0a0e18 100%)',
                border: `1px solid ${phase === 'playing' && safeRolls > 0 ? `${heatColor(safeRolls)}55` : 'rgba(255,255,255,0.08)'}`,
                transition: 'border-color 0.4s',
                padding: '40px 24px 36px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
                minHeight: 320,
              }}>
                {/* Grid texture */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.013) 40px,rgba(255,255,255,0.013) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.013) 40px,rgba(255,255,255,0.013) 41px)', pointerEvents: 'none' }} />

                {/* Heat shimmer overlay */}
                <AnimatePresence>
                  {phase === 'playing' && safeRolls > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, ${heatColor(safeRolls)}18 0%, transparent 65%)`, pointerEvents: 'none', transition: 'background 0.6s' }} />
                  )}
                </AnimatePresence>

                {/* The die */}
                <motion.div
                  key={rollKey}
                  animate={rolling ? {
                    rotate: [0, 140, 290, 450, 600, 720],
                    x: [0, -12, 14, -9, 6, 0],
                    y: [0, -16, 7, -12, 5, 0],
                    scale: [1, 1.12, 0.9, 1.08, 0.95, 1],
                  } : { rotate: 0, x: 0, y: 0, scale: 1 }}
                  transition={{ duration: 0.75, ease: 'easeOut' }}
                  style={{
                    filter: rolling
                      ? 'drop-shadow(0 0 24px rgba(249,115,22,0.8))'
                      : isBust
                      ? 'drop-shadow(0 0 24px rgba(239,68,68,0.9))'
                      : safeRolls > 0
                      ? `drop-shadow(0 0 ${8 + safeRolls * 3}px ${heatColor(safeRolls)})`
                      : 'none',
                    position: 'relative', zIndex: 1,
                  }}>
                  <div style={{
                    width: 140, height: 140, borderRadius: 26,
                    background: isBust
                      ? 'linear-gradient(145deg, #fff5f5, #fee2e2)'
                      : 'linear-gradient(145deg, #ffffff, #e0e0e0)',
                    boxShadow: isBust
                      ? '0 0 0 4px #ef4444, 0 0 0 8px rgba(239,68,68,0.2), 0 14px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.95)'
                      : phase === 'playing' && safeRolls > 0
                      ? `${heatGlow(safeRolls)}, 0 14px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.95)`
                      : '0 14px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.95)',
                    transition: 'box-shadow 0.3s, background 0.3s',
                    position: 'relative',
                  }}>
                    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                      {(PIP[dieValue]||[]).map(([cx,cy],i) => (
                        <circle key={i} cx={cx} cy={cy} r="10" fill={pipColor}
                          style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))' }} />
                      ))}
                    </svg>
                  </div>
                </motion.div>

                {/* Stats below die */}
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <AnimatePresence mode="wait">
                    {rolling ? (
                      <motion.div key="rolling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', height: 60 }}>
                        {[0,1,2].map(i => (
                          <motion.div key={i} animate={{ scale: [1, 1.6, 1], opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.16 }}
                            style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316' }} />
                        ))}
                      </motion.div>
                    ) : phase === 'playing' ? (
                      <motion.div key={`safe-${safeRolls}`} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Safe Rolls</div>
                        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, letterSpacing: -2, color: safeRolls > 0 ? heatColor(safeRolls) : 'rgba(255,255,255,0.15)' }}>{safeRolls}</div>
                        {safeRolls > 0 && (
                          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                            style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 600 }}>
                            Next bust risk: <span style={{ color: '#ef4444', fontWeight: 800 }}>33%</span>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : phase === 'result' ? (
                      <motion.div key="result" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, letterSpacing: -2, color: isBust ? '#f87171' : '#4ade80' }}>
                          {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6, fontWeight: 600 }}>
                          {isBust ? `💥 Rolled a ${dieValue} — bust after ${safeRef.current} safe roll${safeRef.current !== 1 ? 's' : ''}` : `Cashed out at ${multFor(safeRolls)}×`}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', textAlign: 'center', maxWidth: 260 }}>
                          Set your bet and start rolling.<br />Avoid <span style={{ color: '#ef4444', fontWeight: 700 }}>1</span> and <span style={{ color: '#ef4444', fontWeight: 700 }}>3</span> — cash out anytime.
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Live multiplier + cashout bar */}
              <AnimatePresence>
                {phase === 'playing' && safeRolls > 0 && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      background: `rgba(249,115,22,0.08)`, border: `1px solid rgba(249,115,22,0.25)`,
                      borderRadius: 14, padding: '14px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Current Multiplier</div>
                      <motion.div
                        key={safeRolls}
                        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                        style={{ fontSize: 36, fontWeight: 900, color: heatColor(safeRolls), lineHeight: 1 }}>
                        {curMult}×
                      </motion.div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Next safe roll</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>{nextMult}×</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {phase === 'betting' && (
                  <motion.button whileTap={bet <= balance ? { scale: 0.97 } : {}}
                    onClick={startGame} disabled={bet > balance}
                    style={{
                      width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
                      fontWeight: 900, fontSize: 16, letterSpacing: 0.5, cursor: bet > balance ? 'not-allowed' : 'pointer',
                      background: bet > balance ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #ef4444, #f97316)',
                      color: bet > balance ? 'rgba(255,255,255,0.2)' : '#fff',
                      boxShadow: bet <= balance ? '0 4px 24px rgba(249,115,22,0.35)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Flame style={{ width: 18, height: 18 }} />
                      START — ${bet}
                    </span>
                  </motion.button>
                )}
                {phase === 'playing' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button whileTap={!rolling ? { scale: 0.97 } : {}} onClick={rollDie} disabled={rolling}
                      style={{
                        flex: 1, padding: '16px 0', borderRadius: 14, border: 'none',
                        fontWeight: 900, fontSize: 15, cursor: rolling ? 'not-allowed' : 'pointer',
                        background: rolling ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #ef4444, #f97316)',
                        color: rolling ? 'rgba(255,255,255,0.2)' : '#fff',
                        boxShadow: !rolling ? '0 4px 24px rgba(249,115,22,0.35)' : 'none',
                        transition: 'all 0.2s',
                      }}>
                      {rolling ? (
                        <motion.span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}>🎲</motion.span>
                          Rolling…
                        </motion.span>
                      ) : '🎲 ROLL'}
                    </motion.button>
                    <motion.button
                      whileTap={safeRolls > 0 && !rolling ? { scale: 0.97 } : {}}
                      onClick={cashOut}
                      disabled={safeRolls === 0 || rolling}
                      animate={safeRolls > 0 && !rolling ? { boxShadow: ['0 0 0px rgba(74,222,128,0)', '0 0 16px rgba(74,222,128,0.4)', '0 0 8px rgba(74,222,128,0.2)'] } : {}}
                      transition={safeRolls > 0 && !rolling ? { duration: 1.2, repeat: Infinity } : {}}
                      style={{
                        flex: 1, padding: '16px 12px', borderRadius: 14, fontSize: 13,
                        border: '2px solid', fontWeight: 900,
                        borderColor: safeRolls > 0 && !rolling ? '#4ade80' : 'rgba(255,255,255,0.1)',
                        background: safeRolls > 0 && !rolling ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)',
                        color: safeRolls > 0 && !rolling ? '#4ade80' : 'rgba(255,255,255,0.2)',
                        cursor: safeRolls === 0 || rolling ? 'not-allowed' : 'pointer',
                        transition: 'border-color 0.2s, background 0.2s, color 0.2s',
                      }}>
                      {safeRolls > 0 ? `CASH OUT\n$${cashAmt.toFixed(2)}` : 'CASH OUT'}
                    </motion.button>
                  </div>
                )}
                {phase === 'result' && (
                  <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.97 }} onClick={reset}
                    style={{
                      width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
                      fontWeight: 900, fontSize: 16, cursor: 'pointer',
                      background: 'linear-gradient(135deg, #ef4444, #f97316)',
                      color: '#fff', boxShadow: '0 4px 24px rgba(249,115,22,0.35)',
                    }}>
                    PLAY AGAIN
                  </motion.button>
                )}
              </div>
            </div>

            {/* Right: multiplier ladder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Multiplier Ladder</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {MULTS.map((m, i) => {
                    const rollNum = i + 1;
                    const isActive = phase === 'playing' && safeRolls === rollNum;
                    const isPast   = (phase === 'playing' || phase === 'result') && safeRolls > rollNum;
                    const col = multColor(i);
                    return (
                      <motion.div
                        key={i}
                        animate={isActive ? {
                          boxShadow: [`0 0 0px ${col}00`, `0 0 14px ${col}66`, `0 0 7px ${col}33`],
                        } : {}}
                        transition={isActive ? { duration: 1, repeat: Infinity } : {}}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '7px 10px', borderRadius: 9,
                          border: `1px solid ${isActive ? col : 'transparent'}`,
                          background: isActive ? `${col}18` : isPast ? 'rgba(255,255,255,0.03)' : 'transparent',
                          transition: 'all 0.25s',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', fontSize: 8, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isActive ? col : isPast ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.06)',
                            color: isActive ? '#fff' : isPast ? '#4ade80' : 'rgba(255,255,255,0.3)',
                          }}>{isPast ? '✓' : rollNum}</div>
                          <span style={{ fontSize: 11, color: isActive ? '#fff' : isPast ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.25)', fontWeight: isActive ? 700 : 400 }}>
                            Roll {rollNum}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: isActive ? col : isPast ? 'rgba(255,255,255,0.35)' : col, opacity: isPast ? 0.5 : 1 }}>{m}×</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>${(bet * m).toFixed(0)}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Odds</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.8 }}>
                  Safe faces: <span style={{ color: '#f97316', fontWeight: 700 }}>4 of 6</span><br />
                  Bust faces: <span style={{ color: '#ef4444', fontWeight: 700 }}>2 of 6</span><br />
                  RTP: <span style={{ color: '#fff', fontWeight: 700 }}>99%</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <GameRules gameId="hot-dice" />
          </div>
        </div>

        {/* Win / Bust overlay */}
        <AnimatePresence>
          {showOverlay && phase === 'result' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 100 }}>
              {isWin && [1,2,3].map(i => (
                <motion.div key={i}
                  initial={{ scale: 0, opacity: 0.7 }}
                  animate={{ scale: 5 + i * 1.5, opacity: 0 }}
                  transition={{ duration: 1.1, delay: i * 0.13, ease: 'easeOut' }}
                  style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '2px solid #4ade80' }} />
              ))}
              {isBust && [1,2].map(i => (
                <motion.div key={i}
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ scale: 4 + i, opacity: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                  style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '2px solid #ef4444' }} />
              ))}
              <motion.div
                initial={{ scale: 0.3, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -30 }}
                transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                style={{
                  borderRadius: 24, padding: '28px 52px', textAlign: 'center',
                  background: isBust ? 'rgba(69,10,10,0.96)' : 'rgba(5,46,22,0.96)',
                  border: `2px solid ${isBust ? '#f87171' : '#4ade80'}`,
                  boxShadow: `0 0 60px ${isBust ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`,
                }}>
                {isBust && (
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.4, repeat: 2 }}
                    style={{ fontSize: 32, marginBottom: 6 }}>💥</motion.div>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: isBust ? '#f87171' : '#4ade80', marginBottom: 6 }}>
                  {isBust ? 'BUST' : '🎉 CASHED OUT'}
                </div>
                <div style={{ fontSize: 52, fontWeight: 900, color: isBust ? '#f87171' : '#4ade80', lineHeight: 1, letterSpacing: -2 }}>
                  {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                  {isBust ? `Rolled a ${dieValue} after ${safeRef.current} safe roll${safeRef.current !== 1 ? 's' : ''}` : `${safeRolls} safe roll${safeRolls !== 1 ? 's' : ''} at ${multFor(safeRolls)}×`}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
