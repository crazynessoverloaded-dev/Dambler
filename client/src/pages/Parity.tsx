import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [5, 10, 25, 50, 100];
type Pick = 'even' | 'odd' | null;
type Phase = 'betting' | 'rolling' | 'result';

const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

function NumberWheel({ value, rolling, delay }: { value: number; rolling: boolean; delay: number }) {
  return (
    <div style={{
      width: 80, height: 80, borderRadius: 16, overflow: 'hidden', position: 'relative',
      background: 'rgba(255,255,255,0.05)',
      border: `2px solid ${rolling ? 'rgba(22,163,74,0.5)' : 'rgba(255,255,255,0.12)'}`,
      boxShadow: rolling ? '0 0 20px rgba(255,255,255,0.0)' : 'none',
      transition: 'all 0.3s',
    }}>
      {/* Slot reel gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: 'linear-gradient(0deg, rgba(15,17,24,0.7) 0%, transparent 30%, transparent 70%, rgba(15,17,24,0.7) 100%)',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {rolling ? (
            <motion.div key="rolling"
              animate={{ y: [0, -10, 10, -6, 6, 0] }}
              transition={{ duration: 0.12, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 32, fontWeight: 900, color: 'rgba(22,163,74,0.7)' }}>
              {value}
            </motion.div>
          ) : (
            <motion.div key={`val-${value}`}
              initial={{ y: -30, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18, delay }}
              style={{ fontSize: 34, fontWeight: 900, color: '#fff' }}>
              {value}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SumCounter({ target, active }: { target: number; active: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  const stepRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (active && displayed !== target) {
    if (stepRef.current) clearInterval(stepRef.current);
    let current = 0;
    stepRef.current = setInterval(() => {
      current = Math.min(current + Math.ceil(target / 12), target);
      setDisplayed(current);
      if (current >= target && stepRef.current) {
        clearInterval(stepRef.current);
        stepRef.current = null;
      }
    }, 50);
  }

  return <span>{active ? displayed : 0}</span>;
}

export default function Parity() {
  const { balance, balanceRef, setBalance } = useGameWallet('Parity');
  const [bet, setBet] = useState(10);
  const [pick, setPick] = useState<Pick>(null);
  const [phase, setPhase] = useState<Phase>('betting');
  const [rollingNums, setRollingNums] = useState<number[]>([0, 0, 0, 0]);
  const [finalNums, setFinalNums] = useState<number[]>([]);
  const [sum, setSum] = useState(0);
  const [won, setWon] = useState(false);
  const [profit, setProfit] = useState(0);

  const play = () => {
    if (!pick || bet > balance || phase !== 'betting') return;
    setBalance(b => +(b - bet).toFixed(2));
    setPhase('rolling');
    setFinalNums([]);

    let tick = 0;
    const interval = setInterval(() => {
      setRollingNums([
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
      ]);
      tick++;
      if (tick >= 16) {
        clearInterval(interval);
        const nums = [
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 10),
        ];
        const total = nums.reduce((a, b) => a + b, 0);
        const parity: Pick = total % 2 === 0 ? 'even' : 'odd';
        const playerWins = pick === parity;

        setFinalNums(nums);
        setSum(total);
        setRollingNums(nums);
        setWon(playerWins);

        if (playerWins) {
          const payout = +(bet * 1.95).toFixed(2);
          setBalance(b => +(b + payout).toFixed(2));
          setProfit(+(payout - bet).toFixed(2));
        } else {
          setProfit(-bet);
        }

        setPhase('result');
      }
    }, 75);
  };

  const reset = () => {
    setPhase('betting');
    setFinalNums([]);
    setRollingNums([0, 0, 0, 0]);
    setPick(null);
    setSum(0);
  };

  const isRolling = phase === 'rolling';
  const currentNums = isRolling ? rollingNums : finalNums.length ? finalNums : rollingNums;
  const resultParity = sum % 2 === 0 ? 'even' : 'odd';
  const parityColor = resultParity === 'even' ? '#22c55e' : '#ec4899';

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500,
          background: 'transparent',
          pointerEvents: 'none' }} />

        {/* Rolling pulse glow */}
        {isRolling && (
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500,
              background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.0) 0%, transparent 60%)',
              pointerEvents: 'none' }} />
        )}

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #22c55e 0%, #ec4899 50%, #f97316 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Parity</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>Predict whether 4 random digits sum to Even or Odd — wins 1.95×</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 220px', gap: 20, alignItems: 'start' }}>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bet Amount</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                  {CHIPS.map(c => (
                    <button key={c} onClick={() => setBet(c)} disabled={phase !== 'betting'}
                      style={{
                        padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid',
                        borderColor: bet === c ? '#22c55e' : 'rgba(255,255,255,0.1)',
                        background: bet === c ? 'rgba(255,255,255,0.0)' : 'rgba(255,255,255,0.04)',
                        color: bet === c ? '#4ade80' : 'rgba(255,255,255,0.5)',
                        cursor: phase !== 'betting' ? 'not-allowed' : 'pointer',
                        opacity: phase !== 'betting' ? 0.5 : 1, transition: 'all 0.15s',
                      }}>${c}</button>
                  ))}
                </div>
              </div>

              {/* Pick EVEN / ODD */}
              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Prediction</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['even', 'odd'] as Pick[]).map(p => {
                    const c = p === 'even' ? '#22c55e' : '#ec4899';
                    const selected = pick === p;
                    return (
                      <motion.button key={p!} onClick={() => { if (phase === 'betting') setPick(p); }}
                        disabled={phase !== 'betting'}
                        whileHover={{ scale: phase !== 'betting' ? 1 : 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        style={{
                          padding: '16px 8px', borderRadius: 12, border: `1px solid ${selected ? c : 'rgba(255,255,255,0.1)'}`,
                          background: selected ? `${c}22` : 'rgba(255,255,255,0.04)',
                          color: selected ? c : 'rgba(255,255,255,0.5)',
                          cursor: phase !== 'betting' ? 'not-allowed' : 'pointer',
                          opacity: phase !== 'betting' ? 0.5 : 1,
                          fontWeight: 900, fontSize: 14, textAlign: 'center',
                          boxShadow: selected ? `0 0 20px ${c}33` : 'none',
                          transition: 'all 0.2s',
                        }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{p === 'even' ? '偶' : '奇'}</div>
                        {p!.toUpperCase()}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence>
                {phase === 'result' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{
                      borderRadius: 14, padding: '14px 0', textAlign: 'center',
                      border: `1px solid ${won ? '#4ade8044' : '#f8717144'}`,
                      background: won ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.1)',
                    }}>
                    <p style={{ fontSize: 28, margin: 0, fontWeight: 900, color: won ? '#4ade80' : '#f87171' }}>
                      {won ? `+$${profit.toFixed(2)}` : `-$${bet.toFixed(2)}`}
                    </p>
                    <p style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.4)' }}>
                      Sum {sum} → {sum % 2 === 0 ? 'EVEN' : 'ODD'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {phase === 'betting' && (
                <motion.button onClick={play} disabled={!pick || bet > balance}
                  whileHover={{ scale: !pick || bet > balance ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                    cursor: !pick || bet > balance ? 'not-allowed' : 'pointer',
                    background: !pick || bet > balance ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #15803d, #22c55e, #4ade80)',
                    color: !pick || bet > balance ? 'rgba(255,255,255,0.3)' : '#fff',
                    fontWeight: 900, fontSize: 14, transition: 'all 0.2s',
                    boxShadow: !pick || bet > balance ? 'none' : '0 4px 24px rgba(22,163,74,0.4)',
                  }}>
                  {pick ? `BET ${pick.toUpperCase()} — $${bet}` : 'PICK EVEN OR ODD'}
                </motion.button>
              )}
              {phase === 'result' && (
                <motion.button onClick={reset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #15803d, #22c55e)', color: '#fff', fontWeight: 900, fontSize: 14, boxShadow: '0 4px 24px rgba(255,255,255,0.0)' }}>
                  PLAY AGAIN
                </motion.button>
              )}

              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payout</p>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                  Correct → <span style={{ color: '#22c55e', fontWeight: 700 }}>1.95× bet</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  Wrong → <span style={{ color: '#f87171', fontWeight: 700 }}>lose bet</span>
                </div>
              </div>
            </div>

            {/* Game Arena */}
            <div style={{ ...panel, minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36, position: 'relative', overflow: 'hidden' }}>

              {/* Rolling background pulse */}
              {isRolling && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0, 0.15, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#22c55e', pointerEvents: 'none' }} />
              )}

              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>4 Random Digits</p>

              {/* Number wheels */}
              <div style={{ display: 'flex', gap: 16 }}>
                {currentNums.map((n, i) => (
                  <motion.div key={i}
                    animate={isRolling ? { y: [0, -3, 3, 0] } : { y: 0 }}
                    transition={isRolling ? { duration: 0.15, repeat: Infinity, delay: i * 0.03 } : {}}>
                    <NumberWheel value={n} rolling={isRolling} delay={i * 0.08} />
                  </motion.div>
                ))}
              </div>

              {/* Plus signs between */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: -20 }}>
                {currentNums.map((n, i) => (
                  <div key={i} style={{ width: 80, textAlign: 'center' }}>
                    {i < currentNums.length - 1 && (
                      <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)', fontWeight: 900 }}>+</span>
                    )}
                    {i === currentNums.length - 1 && (
                      <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)', fontWeight: 900 }}>=</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Sum + parity reveal */}
              <AnimatePresence mode="wait">
                {phase === 'result' && (
                  <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                    <motion.div
                      initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                      style={{ fontSize: 72, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                      {sum}
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                      style={{
                        padding: '10px 40px', borderRadius: 14, fontWeight: 900, fontSize: 22,
                        background: `${parityColor}22`,
                        border: `2px solid ${parityColor}`,
                        color: parityColor,
                        boxShadow: `0 0 30px ${parityColor}44`,
                      }}>
                      {resultParity === 'even' ? '偶 EVEN' : '奇 ODD'}
                    </motion.div>
                  </motion.div>
                )}
                {isRolling && (
                  <motion.div key="rolling" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', gap: 8 }}>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}
                        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                        transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity }} />
                    ))}
                  </motion.div>
                )}
                {phase === 'betting' && (
                  <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', margin: '0 0 8px' }}>Pick Even or Odd, then place your bet</p>
                    {pick && (
                      <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                        style={{ fontSize: 18, fontWeight: 900, color: pick === 'even' ? '#22c55e' : '#ec4899', margin: 0 }}>
                        {pick === 'even' ? '偶' : '奇'} You picked {pick.toUpperCase()}
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Win/Loss banner */}
              <AnimatePresence>
                {phase === 'result' && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 250, delay: 0.5 }}
                    style={{
                      fontSize: 26, fontWeight: 900, padding: '12px 48px', borderRadius: 14,
                      border: `1px solid ${won ? '#4ade8044' : '#f8717144'}`,
                      background: won ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                      color: won ? '#4ade80' : '#f87171',
                    }}>
                    {won ? '🎯 CORRECT!' : '❌ WRONG!'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div><GameRules gameId="parity" variant="side" /></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}


