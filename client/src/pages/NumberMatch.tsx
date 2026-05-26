import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [5, 10, 25, 50, 100];
type Phase = 'betting' | 'picking' | 'revealing' | 'result';

const PAYOUTS: Record<number, number> = { 0: 0, 1: 0.5, 2: 3, 3: 20 };

function drawHouse(): number[] {
  const pool = Array.from({ length: 9 }, (_, i) => i + 1);
  const out: number[] = [];
  while (out.length < 3) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out.sort((a, b) => a - b);
}

const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

function JackpotBurst() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: 30 }, (_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        const dist = 60 + Math.random() * 200;
        return (
          <motion.div key={i}
            style={{ position: 'absolute', fontSize: i % 3 === 0 ? 24 : 16 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: [0, 1.5, 0] }}
            transition={{ duration: 1.2, delay: i * 0.02, ease: 'easeOut' }}>
            {i % 3 === 0 ? '⭐' : i % 3 === 1 ? '✨' : '💎'}
          </motion.div>
        );
      })}
    </div>
  );
}

export default function NumberMatch() {
  const { balance, balanceRef, setBalance } = useGameWallet('NumberMatch');
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState<Phase>('betting');
  const [picks, setPicks] = useState<number[]>([]);
  const [house, setHouse] = useState<number[]>([]);
  const [revealedHouse, setRevealedHouse] = useState<boolean[]>([false, false, false]);
  const [matches, setMatches] = useState(0);
  const [profit, setProfit] = useState(0);
  const [showJackpot, setShowJackpot] = useState(false);

  const startGame = () => {
    if (bet > balance) return;
    setBalance(b => +(b - bet).toFixed(2));
    setPicks([]);
    setHouse([]);
    setRevealedHouse([false, false, false]);
    setMatches(0);
    setShowJackpot(false);
    setPhase('picking');
  };

  const togglePick = (n: number) => {
    if (phase !== 'picking') return;
    setPicks(prev => {
      if (prev.includes(n)) return prev.filter(x => x !== n);
      if (prev.length >= 3) return prev;
      return [...prev, n].sort((a, b) => a - b);
    });
  };

  const confirm = async () => {
    if (picks.length !== 3 || phase !== 'picking') return;
    const drawn = drawHouse();
    setHouse(drawn);
    setPhase('revealing');

    // Reveal house numbers one by one with delay
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 400 + i * 200));
      setRevealedHouse(prev => { const n = [...prev]; n[i] = true; return n; });
    }

    await new Promise(r => setTimeout(r, 300));
    const matched = picks.filter(p => drawn.includes(p)).length;
    setMatches(matched);
    const mult = PAYOUTS[matched];
    const pay = +(bet * mult).toFixed(2);
    if (pay > 0) setBalance(b => +(b + pay).toFixed(2));
    setProfit(+(pay - bet).toFixed(2));

    if (matched === 3) {
      setShowJackpot(true);
      setTimeout(() => setShowJackpot(false), 1800);
    }
    setPhase('result');
  };

  const reset = () => { setPhase('betting'); setPicks([]); setHouse([]); setRevealedHouse([false, false, false]); };

  const outcomeLabel = matches === 3 ? '🎯 JACKPOT!' : matches === 2 ? '🎉 2 Matches!' : matches === 1 ? '⚡ 1 Match' : '❌ No Match';
  const won = profit > 0;
  const isPartial = profit === 0 && matches === 1;
  const resultColor = matches === 3 ? '#f59e0b' : won ? '#4ade80' : matches === 1 ? '#fbbf24' : '#f87171';
  const resultBg = matches === 3 ? 'rgba(245,158,11,0.15)' : won ? 'rgba(255,255,255,0.0)' : matches === 1 ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)';
  const resultBorder = matches === 3 ? '#f59e0b44' : won ? '#4ade8044' : matches === 1 ? '#fbbf2444' : '#f8717144';

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {showJackpot && <JackpotBurst />}

        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.22) 0%, rgba(99,102,241,0.10) 50%, transparent 75%)',
          pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 50%, #4ade80 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Number Match</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>Pick 3 numbers — match the house draw to win big</p>
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
                        borderColor: bet === c ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                        background: bet === c ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.04)',
                        color: bet === c ? '#22d3ee' : 'rgba(255,255,255,0.5)',
                        cursor: phase !== 'betting' ? 'not-allowed' : 'pointer',
                        opacity: phase !== 'betting' ? 0.5 : 1, transition: 'all 0.15s',
                      }}>${c}</button>
                  ))}
                </div>
              </div>

              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payouts</p>
                {[{ m: 3, l: '3 matches', v: '20× bet', c: '#f59e0b' }, { m: 2, l: '2 matches', v: '3× bet', c: '#4ade80' }, { m: 1, l: '1 match', v: '0.5× back', c: '#fbbf24' }, { m: 0, l: '0 matches', v: 'lose bet', c: '#f87171' }].map(({ m, l, v, c }) => (
                  <div key={m} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5,
                    color: phase === 'result' && matches === m ? '#fff' : 'rgba(255,255,255,0.45)',
                    fontWeight: phase === 'result' && matches === m ? 900 : 400,
                  }}>
                    <span>{l}</span>
                    <span style={{ color: c, fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {phase === 'result' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ borderRadius: 14, padding: '14px 0', textAlign: 'center', border: `1px solid ${resultBorder}`, background: resultBg }}>
                    <p style={{ fontSize: 28, margin: 0, fontWeight: 900, color: resultColor }}>
                      {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${bet.toFixed(2)}`}
                    </p>
                    <p style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.4)' }}>{outcomeLabel}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {phase === 'betting' && (
                <motion.button onClick={startGame} disabled={bet > balance}
                  whileHover={{ scale: bet > balance ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                    cursor: bet > balance ? 'not-allowed' : 'pointer',
                    background: bet > balance ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #0e7490, #06b6d4, #22d3ee)',
                    color: bet > balance ? 'rgba(255,255,255,0.3)' : '#000',
                    fontWeight: 900, fontSize: 14, transition: 'all 0.2s',
                    boxShadow: bet > balance ? 'none' : '0 4px 24px rgba(6,182,212,0.4)',
                  }}>PLAY — ${bet}</motion.button>
              )}
              {phase === 'picking' && (
                <motion.button onClick={confirm} disabled={picks.length !== 3}
                  whileHover={{ scale: picks.length !== 3 ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                    cursor: picks.length !== 3 ? 'not-allowed' : 'pointer',
                    background: picks.length !== 3 ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #0e7490, #06b6d4)',
                    color: picks.length !== 3 ? 'rgba(255,255,255,0.3)' : '#000',
                    fontWeight: 900, fontSize: 14, transition: 'all 0.2s',
                    boxShadow: picks.length !== 3 ? 'none' : '0 4px 24px rgba(6,182,212,0.4)',
                  }}>
                  {picks.length === 3 ? 'CONFIRM PICKS' : `PICK ${3 - picks.length} MORE`}
                </motion.button>
              )}
              {phase === 'result' && (
                <motion.button onClick={reset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #0e7490, #06b6d4)', color: '#000', fontWeight: 900, fontSize: 14, boxShadow: '0 4px 24px rgba(6,182,212,0.35)' }}>
                  PLAY AGAIN
                </motion.button>
              )}
            </div>

            {/* Game Area */}
            <div style={{ ...panel, minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
              {phase === 'betting' ? (
                <div style={{ textAlign: 'center' }}>
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                    <span style={{ fontSize: 80 }}>🔢</span>
                  </motion.div>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '16px 0 8px' }}>Pick Your Numbers</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Choose 3 from 1–9 and match the house draw</p>
                </div>
              ) : (
                <>
                  {/* Status */}
                  <AnimatePresence mode="wait">
                    <motion.p key={phase}
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{
                        fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0,
                        color: phase === 'picking' ? 'rgba(255,255,255,0.45)'
                          : phase === 'revealing' ? '#06b6d4'
                          : phase === 'result' ? resultColor : '#fff',
                      }}>
                      {phase === 'picking' && `Select ${3 - picks.length} more number${3 - picks.length !== 1 ? 's' : ''}`}
                      {phase === 'revealing' && 'Drawing numbers…'}
                      {phase === 'result' && `${matches} of 3 matched — ${outcomeLabel}`}
                    </motion.p>
                  </AnimatePresence>

                  {/* Number grid (1–9) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {Array.from({ length: 9 }, (_, i) => i + 1).map(n => {
                      const isPicked = picks.includes(n);
                      const isMatch = phase === 'result' && house.includes(n) && picks.includes(n);
                      const isHouse = phase === 'result' && house.includes(n);
                      const canPick = phase === 'picking' && (isPicked || picks.length < 3);

                      return (
                        <motion.button key={n} onClick={() => togglePick(n)}
                          disabled={phase !== 'picking' || (!isPicked && picks.length >= 3)}
                          whileHover={canPick ? { scale: 1.12, y: -4 } : {}}
                          whileTap={canPick ? { scale: 0.9 } : {}}
                          animate={isMatch
                            ? { scale: [1, 1.2, 1], boxShadow: ['0 0 0px #4ade80', '0 0 30px #4ade80aa', '0 0 16px #4ade8066'] }
                            : {}
                          }
                          style={{
                            width: 68, height: 68, borderRadius: 16, fontSize: 26, fontWeight: 900,
                            border: '2px solid',
                            borderColor: isMatch ? '#4ade80' : isHouse && phase === 'result' ? '#06b6d4' : isPicked ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                            background: isMatch
                              ? 'rgba(255,255,255,0.0)'
                              : isHouse && phase === 'result' ? 'rgba(6,182,212,0.15)'
                              : isPicked ? 'rgba(6,182,212,0.2)'
                              : 'rgba(255,255,255,0.04)',
                            color: isMatch ? '#4ade80' : isHouse && phase === 'result' ? '#22d3ee' : isPicked ? '#22d3ee' : 'rgba(255,255,255,0.4)',
                            cursor: canPick ? 'pointer' : 'default',
                            boxShadow: isMatch ? '0 0 20px rgba(74,222,128,0.4)' : isPicked ? '0 0 16px rgba(6,182,212,0.3)' : 'none',
                            transition: 'all 0.2s',
                          }}>
                          {n}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Your picks indicator */}
                  {(phase === 'picking' || phase === 'result') && picks.length > 0 && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Your picks</span>
                      {picks.map(p => (
                        <div key={p} style={{
                          width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, fontWeight: 900, color: '#22d3ee',
                          background: 'rgba(6,182,212,0.15)', border: '1.5px solid rgba(6,182,212,0.5)',
                        }}>{p}</div>
                      ))}
                    </div>
                  )}

                  {/* House draw */}
                  {(phase === 'revealing' || phase === 'result') && house.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>House Drew</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {house.map((n, i) => {
                          const isM = picks.includes(n);
                          return (
                            <AnimatePresence key={n}>
                              {revealedHouse[i] && (
                                <motion.div
                                  initial={{ scale: 0, rotateY: -90, opacity: 0 }}
                                  animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                  style={{
                                    width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 22, fontWeight: 900,
                                    border: `2px solid ${isM ? '#4ade80' : 'rgba(6,182,212,0.4)'}`,
                                    background: isM ? 'rgba(255,255,255,0.0)' : 'rgba(6,182,212,0.1)',
                                    color: isM ? '#4ade80' : '#22d3ee',
                                    boxShadow: isM ? '0 0 20px rgba(74,222,128,0.5)' : '0 0 12px rgba(6,182,212,0.2)',
                                  }}>
                                  {n}
                                </motion.div>
                              )}
                              {!revealedHouse[i] && phase === 'revealing' && (
                                <motion.div
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ duration: 0.4, repeat: Infinity }}
                                  style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'rgba(255,255,255,0.2)', fontWeight: 900 }}>?</motion.div>
                              )}
                            </AnimatePresence>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Result banner */}
                  <AnimatePresence>
                    {phase === 'result' && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 250 }}
                        style={{
                          fontSize: 26, fontWeight: 900, padding: '12px 48px', borderRadius: 14,
                          border: `1px solid ${resultBorder}`, background: resultBg, color: resultColor, textAlign: 'center',
                        }}>
                        {outcomeLabel}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            <div><GameRules gameId="number-match" variant="side" /></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

