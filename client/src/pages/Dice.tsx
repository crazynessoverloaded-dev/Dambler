import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

interface GameResult {
  id: string;
  diceResult: number;
  prediction: 'over' | 'under';
  multiplier: number;
  betAmount: number;
  profit: number;
}

// Each level targets 99% RTP: payout = 0.99 / winChance
// LOW:  75% win chance → 1.32× payout (easy wins, small payouts)
// MED:  50% win chance → 1.98× payout (coin-flip)
// HIGH: 25% win chance → 3.96× payout (hard wins, big payouts)
const RISK_CONFIG = {
  low:    { payout: 1.32, winChance: 75, overThreshold: 25,  underThreshold: 75,  label: '75% win chance' },
  medium: { payout: 1.98, winChance: 50, overThreshold: 50,  underThreshold: 50,  label: '50% win chance' },
  high:   { payout: 3.96, winChance: 25, overThreshold: 75,  underThreshold: 25,  label: '25% win chance' },
} as const;
const RISK_COLORS = { low: '#10b981', medium: '#06b6d4', high: '#f97316' };

const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

function ResultSlider({ result, rolling, prediction, threshold }: {
  result: number | null; rolling: boolean; prediction: 'over' | 'under'; threshold: number;
}) {
  const pct = result !== null ? ((result - 1) / 99) * 100 : null;
  const thresholdPct = ((threshold - 1) / 99) * 100;
  const isWin = result !== null && (
    (prediction === 'over' && result > threshold) ||
    (prediction === 'under' && result <= threshold)
  );

  const leftColor = prediction === 'under'
    ? 'linear-gradient(90deg, rgba(74,222,128,0.25), rgba(74,222,128,0.45))'
    : 'linear-gradient(90deg, rgba(239,68,68,0.25), rgba(239,68,68,0.45))';
  const rightColor = prediction === 'over'
    ? 'linear-gradient(90deg, rgba(74,222,128,0.25), rgba(74,222,128,0.45))'
    : 'linear-gradient(90deg, rgba(239,68,68,0.25), rgba(239,68,68,0.45))';

  return (
    <div style={{ width: '100%', padding: '0 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: prediction === 'under' ? '#4ade80' : '#f87171', textTransform: 'uppercase', letterSpacing: 1 }}>Under {threshold}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>{threshold}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: prediction === 'over' ? '#4ade80' : '#f87171', textTransform: 'uppercase', letterSpacing: 1 }}>Over {threshold}</span>
      </div>

      <div style={{ position: 'relative', height: 20, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: `${thresholdPct}%`, height: '100%', background: leftColor, borderRight: '2px solid rgba(255,255,255,0.15)' }} />
        <div style={{ position: 'absolute', left: `${thresholdPct}%`, top: 0, width: `${100 - thresholdPct}%`, height: '100%', background: rightColor }} />
        <div style={{ position: 'absolute', left: `${thresholdPct}%`, top: 0, width: 2, height: '100%', background: 'rgba(255,255,255,0.3)', transform: 'translateX(-50%)' }} />

        {pct !== null && !rolling && (
          <motion.div
            initial={{ left: `${thresholdPct}%` }}
            animate={{ left: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{
              position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
              width: 20, height: 20, borderRadius: '50%', zIndex: 5,
              background: isWin ? '#4ade80' : '#f87171',
              border: '3px solid #fff',
              boxShadow: `0 0 16px ${isWin ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)'}`,
            }} />
        )}

        {rolling && (
          <motion.div
            animate={{ left: ['10%', '90%', '10%'] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
              width: 20, height: 20, borderRadius: '50%', zIndex: 5,
              background: '#06b6d4', border: '3px solid #fff',
              boxShadow: '0 0 20px rgba(6,182,212,0.8)',
            }} />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {[1, 25, 50, 75, 100].map(n => (
          <span key={n} style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{n}</span>
        ))}
      </div>
    </div>
  );
}

export default function Dice() {
  const { balance, balanceRef, setBalance } = useGameWallet('Dice');
  const [betAmount, setBetAmount] = useState(10);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [prediction, setPrediction] = useState<'over' | 'under'>('over');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [autoBetCount, setAutoBetCount] = useState(0);
  const [autoBetRemaining, setAutoBetRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [displayNum, setDisplayNum] = useState<number | null>(null);

  const betAmountRef = useRef(betAmount);
  const isAutoRunningRef = useRef(false);
  const riskLevelRef = useRef(riskLevel);
  const predictionRef = useRef(prediction);
  const numberControls = useAnimation();

  useEffect(() => { betAmountRef.current = betAmount; }, [betAmount]);
  useEffect(() => { riskLevelRef.current = riskLevel; }, [riskLevel]);
  useEffect(() => { predictionRef.current = prediction; }, [prediction]);

  const config = RISK_CONFIG[riskLevel];
  const multiplier = config.payout;
  const activeThreshold = prediction === 'over' ? config.overThreshold : config.underThreshold;

  const rollDice = async () => {
    if (balanceRef.current < betAmountRef.current) return;

    setIsRolling(true);
    setDiceResult(null);
    setLastProfit(null);
    setBalance(prev => { const n = prev - betAmountRef.current; balanceRef.current = n; return n; });

    // Rapid number animation
    let rolls = 0;
    const interval = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * 100) + 1);
      rolls++;
      if (rolls > 22) {
        clearInterval(interval);
        const finalResult = Math.floor(Math.random() * 100) + 1;
        setDisplayNum(finalResult);
        setDiceResult(finalResult);

        const pred = predictionRef.current;
        const cfg = RISK_CONFIG[riskLevelRef.current];
        const isWin = (pred === 'over' && finalResult > cfg.overThreshold) || (pred === 'under' && finalResult <= cfg.underThreshold);
        const winAmount = isWin ? betAmountRef.current * cfg.payout : 0;
        const profit = winAmount - betAmountRef.current;

        setBalance(prev => { const n = prev + winAmount; balanceRef.current = n; return n; });
        setLastProfit(profit);

        setGameResults(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          diceResult: finalResult, prediction: pred,
          multiplier: cfg.payout, betAmount: betAmountRef.current, profit,
        }, ...prev].slice(0, 20));

        setIsRolling(false);
      }
    }, 55);
  };

  const handleAutoBet = async () => {
    isAutoRunningRef.current = true;
    setIsRunning(true);
    let remaining = autoBetCount;
    setAutoBetRemaining(remaining);

    while (remaining > 0 && isAutoRunningRef.current) {
      if (balanceRef.current < betAmountRef.current) break;

      setIsRolling(true);
      setDiceResult(null);
      setBalance(prev => { const n = prev - betAmountRef.current; balanceRef.current = n; return n; });

      await new Promise<void>(resolve => {
        let rolls = 0;
        const interval = setInterval(() => {
          setDisplayNum(Math.floor(Math.random() * 100) + 1);
          rolls++;
          if (rolls > 22) {
            clearInterval(interval);
            const finalResult = Math.floor(Math.random() * 100) + 1;
            setDisplayNum(finalResult);
            setDiceResult(finalResult);

            const pred = predictionRef.current;
            const cfg = RISK_CONFIG[riskLevelRef.current];
            const isWin = (pred === 'over' && finalResult > cfg.overThreshold) || (pred === 'under' && finalResult <= cfg.underThreshold);
            const winAmount = isWin ? betAmountRef.current * cfg.payout : 0;
            const profit = winAmount - betAmountRef.current;

            setBalance(prev => { const n = prev + winAmount; balanceRef.current = n; return n; });
            setLastProfit(profit);
            setGameResults(prev => [{
              id: Math.random().toString(36).substr(2, 9),
              diceResult: finalResult, prediction: pred,
              multiplier: cfg.payout, betAmount: betAmountRef.current, profit,
            }, ...prev].slice(0, 20));

            setIsRolling(false);
            resolve();
          }
        }, 55);
      });

      remaining--;
      setAutoBetRemaining(remaining);
      if (remaining > 0 && isAutoRunningRef.current) await new Promise(r => setTimeout(r, 1200));
    }

    isAutoRunningRef.current = false;
    setIsRunning(false);
    setAutoBetRemaining(0);
  };

  const handleBetNow = () => {
    if (autoBetCount > 0) { handleAutoBet(); } else { rollDice(); }
  };

  const handleStop = () => { isAutoRunningRef.current = false; };

  const won = lastProfit !== null && lastProfit > 0;
  const lost = lastProfit !== null && lastProfit < 0;

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.22) 0%, rgba(59,130,246,0.10) 50%, transparent 75%)',
          pointerEvents: 'none' }} />

        {/* Rolling pulse */}
        <AnimatePresence>
          {isRolling && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.4, 0] }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500,
                background: 'radial-gradient(ellipse at 50% 25%, rgba(6,182,212,0.12) 0%, transparent 60%)',
                pointerEvents: 'none' }} />
          )}
        </AnimatePresence>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #22c55e 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Dice Game</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>Pick a risk level and predict Over or Under — roll 1–100 and win your multiplier</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 220px', gap: 20, alignItems: 'start' }}>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Bet amount */}
              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bet Amount</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 8 }}>
                  {[1, 10, 100].map(a => (
                    <button key={a} onClick={() => setBetAmount(a)} disabled={isRolling || isRunning}
                      style={{
                        padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid',
                        borderColor: betAmount === a ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                        background: betAmount === a ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.04)',
                        color: betAmount === a ? '#22d3ee' : 'rgba(255,255,255,0.5)',
                        cursor: isRolling || isRunning ? 'not-allowed' : 'pointer',
                        opacity: isRolling || isRunning ? 0.5 : 1, transition: 'all 0.15s',
                      }}>${a}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setBetAmount(p => Math.max(1, Math.floor(p / 2)))} disabled={isRolling || isRunning}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>½</button>
                  <input type="number" value={betAmount} min={1}
                    onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))}
                    disabled={isRolling || isRunning}
                    style={{ flex: 2, padding: '7px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 900, textAlign: 'center' }} />
                  <button onClick={() => setBetAmount(p => Math.min(balance, p * 2))} disabled={isRolling || isRunning}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>2×</button>
                </div>
              </div>

              {/* Risk level */}
              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Risk Level</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(['low', 'medium', 'high'] as const).map(level => {
                    const c = RISK_COLORS[level];
                    const selected = riskLevel === level;
                    return (
                      <motion.button key={level} onClick={() => setRiskLevel(level)}
                        disabled={isRolling || isRunning}
                        whileHover={{ scale: isRolling || isRunning ? 1 : 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          padding: '10px 14px', borderRadius: 10, border: `1px solid ${selected ? c : 'rgba(255,255,255,0.1)'}`,
                          background: selected ? `${c}22` : 'rgba(255,255,255,0.04)',
                          color: selected ? c : 'rgba(255,255,255,0.45)',
                          cursor: isRolling || isRunning ? 'not-allowed' : 'pointer',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          fontWeight: 700, fontSize: 13,
                          boxShadow: selected ? `0 0 16px ${c}33` : 'none',
                          opacity: isRolling || isRunning ? 0.6 : 1, transition: 'all 0.2s',
                        }}>
                        <span style={{ textTransform: 'capitalize' }}>{level}</span>
                        <span style={{ fontWeight: 900 }}>{RISK_CONFIG[level].payout}×</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Auto bet */}
              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Auto Bet</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                  {[0, 10, 50, 100].slice(1).map(count => (
                    <button key={count} onClick={() => setAutoBetCount(autoBetCount === count ? 0 : count)}
                      disabled={isRolling || isRunning}
                      style={{
                        padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid',
                        borderColor: autoBetCount === count ? '#22c55e' : 'rgba(255,255,255,0.1)',
                        background: autoBetCount === count ? 'rgba(255,255,255,0.0)' : 'rgba(255,255,255,0.04)',
                        color: autoBetCount === count ? '#4ade80' : 'rgba(255,255,255,0.5)',
                        cursor: isRolling || isRunning ? 'not-allowed' : 'pointer',
                        opacity: isRolling || isRunning ? 0.5 : 1, transition: 'all 0.15s',
                      }}>{count}×</button>
                  ))}
                </div>
                {isRunning && autoBetRemaining > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Remaining</span>
                      <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700 }}>{autoBetRemaining}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <motion.div
                        style={{ height: '100%', background: '#22c55e', borderRadius: 2 }}
                        animate={{ width: `${((autoBetCount - autoBetRemaining) / autoBetCount) * 100}%` }}
                        transition={{ duration: 0.3 }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Result */}
              <AnimatePresence>
                {lastProfit !== null && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{
                      borderRadius: 14, padding: '14px 0', textAlign: 'center',
                      border: `1px solid ${won ? '#4ade8044' : '#f8717144'}`,
                      background: won ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.1)',
                    }}>
                    <p style={{ fontSize: 28, margin: 0, fontWeight: 900, color: won ? '#4ade80' : '#f87171' }}>
                      {won ? `+$${lastProfit.toFixed(2)}` : `-$${Math.abs(lastProfit).toFixed(2)}`}
                    </p>
                    <p style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.4)' }}>
                      {won ? `✓ ${diceResult} is ${prediction === 'over' ? 'over' : 'under'} ${activeThreshold}` : `✗ ${diceResult} — not ${prediction} ${activeThreshold}`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <motion.button onClick={handleBetNow}
                  disabled={isRolling || isRunning || balance < betAmount}
                  whileHover={{ scale: isRolling || isRunning || balance < betAmount ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                    cursor: isRolling || isRunning || balance < betAmount ? 'not-allowed' : 'pointer',
                    background: isRolling || isRunning || balance < betAmount
                      ? 'rgba(255,255,255,0.08)'
                      : prediction === 'over'
                      ? 'linear-gradient(135deg, #15803d, #22c55e, #4ade80)'
                      : 'linear-gradient(135deg, #b91c1c, #ef4444, #f87171)',
                    color: isRolling || isRunning || balance < betAmount ? 'rgba(255,255,255,0.3)' : '#fff',
                    fontWeight: 900, fontSize: 14, transition: 'all 0.2s',
                    boxShadow: isRolling || isRunning || balance < betAmount ? 'none'
                      : prediction === 'over' ? '0 4px 24px rgba(34,197,94,0.4)' : '0 4px 24px rgba(239,68,68,0.4)',
                  }}>
                  {isRunning ? `ROLLING… (${autoBetRemaining} left)` : isRolling ? 'ROLLING…' : `ROLL DICE — $${betAmount}`}
                </motion.button>
                {isRunning && (
                  <motion.button onClick={handleStop} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    STOP AUTO
                  </motion.button>
                )}
              </div>
            </div>

            {/* Main Arena */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Prediction selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {(['under', 'over'] as const).map(p => {
                  const selected = prediction === p;
                  const c = p === 'over' ? '#4ade80' : '#f87171';
                  const grad = p === 'over'
                    ? 'linear-gradient(135deg, #15803d, #22c55e)'
                    : 'linear-gradient(135deg, #b91c1c, #ef4444)';
                  return (
                    <motion.button key={p}
                      onClick={() => !isRolling && !isRunning && setPrediction(p)}
                      disabled={isRolling || isRunning}
                      whileHover={{ scale: isRolling || isRunning ? 1 : 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: '20px', borderRadius: 16, border: `2px solid ${selected ? c : 'rgba(255,255,255,0.1)'}`,
                        background: selected ? `${c}20` : 'rgba(255,255,255,0.03)',
                        color: selected ? c : 'rgba(255,255,255,0.4)',
                        cursor: isRolling || isRunning ? 'not-allowed' : 'pointer',
                        fontWeight: 900, fontSize: 18, textTransform: 'uppercase', letterSpacing: 1,
                        boxShadow: selected ? `0 0 28px ${c}44` : 'none',
                        transition: 'all 0.2s', textAlign: 'center',
                        opacity: isRolling || isRunning ? 0.7 : 1,
                      }}>
                      <div style={{ fontSize: 32, marginBottom: 6 }}>{p === 'over' ? '⬆️' : '⬇️'}</div>
                      {p.toUpperCase()} {p === 'over' ? config.overThreshold : config.underThreshold}
                      {selected && (
                        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6, color: c, opacity: 0.8 }}>
                          {multiplier}× payout
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Number display */}
              <div style={{ ...panel, minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, position: 'relative', overflow: 'hidden' }}>

                {/* Background glow */}
                <motion.div
                  animate={{ opacity: isRolling ? [0.3, 0.7, 0.3] : diceResult ? 0.5 : 0.1 }}
                  transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
                  style={{
                    position: 'absolute', width: 250, height: 250, borderRadius: '50%',
                    background: isRolling ? 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)'
                      : won ? 'radial-gradient(circle, rgba(255,255,255,0.0) 0%, transparent 70%)'
                      : lost ? 'radial-gradient(circle, rgba(248,113,113,0.12) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }} />

                {/* Main number */}
                <div style={{ position: 'relative' }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={displayNum ?? 'idle'}
                      initial={isRolling ? { opacity: 0.6 } : { scale: 0.5, opacity: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={isRolling ? { duration: 0.04 } : { type: 'spring', stiffness: 300, damping: 18 }}
                      style={{
                        fontSize: 110, fontWeight: 900, lineHeight: 1,
                        color: isRolling ? '#06b6d4'
                          : diceResult !== null && won ? '#4ade80'
                          : diceResult !== null && lost ? '#f87171'
                          : '#fff',
                        textShadow: isRolling
                          ? '0 0 40px rgba(6,182,212,0.6)'
                          : diceResult !== null && won
                          ? '0 0 40px rgba(74,222,128,0.5)'
                          : diceResult !== null && lost
                          ? '0 0 40px rgba(248,113,113,0.5)'
                          : 'none',
                        filter: isRolling ? 'blur(1px)' : 'none',
                        transition: 'color 0.3s, text-shadow 0.3s, filter 0.1s',
                        minWidth: 180, textAlign: 'center',
                      }}>
                      {displayNum ?? '?'}
                    </motion.div>
                  </AnimatePresence>

                  {/* Multiplier badge */}
                  <div style={{
                    position: 'absolute', top: 0, right: -24,
                    padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight: 900,
                    background: `${RISK_COLORS[riskLevel]}22`,
                    border: `1px solid ${RISK_COLORS[riskLevel]}66`,
                    color: RISK_COLORS[riskLevel],
                  }}>{multiplier}×</div>
                </div>

                {/* Result slider */}
                <div style={{ width: '100%', maxWidth: 440 }}>
                  <ResultSlider result={diceResult} rolling={isRolling} prediction={prediction} threshold={activeThreshold} />
                </div>

                {/* State label */}
                <AnimatePresence mode="wait">
                  {isRolling && (
                    <motion.div key="rolling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', gap: 6 }}>
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }}
                          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                          transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity }} />
                      ))}
                    </motion.div>
                  )}
                  {!isRolling && diceResult !== null && (
                    <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{
                        fontSize: 22, fontWeight: 900, padding: '10px 40px', borderRadius: 12,
                        border: `1px solid ${won ? '#4ade8044' : '#f8717144'}`,
                        background: won ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                        color: won ? '#4ade80' : '#f87171',
                      }}>
                      {won ? '✓ WIN!' : '✗ LOSS'}
                    </motion.div>
                  )}
                  {!isRolling && diceResult === null && (
                    <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                      Pick Over or Under, then roll
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Recent results strip */}
              {gameResults.length > 0 && (
                <div style={{ ...panel, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Rolls</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {gameResults.slice(0, 12).map((r, i) => (
                      <motion.div key={r.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i === 0 ? 0 : 0 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                          background: r.profit > 0 ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                          border: `1px solid ${r.profit > 0 ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                          color: r.profit > 0 ? '#4ade80' : '#f87171',
                        }}>
                        <span style={{ fontWeight: 900 }}>{r.diceResult}</span>
                        <span style={{ opacity: 0.7, fontSize: 10 }}>{r.prediction === 'over' ? '⬆' : '⬇'}</span>
                        <span>{r.profit > 0 ? '+' : ''}{r.profit.toFixed(0)}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div><GameRules gameId="dice" variant="side" /></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

