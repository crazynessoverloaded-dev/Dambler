import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [5, 10, 25, 50, 100];
type Phase = 'betting' | 'picking' | 'result';

const BOX_PRIZES = [10, 0, 0, 0.3, 0.5, 0.8];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const BOX_THEMES = [
  { border: '#4ade80', glow: 'rgba(22,163,74,0.4)', bg: 'rgba(255,255,255,0.0)', label: 'A' },
  { border: '#3b82f6', glow: 'rgba(59,130,246,0.4)', bg: 'rgba(59,130,246,0.08)', label: 'B' },
  { border: '#ef4444', glow: 'rgba(239,68,68,0.4)',  bg: 'rgba(239,68,68,0.08)',  label: 'C' },
  { border: '#f59e0b', glow: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.08)', label: 'D' },
  { border: '#10b981', glow: 'rgba(16,185,129,0.4)', bg: 'rgba(16,185,129,0.08)', label: 'E' },
  { border: '#ec4899', glow: 'rgba(236,72,153,0.4)', bg: 'rgba(236,72,153,0.08)', label: 'F' },
];

function StarBurst() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const dist = 60 + Math.random() * 100;
        return (
          <motion.div key={i}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              width: i % 3 === 0 ? 10 : 6, height: i % 3 === 0 ? 10 : 6,
              borderRadius: i % 4 === 0 ? 0 : '50%',
              background: i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#fde68a' : '#fff',
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: 0, scale: [0, 1.5, 0], rotate: 180,
            }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.015 }}
          />
        );
      })}
    </div>
  );
}

const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

