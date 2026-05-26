import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [1, 5, 10, 25, 50, 100];
const PAYOUTS = [0, 1, 2, 10];

const PIP: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
};

function Die({ value, size = 80, highlight = false, rolling = false }: {
  value: number; size?: number; highlight?: boolean; rolling?: boolean;
}) {
  const r = Math.round(size * 0.17);
  return (
    <motion.div
      animate={rolling
        ? { rotate: [0, 25, -25, 18, -18, 10, 0], y: [0, -14, 0, -8, 0], scale: [1, 1.08, 0.94, 1.04, 1] }
        : highlight
        ? { scale: [1, 1.06, 1] }
        : { rotate: 0, y: 0, scale: 1 }}
      transition={rolling
        ? { duration: 0.35, repeat: Infinity, ease: 'easeInOut' }
        : highlight
        ? { duration: 0.5, repeat: 2 }
        : { duration: 0.2 }}
      style={{
        width: size, height: size, borderRadius: r, position: 'relative', flexShrink: 0,
        background: highlight
          ? 'linear-gradient(145deg,#fff8e1,#fde68a)'
          : 'linear-gradient(145deg,#ffffff,#e2e8f0)',
        boxShadow: highlight
          ? `0 0 0 3px ${THEME}, 0 0 18px rgba(249,115,22,0.55), 0 8px 24px rgba(0,0,0,0.5)`
          : '0 6px 20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.9)',
        transition: 'box-shadow 0.25s',
      }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
        {(PIP[value] || []).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="10"
            fill={highlight ? THEME : '#1a1a2e'}
            style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
        ))}
      </svg>
    </motion.div>
  );
}

const THEME = '#f97316';
const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

