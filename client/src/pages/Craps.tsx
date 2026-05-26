import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

type Phase = 'betting' | 'point' | 'result';
type BetType = 'pass' | 'dontpass' | 'odds';
interface PlacedBets { pass: number; dontpass: number; odds: number }

function rollDice(): [number, number] {
  return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
}

const PIP_DOTS: Record<number, [number, number][]> = {
  1: [[50,50]],
  2: [[28,28],[72,72]],
  3: [[28,28],[50,50],[72,72]],
  4: [[28,28],[72,28],[28,72],[72,72]],
  5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
  6: [[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]],
};

function DiceFace({ value, size = 80 }: { value: number; size?: number }) {
  const r = Math.round(size * 0.16);
  return (
    <div style={{
      width: size, height: size, borderRadius: r,
      background: 'linear-gradient(145deg, #ffffff 0%, #e8e8e8 100%)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.9)',
      position: 'relative', flexShrink: 0,
    }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        {(PIP_DOTS[value] || []).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="10"
            fill="#1a1a2e"
            style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}
          />
        ))}
      </svg>
    </div>
  );
}

const POINTS = [4, 5, 6, 8, 9, 10];
const CHIP_VALUES = [1, 5, 10, 25, 50, 100];
const CHIP_COLORS: Record<number, string> = {
  1: '#e2e8f0', 5: '#ef4444', 10: '#3b82f6',
  25: '#10b981', 50: '#f59e0b', 100: '#8b5cf6',
};