export default function JackpotBox() {
  const { balance, balanceRef, setBalance } = useGameWallet('JackpotBox');
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState<Phase>('betting');
  const [prizes, setPrizes] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>(Array(6).fill(false));
  const [profit, setProfit] = useState(0);
  const [showBurst, setShowBurst] = useState(false);

  const startGame = () => {
    if (bet > balance) return;
    setBalance(b => +(b - bet).toFixed(2));
    setPrizes(shuffle(BOX_PRIZES));
    setChosen(null);
    setRevealed(Array(6).fill(false));
    setShowBurst(false);
    setPhase('picking');
  };

  const pickBox = (idx: number) => {
    if (phase !== 'picking' || chosen !== null) return;
    setChosen(idx);
    setRevealed(prev => { const n = [...prev]; n[idx] = true; return n; });
    setTimeout(() => {
      setRevealed(Array(6).fill(true));
      const mult = prizes[idx];
      const pay = +(bet * mult).toFixed(2);
      if (pay > 0) setBalance(b => +(b + pay).toFixed(2));
      setProfit(+(pay - bet).toFixed(2));
      if (mult === 10) setTimeout(() => setShowBurst(true), 100);
      setPhase('result');
    }, 500);
  };

  const reset = () => { setPhase('betting'); setChosen(null); setRevealed(Array(6).fill(false)); setShowBurst(false); };

  const chosenPrize = chosen !== null ? prizes[chosen] : null;
  const isJackpot = chosenPrize === 10;
  const won = chosenPrize !== null && chosenPrize > 0;

  const prizeLabel = (mult: number) => {
    if (mult === 10) return '🏆 JACKPOT!';
    if (mult === 0) return '💀 Empty';
    return `${mult}×`;
  };

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.0) 0%, rgba(245,158,11,0.10) 50%, transparent 75%)',
          pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #4ade80 0%, #f59e0b 50%, #fde68a 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Jackpot Box</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>One box holds the jackpot (10×) — choose wisely</p>
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
                        borderColor: bet === c ? '#4ade80' : 'rgba(255,255,255,0.1)',
                        background: bet === c ? 'rgba(255,255,255,0.0)' : 'rgba(255,255,255,0.04)',
                        color: bet === c ? '#4ade80' : 'rgba(255,255,255,0.5)',
                        cursor: phase !== 'betting' ? 'not-allowed' : 'pointer',
                        opacity: phase !== 'betting' ? 0.5 : 1, transition: 'all 0.15s',
                      }}>${c}</button>
                  ))}
                </div>
              </div>

              {/* Prize list */}
              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Prizes</p>
                {[{ m: 10, l: '🏆 Jackpot', c: '#f59e0b' }, { m: 0.8, l: '0.8× Prize', c: '#10b981' }, { m: 0.5, l: '0.5× Prize', c: '#3b82f6' }, { m: 0.3, l: '0.3× Prize', c: '#6366f1' }, { m: 0, l: '💀 Empty (×3)', c: '#ef4444' }].map(({ m, l, c }) => (
                  <div key={m} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, color: 'rgba(255,255,255,0.5)' }}>
                    <span>{l}</span>
                    <span style={{ color: c, fontWeight: 700 }}>{m > 0 ? `${m}×` : 'lose'}</span>
                  </div>
                ))}
              </div>

              {/* Result card */}
              <AnimatePresence>
                {phase === 'result' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{
                      borderRadius: 14, padding: '14px 0', textAlign: 'center',
                      border: `1px solid ${isJackpot ? '#f59e0b44' : won ? '#4ade8044' : '#f8717144'}`,
                      background: isJackpot ? 'rgba(245,158,11,0.15)' : won ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.1)',
                    }}>
                    <p style={{ fontSize: 28, margin: 0, fontWeight: 900, color: isJackpot ? '#f59e0b' : won ? '#4ade80' : '#f87171' }}>
                      {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${bet.toFixed(2)}`}
                    </p>
                    <p style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.4)' }}>
                      {isJackpot ? '🏆 JACKPOT!' : won ? `${chosenPrize}× prize` : 'Empty box'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {phase === 'betting' && (
                <motion.button onClick={startGame} disabled={bet > balance}
                  whileHover={{ scale: bet > balance ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                    cursor: bet > balance ? 'not-allowed' : 'pointer',
                    background: bet > balance ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #16a34a, #4ade80, #c084fc)',
                    color: bet > balance ? 'rgba(255,255,255,0.3)' : '#fff',
                    fontWeight: 900, fontSize: 14, transition: 'all 0.2s',
                    boxShadow: bet > balance ? 'none' : '0 4px 24px rgba(22,163,74,0.4)',
                  }}>OPEN — ${bet}</motion.button>
              )}
              {phase === 'result' && (
                <motion.button onClick={reset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #16a34a, #4ade80)', color: '#fff', fontWeight: 900, fontSize: 14, boxShadow: '0 4px 24px rgba(255,255,255,0.0)' }}>
                  TRY AGAIN
                </motion.button>
              )}
            </div>

            {/* Game Area */}
            <div style={{ ...panel, minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, position: 'relative' }}>

              {/* Jackpot starburst */}
              {showBurst && <StarBurst />}

              {/* Jackpot ambient glow on result */}
              {isJackpot && phase === 'result' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0.5] }} transition={{ duration: 0.5 }}
                  style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.18) 0%, transparent 60%)', pointerEvents: 'none', borderRadius: 16 }} />
              )}

              {phase === 'betting' ? (
                <div style={{ textAlign: 'center' }}>
                  <motion.div animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }} transition={{ duration: 3, repeat: Infinity }}>
                    <span style={{ fontSize: 80 }}>📦</span>
                  </motion.div>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '16px 0 8px' }}>Pick Your Box</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>6 mystery boxes — one hides the jackpot</p>
                </div>
              ) : (
                <>
                  <motion.p
                    key={phase}
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
                      color: phase === 'picking' ? 'rgba(255,255,255,0.45)' : isJackpot ? '#f59e0b' : won ? '#4ade80' : '#f87171',
                    }}>
                    {phase === 'picking' ? 'Choose a box' : isJackpot ? '🏆 JACKPOT!' : won ? '🎉 You Won!' : '💀 Empty Box!'}
                  </motion.p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {[0, 1, 2, 3, 4, 5].map(i => {
                      const theme = BOX_THEMES[i];
                      const isChosen = chosen === i;
                      const isRev = revealed[i];
                      const prize = prizes[i] ?? 0;
                      const isJP = prize === 10;
                      const canPick = phase === 'picking' && chosen === null;

                      return (
                        <motion.button key={i} onClick={() => pickBox(i)}
                          disabled={!canPick}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06, type: 'spring', stiffness: 200 }}
                          whileHover={canPick ? { scale: 1.1, y: -6 } : {}}
                          whileTap={canPick ? { scale: 0.95 } : {}}
                          style={{
                            width: 120, height: 120, borderRadius: 20,
                            border: `2px solid ${isRev ? (isJP ? '#f59e0b' : prize > 0 ? '#4ade80' : 'rgba(255,255,255,0.12)') : isChosen ? '#fff' : theme.border}`,
                            background: isRev
                              ? isJP ? 'rgba(245,158,11,0.2)' : prize > 0 ? 'rgba(255,255,255,0.0)' : 'rgba(255,255,255,0.02)'
                              : theme.bg,
                            boxShadow: isRev && isJP
                              ? '0 0 40px rgba(245,158,11,0.6), 0 8px 30px rgba(0,0,0,0.4)'
                              : canPick
                              ? `0 0 16px ${theme.glow}, 0 8px 24px rgba(0,0,0,0.4)`
                              : '0 4px 16px rgba(0,0,0,0.3)',
                            cursor: canPick ? 'pointer' : 'default',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 6, transition: 'all 0.2s',
                          }}>
                          <AnimatePresence mode="wait">
                            {isRev ? (
                              <motion.div key="revealed" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 36 }}>{isJP ? '🏆' : prize > 0 ? '💰' : '💀'}</div>
                                <div style={{ fontSize: 11, fontWeight: 900, color: isJP ? '#f59e0b' : prize > 0 ? '#4ade80' : '#f87171', marginTop: 2 }}>
                                  {prizeLabel(prize)}
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div key="hidden" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 36 }}>📦</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: theme.border, marginTop: 2 }}>{theme.label}</div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {phase === 'result' && (
                      <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        style={{
                          fontSize: 24, fontWeight: 900, padding: '12px 44px', borderRadius: 14,
                          border: `1px solid ${isJackpot ? '#f59e0b44' : won ? '#4ade8044' : '#f8717144'}`,
                          background: isJackpot ? 'rgba(245,158,11,0.15)' : won ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.1)',
                          color: isJackpot ? '#f59e0b' : won ? '#4ade80' : '#f87171',
                        }}>
                        {isJackpot ? '🏆 JACKPOT!' : won ? `💰 ${chosenPrize}× Prize!` : '💀 Empty Box'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            <div><GameRules gameId="jackpot-box" variant="side" /></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}