export default function ChuckALuck() {
  const { balance, balanceRef, setBalance } = useGameWallet('ChuckALuck');
  const [bet, setBet] = useState(10);
  const [chosen, setChosen] = useState<number | null>(null);
  const [dice, setDice] = useState<[number, number, number] | null>(null);
  const [rolling, setRolling] = useState(false);
  const [phase, setPhase] = useState<'betting' | 'result'>('betting');
  const [animDice, setAnimDice] = useState<[number, number, number]>([1, 1, 1]);
  const [history, setHistory] = useState<{ chosen: number; dice: number[]; profit: number }[]>([]);
  const [lastProfit, setLastProfit] = useState<number | null>(null);

  const roll = () => {
    if (chosen === null || bet > balance || rolling) return;
    setRolling(true);

    const result: [number, number, number] = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];

    let frames = 0;
    const anim = setInterval(() => {
      setAnimDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
      frames++;
      if (frames >= 20) {
        clearInterval(anim);
        setAnimDice(result);
        setDice(result);
        const matches = result.filter(d => d === chosen).length;
        const profit = matches === 0 ? -bet : +(bet * PAYOUTS[matches]).toFixed(2);
        setBalance(prev => +(prev + profit).toFixed(2));
        setLastProfit(profit);
        setHistory(prev => [{ chosen: chosen!, dice: result, profit }, ...prev.slice(0, 9)]);
        setRolling(false);
        setPhase('result');
      }
    }, 60);
  };

  const reset = () => { setPhase('betting'); setDice(null); setChosen(null); setLastProfit(null); };

  const matches = dice && chosen !== null ? dice.filter(d => d === chosen).length : 0;

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420, background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.22) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 38, fontWeight: 900, letterSpacing: -1, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #ef4444 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Chuck-a-Luck</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>Pick a number 1–6. Roll 3 dice. Win based on how many match.</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 220px', gap: 20, alignItems: 'start' }}>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Number picker */}
              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Choose a Number</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <motion.button key={n} onClick={() => phase === 'betting' && setChosen(n)}
                      disabled={phase !== 'betting'}
                      whileHover={phase === 'betting' ? { scale: 1.06 } : {}}
                      whileTap={phase === 'betting' ? { scale: 0.93 } : {}}
                      style={{
                        padding: '10px 0', borderRadius: 12, border: '2px solid',
                        borderColor: chosen === n ? THEME : 'rgba(255,255,255,0.08)',
                        background: chosen === n ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.03)',
                        cursor: phase !== 'betting' ? 'not-allowed' : 'pointer',
                        opacity: phase !== 'betting' ? 0.5 : 1,
                        transition: 'border-color 0.15s, background 0.15s',
                        boxShadow: chosen === n ? `0 0 18px rgba(249,115,22,0.28)` : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      <Die value={n} size={52} highlight={chosen === n} />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Bet */}
              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bet Amount</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {CHIPS.map(c => (
                    <button key={c} onClick={() => phase === 'betting' && setBet(c)} disabled={phase !== 'betting'}
                      style={{
                        padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: '1px solid',
                        borderColor: bet === c ? THEME : 'rgba(255,255,255,0.1)',
                        background: bet === c ? THEME : 'rgba(255,255,255,0.04)',
                        color: bet === c ? '#000' : 'rgba(255,255,255,0.5)',
                        cursor: phase !== 'betting' ? 'not-allowed' : 'pointer',
                        opacity: phase !== 'betting' ? 0.5 : 1, transition: 'all 0.15s',
                      }}>${c}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => setBet(p => Math.max(1, Math.floor(p / 2)))} disabled={phase !== 'betting'}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer' }}>½</button>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center' }}>${bet}</div>
                  <button onClick={() => setBet(p => Math.min(balance, p * 2))} disabled={phase !== 'betting'}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer' }}>2×</button>
                </div>
              </div>

              {/* Bet summary */}
              <AnimatePresence>
                {chosen !== null && phase === 'betting' && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ ...panel, textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Placing bet</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>${bet} on</span>
                      <Die value={chosen} size={32} highlight />
                      <span style={{ fontSize: 14, fontWeight: 800, color: THEME }}>({chosen})</span>
                    </div>
                    <p style={{ fontSize: 11, color: THEME, marginTop: 2 }}>3 matches pays 10:1</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result */}
              <AnimatePresence>
                {lastProfit !== null && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    style={{
                      borderRadius: 14, padding: '14px 0', textAlign: 'center', fontWeight: 800, fontSize: 22,
                      border: `1px solid ${lastProfit > 0 ? '#4ade8044' : '#f8717144'}`,
                      background: lastProfit > 0 ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.1)',
                      color: lastProfit > 0 ? '#4ade80' : '#f87171',
                    }}>
                    {lastProfit > 0 ? `+$${lastProfit}` : `-$${Math.abs(lastProfit)}`}
                  </motion.div>
                )}
              </AnimatePresence>

              {phase === 'betting' ? (
                <button onClick={roll} disabled={chosen === null || bet > balance || rolling}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                    cursor: chosen === null || bet > balance || rolling ? 'not-allowed' : 'pointer',
                    background: chosen === null || bet > balance || rolling ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #f97316, #f59e0b)',
                    color: chosen === null || bet > balance || rolling ? 'rgba(255,255,255,0.3)' : '#000',
                    fontWeight: 900, fontSize: 13, transition: 'all 0.2s',
                  }}>
                  {rolling ? 'Rolling…' : chosen ? `ROLL $${bet} ON ${chosen}` : 'PICK A NUMBER FIRST'}
                </button>
              ) : (
                <button onClick={reset}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#000', fontWeight: 900, fontSize: 13 }}>
                  Roll Again
                </button>
              )}

              {/* Payout table */}
              <div style={{ ...panel, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payouts</p>
                {[['0 matches', 'Lose', '#f87171'], ['1 match', '1:1', THEME], ['2 matches', '2:1', THEME], ['3 matches', '10:1', '#f59e0b']].map(([label, pay, col]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                    <span style={{ color: col, fontWeight: 700 }}>{pay}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Arena */}
            <div style={{ ...panel, minHeight: 540, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36 }}>

              {/* Birdcage label */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>🎰 Birdcage</p>
                {chosen !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Betting on</span>
                    <Die value={chosen} size={36} highlight />
                  </div>
                )}
              </div>

              {/* Dice */}
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                {[0, 1, 2].map(i => {
                  const isMatch = phase === 'result' && dice !== null && dice[i] === chosen;
                  return (
                    <Die
                      key={i}
                      value={animDice[i] ?? 1}
                      size={108}
                      highlight={isMatch}
                      rolling={rolling}
                    />
                  );
                })}
              </div>

              <AnimatePresence>
                {phase === 'result' && dice !== null && chosen !== null && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
                      {matches === 0
                        ? 'No matches'
                        : `${matches} match${matches > 1 ? 'es' : ''}! — ${['', '1:1', '2:1', '10:1'][matches]}`}
                    </p>
                    {(() => {
                      const p = matches === 0 ? -bet : +(bet * PAYOUTS[matches]).toFixed(2);
                      return (
                        <p style={{ fontSize: 44, fontWeight: 900, margin: 0, color: p > 0 ? '#4ade80' : '#f87171' }}>
                          {p > 0 ? `+$${p}` : `-$${Math.abs(p)}`}
                        </p>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {phase === 'betting' && !rolling && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', margin: 0 }}>
                  {chosen !== null ? 'Ready — confirm your bet and roll!' : 'Pick a number from the side panel'}
                </p>
              )}
              {rolling && (
                <p style={{ color: THEME, fontWeight: 700, fontSize: 16, margin: 0 }}>Rolling the cage…</p>
              )}

              {/* History */}
              {history.length > 0 && (
                <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Rolls</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {history.map((h, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: '1px solid',
                        borderColor: h.profit >= 0 ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)',
                        background: h.profit >= 0 ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                        color: h.profit >= 0 ? '#4ade80' : '#f87171',
                      }}>
                        <Die value={h.chosen} size={18} />
                        <span style={{ margin: '0 3px', opacity: 0.4 }}>→</span>
                        {h.dice.map((d, di) => <Die key={di} value={d} size={18} highlight={d === h.chosen} />)}
                        <span style={{ marginLeft: 4 }}>{h.profit >= 0 ? '+' : ''}{h.profit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <GameRules gameId="chuck-a-luck" variant="side" />
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}