export default function Craps() {
  const { balance, setBalance } = useGameWallet('Craps');
  const [chipValue, setChipValue] = useState(10);
  const [bets, setBets] = useState<PlacedBets>({ pass: 0, dontpass: 0, odds: 0 });
  const [phase, setPhase] = useState<Phase>('betting');
  const [dice, setDice] = useState<[number, number]>([3, 4]);
  const [point, setPoint] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [resultMsg, setResultMsg] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<{ msg: string; profit: number }[]>([]);
  const [rollCount, setRollCount] = useState(0);
  const rollKey = useRef(0);

  const totalBet = bets.pass + bets.dontpass + bets.odds;

  const addBet = (type: BetType) => {
    if (phase === 'result') return;
    if ((type === 'pass' || type === 'dontpass') && phase === 'point') return;
    if (type === 'odds' && phase !== 'point') return;
    if (balance < chipValue) return;
    setBalance(b => parseFloat((b - chipValue).toFixed(2)));
    setBets(prev => ({ ...prev, [type]: prev[type] + chipValue }));
  };

  const roll = useCallback(async () => {
    if (phase === 'betting' && bets.pass === 0 && bets.dontpass === 0) return;
    if (phase === 'point' && bets.pass === 0 && bets.dontpass === 0) return;

    rollKey.current += 1;
    setRolling(true);
    setShowResult(false);
    setRollCount(c => c + 1);

    await new Promise(r => setTimeout(r, 900));
    const [d1, d2] = rollDice();
    setDice([d1, d2]);
    const sum = d1 + d2;
    setRolling(false);

    await new Promise(r => setTimeout(r, 200));

    if (phase === 'betting') {
      if (sum === 7 || sum === 11) {
        // Pass wins: return bets.pass stake + profit; dontpass is lost (already deducted)
        const returnAmt = bets.pass * 2;
        const profit = parseFloat((bets.pass - bets.dontpass).toFixed(2));
        if (returnAmt > 0) setBalance(b => parseFloat((b + returnAmt).toFixed(2)));
        const msg = `Come-out ${sum} — Pass Line wins!`;
        setLastProfit(profit); setResultMsg(msg);
        setHistory(h => [{ msg, profit }, ...h.slice(0, 9)]);
        setBets({ pass: 0, dontpass: 0, odds: 0 });
        setShowResult(true);
        setPhase('result');
      } else if (sum === 2 || sum === 3 || sum === 12) {
        // Don't Pass wins (or pushes on 12): pass is lost
        const dpReturn = sum === 12 ? bets.dontpass : bets.dontpass * 2;
        const profit = parseFloat((dpReturn - bets.dontpass - bets.pass).toFixed(2));
        if (dpReturn > 0) setBalance(b => parseFloat((b + dpReturn).toFixed(2)));
        const msg = sum === 12 ? `Craps 12 — Don't Pass pushes` : `Craps ${sum} — Don't Pass wins!`;
        setLastProfit(profit); setResultMsg(msg);
        setHistory(h => [{ msg, profit }, ...h.slice(0, 9)]);
        setBets({ pass: 0, dontpass: 0, odds: 0 });
        setShowResult(true);
        setPhase('result');
      } else {
        setPoint(sum);
        setPhase('point');
        setResultMsg(`Point is ${sum}`);
      }
    } else if (phase === 'point' && point !== null) {
      const oddsPayouts: Record<number, number> = { 4: 2, 5: 1.5, 6: 1.2, 8: 1.2, 9: 1.5, 10: 2 };
      const oddsMult = oddsPayouts[point] || 1;

      if (sum === point) {
        // Pass + odds win; dontpass lost
        const returnAmt = bets.pass * 2 + bets.odds * (1 + oddsMult);
        const profit = parseFloat((returnAmt - bets.pass - bets.odds - bets.dontpass).toFixed(2));
        if (returnAmt > 0) setBalance(b => parseFloat((b + returnAmt).toFixed(2)));
        const msg = `Point ${sum} hit — Pass Line wins!`;
        setLastProfit(profit); setResultMsg(msg);
        setHistory(h => [{ msg, profit }, ...h.slice(0, 9)]);
        setBets({ pass: 0, dontpass: 0, odds: 0 }); setPoint(null);
        setShowResult(true); setPhase('result');
      } else if (sum === 7) {
        // Don't Pass wins; pass + odds lost
        const dpReturn = bets.dontpass * 2;
        const profit = parseFloat((dpReturn - bets.dontpass - bets.pass - bets.odds).toFixed(2));
        if (dpReturn > 0) setBalance(b => parseFloat((b + dpReturn).toFixed(2)));
        const msg = `Seven-out — Don't Pass wins`;
        setLastProfit(profit); setResultMsg(msg);
        setHistory(h => [{ msg, profit }, ...h.slice(0, 9)]);
        setBets({ pass: 0, dontpass: 0, odds: 0 }); setPoint(null);
        setShowResult(true); setPhase('result');
      } else {
        setResultMsg(`Rolled ${sum} — need ${point}, avoid 7`);
      }
    }
  }, [phase, bets, balance, point, chipValue]);

  const reset = () => {
    setPhase('betting');
    setBets({ pass: 0, dontpass: 0, odds: 0 });
    setPoint(null);
    setLastProfit(null);
    setResultMsg('');
    setShowResult(false);
    setDice([3, 4]);
  };

  const canRoll = phase === 'betting'
    ? (bets.pass > 0 || bets.dontpass > 0)
    : phase === 'point' && (bets.pass > 0 || bets.dontpass > 0);

  const sum = dice[0] + dice[1];
  const isWin = lastProfit !== null && lastProfit > 0;

  return (
    <MainLayout>
      <div style={{ background: '#0d0d12', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 200, left: '10%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', padding: '3px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20 }}>
                  🎲 Casino Classic
                </span>
              </div>
              <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: 0, color: '#ffffff' }}>Craps</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '4px 0 0' }}>Pass/Don't Pass — hit your point before the seven-out</p>
            </div>
            <div style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Balance</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 200px', gap: 18, alignItems: 'start' }}>

            {/* Left: Chip + history */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Chip selector */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Chip</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                  {CHIP_VALUES.map(v => {
                    const active = chipValue === v;
                    return (
                      <button key={v} onClick={() => setChipValue(v)}
                        style={{
                          padding: '8px 0', borderRadius: 8, border: `2px solid ${active ? CHIP_COLORS[v] : 'rgba(255,255,255,0.08)'}`,
                          background: active ? `${CHIP_COLORS[v]}22` : 'rgba(255,255,255,0.03)',
                          color: active ? CHIP_COLORS[v] : 'rgba(255,255,255,0.4)',
                          fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                        }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: CHIP_COLORS[v], opacity: active ? 1 : 0.4, border: '2px dashed rgba(255,255,255,0.4)' }} />
                        ${v}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bets summary */}
              {totalBet > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Active Bets</div>
                  {bets.pass > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Pass Line</span>
                    <span style={{ color: '#60a5fa', fontWeight: 700 }}>${bets.pass}</span>
                  </div>}
                  {bets.dontpass > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Don't Pass</span>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>${bets.dontpass}</span>
                  </div>}
                  {bets.odds > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Odds</span>
                    <span style={{ color: '#a78bfa', fontWeight: 700 }}>${bets.odds}</span>
                  </div>}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>Total</span>
                    <span style={{ color: '#fff', fontWeight: 900 }}>${totalBet}</span>
                  </div>
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>History</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {history.slice(0, 6).map((h, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', borderRadius: 6, background: h.profit >= 0 ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.07)' }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{h.msg}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: h.profit >= 0 ? '#4ade80' : '#f87171', marginLeft: 4, flexShrink: 0 }}>{h.profit >= 0 ? '+' : ''}${h.profit.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Center: Main arena */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Dice stage */}
              <div style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden',
                background: 'linear-gradient(160deg, #0f1520 0%, #0a0e18 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                minHeight: 220,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
                padding: '32px 24px',
              }}>
                {/* Subtle felt texture lines */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.012) 40px, rgba(255,255,255,0.012) 41px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.012) 40px, rgba(255,255,255,0.012) 41px)', pointerEvents: 'none' }} />

                {/* Dice */}
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', position: 'relative' }}>
                  <motion.div
                    key={`d1-${rollCount}`}
                    animate={rolling
                      ? { rotate: [0, 90, 180, 270, 360, 450, 720], x: [-8, 8, -6, 6, -3, 3, 0], y: [-4, 4, -3, 3, -2, 2, 0], scale: [1, 1.1, 0.95, 1.08, 0.97, 1.03, 1] }
                      : { rotate: 0, x: 0, y: 0, scale: 1 }
                    }
                    transition={{ duration: 0.85, ease: 'easeOut' }}
                    style={{ filter: rolling ? 'drop-shadow(0 0 16px rgba(99,102,241,0.6))' : 'none' }}
                  >
                    <DiceFace value={dice[0]} size={88} />
                  </motion.div>

                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)', fontWeight: 900, userSelect: 'none' }}
                  >+</motion.div>

                  <motion.div
                    key={`d2-${rollCount}`}
                    animate={rolling
                      ? { rotate: [0, -90, -200, -310, -420, -560, -720], x: [8, -8, 6, -6, 3, -3, 0], y: [4, -4, 3, -3, 2, -2, 0], scale: [1, 0.95, 1.1, 0.97, 1.08, 0.99, 1] }
                      : { rotate: 0, x: 0, y: 0, scale: 1 }
                    }
                    transition={{ duration: 0.85, ease: 'easeOut' }}
                    style={{ filter: rolling ? 'drop-shadow(0 0 16px rgba(245,158,11,0.6))' : 'none' }}
                  >
                    <DiceFace value={dice[1]} size={88} />
                  </motion.div>
                </div>

                {/* Sum display */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`sum-${rollCount}`}
                    initial={{ scale: 0.5, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: rolling ? 0 : 0, duration: 0.3, type: 'spring', stiffness: 300 }}
                    style={{ textAlign: 'center' }}
                  >
                    {rolling ? (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {[0,1,2].map(i => (
                          <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -2 }}>{sum}</div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Status / result message */}
                <AnimatePresence>
                  {resultMsg && !rolling && (
                    <motion.div
                      key={resultMsg}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        fontSize: 13, fontWeight: 600,
                        color: phase === 'point' && !showResult ? 'rgba(255,255,255,0.4)' : (isWin ? '#4ade80' : lastProfit !== null ? '#f87171' : 'rgba(255,255,255,0.4)'),
                        textAlign: 'center',
                      }}
                    >{resultMsg}</motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Point puck track */}
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
                  Point Numbers
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {POINTS.map(p => {
                    const isPoint = point === p;
                    return (
                      <motion.div
                        key={p}
                        animate={isPoint ? { scale: [1, 1.12, 1], boxShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 18px rgba(245,158,11,0.6)', '0 0 8px rgba(245,158,11,0.3)'] } : {}}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        style={{
                          width: 42, height: 42, borderRadius: 10,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          border: `2px solid ${isPoint ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`,
                          background: isPoint ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                          position: 'relative', transition: 'background 0.3s, border-color 0.3s',
                        }}>
                        {isPoint && (
                          <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            style={{
                              position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                              width: 16, height: 16, borderRadius: '50%',
                              background: '#f59e0b', border: '2px solid #0d0d12',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 7, fontWeight: 900, color: '#000',
                            }}>ON</motion.div>
                        )}
                        <span style={{ fontSize: 16, fontWeight: 900, color: isPoint ? '#f59e0b' : 'rgba(255,255,255,0.4)' }}>{p}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Bet buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Pass Line */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addBet('pass')}
                  disabled={phase === 'point' || phase === 'result'}
                  style={{
                    padding: '20px 14px', borderRadius: 14, border: '2px solid',
                    borderColor: bets.pass > 0 ? '#60a5fa' : 'rgba(255,255,255,0.09)',
                    background: bets.pass > 0 ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.03)',
                    color: '#fff', cursor: phase === 'point' || phase === 'result' ? 'not-allowed' : 'pointer',
                    opacity: phase === 'point' || phase === 'result' ? 0.35 : 1,
                    position: 'relative', transition: 'all 0.18s', textAlign: 'center',
                  }}>
                  <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 3, letterSpacing: 0.5 }}>PASS LINE</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>7 or 11 wins · Craps loses</div>
                  {bets.pass > 0 && <ChipBadge value={bets.pass} color="#60a5fa" />}
                </motion.button>

                {/* Don't Pass */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addBet('dontpass')}
                  disabled={phase === 'point' || phase === 'result'}
                  style={{
                    padding: '20px 14px', borderRadius: 14, border: '2px solid',
                    borderColor: bets.dontpass > 0 ? '#f87171' : 'rgba(255,255,255,0.09)',
                    background: bets.dontpass > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.03)',
                    color: '#fff', cursor: phase === 'point' || phase === 'result' ? 'not-allowed' : 'pointer',
                    opacity: phase === 'point' || phase === 'result' ? 0.35 : 1,
                    position: 'relative', transition: 'all 0.18s', textAlign: 'center',
                  }}>
                  <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 3, letterSpacing: 0.5 }}>DON'T PASS</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Craps wins · 12 pushes</div>
                  {bets.dontpass > 0 && <ChipBadge value={bets.dontpass} color="#f87171" />}
                </motion.button>
              </div>

              {/* Odds bet */}
              <AnimatePresence>
                {phase === 'point' && (
                  <motion.button
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addBet('odds')}
                    style={{
                      width: '100%', padding: '16px 14px', borderRadius: 14, border: '2px solid',
                      borderColor: bets.odds > 0 ? '#a78bfa' : 'rgba(255,255,255,0.12)',
                      background: bets.odds > 0 ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
                      color: '#fff', cursor: 'pointer', position: 'relative', transition: 'all 0.18s', textAlign: 'center',
                    }}>
                    <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 3 }}>ODDS BET on point {point}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>4/10→2:1 · 5/9→3:2 · 6/8→6:5 — no house edge</div>
                    {bets.odds > 0 && <ChipBadge value={bets.odds} color="#a78bfa" />}
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Roll / New round */}
              <div>
                {phase !== 'result' ? (
                  <motion.button
                    whileTap={canRoll && !rolling ? { scale: 0.97 } : {}}
                    onClick={roll}
                    disabled={!canRoll || rolling}
                    style={{
                      width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
                      fontWeight: 900, fontSize: 16, letterSpacing: 1,
                      cursor: !canRoll || rolling ? 'not-allowed' : 'pointer',
                      background: !canRoll || rolling
                        ? 'rgba(255,255,255,0.06)'
                        : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: !canRoll || rolling ? 'rgba(255,255,255,0.2)' : '#fff',
                      transition: 'all 0.2s',
                      boxShadow: canRoll && !rolling ? '0 4px 24px rgba(99,102,241,0.35)' : 'none',
                    }}>
                    {rolling ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}>🎲</motion.span>
                        Rolling...
                      </span>
                    ) : phase === 'betting' ? '🎲 ROLL COME-OUT' : '🎲 ROLL'}
                  </motion.button>
                ) : (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={reset}
                    style={{
                      width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
                      fontWeight: 900, fontSize: 16, letterSpacing: 1, cursor: 'pointer',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: '#fff', boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
                    }}>
                    NEW ROUND
                  </motion.button>
                )}
              </div>
            </div>

            {/* Right: Payouts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>How to Win</div>
                {[
                  { label: 'Come-out 7/11', val: 'Pass wins', color: '#60a5fa' },
                  { label: 'Come-out 2/3', val: "Don't Pass wins", color: '#f87171' },
                  { label: 'Come-out 12', val: "Push", color: 'rgba(255,255,255,0.4)' },
                  { label: 'Point phase', val: 'Hit before 7', color: '#f59e0b' },
                  { label: 'Seven-out', val: "Don't Pass wins", color: '#f87171' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>{label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Odds Payouts</div>
                {[
                  ['4 or 10', '2:1'],
                  ['5 or 9', '3:2'],
                  ['6 or 8', '6:5'],
                ].map(([pts, pay]) => (
                  <div key={pts} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Point {pts}</span>
                    <span style={{ color: '#a78bfa', fontWeight: 800 }}>{pay}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>House Edge</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                  Pass/Don't Pass: <span style={{ color: '#fff', fontWeight: 700 }}>1.41%</span><br />
                  Odds Bet: <span style={{ color: '#4ade80', fontWeight: 700 }}>0% (true odds)</span>
                </div>
              </div>
            </div>

          </div>

          <GameRules gameId="craps" />
        </div>

        {/* Win/Loss overlay */}
        <AnimatePresence>
          {showResult && lastProfit !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none', zIndex: 100,
              }}>
              {/* Burst rings */}
              {isWin && [1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0.6 }}
                  animate={{ scale: 4 + i * 1.5, opacity: 0 }}
                  transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', width: 120, height: 120, borderRadius: '50%',
                    border: `2px solid ${isWin ? '#4ade80' : '#f87171'}`,
                  }}
                />
              ))}
              <motion.div
                initial={{ scale: 0.3, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                style={{
                  background: isWin ? 'rgba(5,46,22,0.95)' : 'rgba(69,10,10,0.95)',
                  border: `2px solid ${isWin ? '#4ade80' : '#f87171'}`,
                  borderRadius: 24, padding: '28px 48px', textAlign: 'center',
                  boxShadow: `0 0 60px ${isWin ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isWin ? '#4ade80' : '#f87171', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
                  {isWin ? '🎉 WIN' : '💀 LOSE'}
                </div>
                <div style={{ fontSize: 48, fontWeight: 900, color: isWin ? '#4ade80' : '#f87171', lineHeight: 1, letterSpacing: -2 }}>
                  {lastProfit > 0 ? '+' : ''}${lastProfit.toFixed(2)}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>{resultMsg}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}

function ChipBadge({ value, color }: { value: number; color: string }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      style={{
        position: 'absolute', top: -10, right: -10,
        width: 30, height: 30, borderRadius: '50%',
        background: color, border: '2px solid #0d0d12',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 900, color: '#000',
        boxShadow: `0 2px 8px ${color}66`,
      }}>
      ${value}
    </motion.div>
  );
}
