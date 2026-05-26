import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [5, 10, 25, 50, 100];

function roll(): number { return Math.floor(Math.random() * 6) + 1; }

const PIP_POS: Record<number, [number, number][]> = {
  1: [[50,50]],
  2: [[28,28],[72,72]],
  3: [[28,28],[50,50],[72,72]],
  4: [[28,28],[72,28],[28,72],[72,72]],
  5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
  6: [[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]],
};

function DieFace({ value, glow, size = 80 }: { value: number; glow: boolean; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 14,
      background: '#fff',
      boxShadow: glow
        ? '0 0 0 3px #6366f1, 0 8px 32px rgba(99,102,241,0.4)'
        : '0 6px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.9)',
      transition: 'all 0.2s',
    }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        {(PIP_POS[value] ?? []).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="9" fill={glow ? '#6366f1' : '#111827'} />
        ))}
      </svg>
    </div>
  );
}

type Phase = 'betting' | 'rolling' | 'result';
type Outcome = 'win' | 'lose' | 'push';

const THEME = '#6366f1';
const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

export default function DiceDuel() {
  const { balance, balanceRef, setBalance } = useGameWallet('DiceDuel');
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState<Phase>('betting');
  const [playerDice, setPlayerDice] = useState<[number, number]>([3, 4]);
  const [houseDice, setHouseDice]   = useState<[number, number]>([2, 5]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [profit, setProfit] = useState(0);

  const rollDice = () => {
    if (bet > balance) return;
    setBalance(b => +(b - bet).toFixed(2));
    setPhase('rolling');
    setOutcome(null);
    setTimeout(() => {
      const p: [number, number] = [roll(), roll()];
      const h: [number, number] = [roll(), roll()];
      const pSum = p[0] + p[1];
      const hSum = h[0] + h[1];
      let res: Outcome = pSum > hSum ? 'win' : pSum === hSum ? 'push' : 'lose';
      setPlayerDice(p);
      setHouseDice(h);
      setOutcome(res);
      if (res === 'win') {
        const pay = +(bet * 1.9).toFixed(2);
        setBalance(b => +(b + pay).toFixed(2));
        setProfit(+(pay - bet).toFixed(2));
      } else if (res === 'push') {
        setBalance(b => +(b + bet).toFixed(2));
        setProfit(0);
      } else {
        setProfit(-bet);
      }
      setPhase('result');
    }, 1100);
  };

  const outcomeColor = outcome === 'win' ? '#4ade80' : outcome === 'lose' ? '#f87171' : '#fbbf24';

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.22) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 38, fontWeight: 900, letterSpacing: -1, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #6366f1 0%, #22c55e 50%, #4ade80 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Dice Duel</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>Roll 2 dice and outscore the house to win 1.9×</p>
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
                    <button key={c} onClick={() => setBet(c)} disabled={phase === 'rolling'}
                      style={{
                        padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid',
                        borderColor: bet === c ? THEME : 'rgba(255,255,255,0.1)',
                        background: bet === c ? THEME : 'rgba(255,255,255,0.04)',
                        color: bet === c ? '#fff' : 'rgba(255,255,255,0.5)',
                        cursor: phase === 'rolling' ? 'not-allowed' : 'pointer',
                        opacity: phase === 'rolling' ? 0.5 : 1, transition: 'all 0.15s',
                      }}>${c}</button>
                  ))}
                </div>
              </div>

              {/* Payout info */}
              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payout</p>
                {[['Win', '1.9× bet', '#4ade80'], ['Tie', 'bet returned', '#fbbf24'], ['Lose', 'lose bet', '#f87171']].map(([label, pay, col]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                    <span style={{ color: col, fontWeight: 700 }}>{pay}</span>
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {outcome && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{
                      borderRadius: 14, padding: '14px 0', textAlign: 'center', fontWeight: 800,
                      border: `1px solid ${outcomeColor}44`,
                      background: `${outcomeColor}14`,
                    }}>
                    <p style={{ fontSize: 28, margin: 0, color: outcomeColor }}>
                      {outcome === 'win' ? `+$${profit.toFixed(2)}` : outcome === 'push' ? 'PUSH' : `-$${bet.toFixed(2)}`}
                    </p>
                    <p style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.4)' }}>
                      {outcome === 'win' ? 'You rolled higher!' : outcome === 'push' ? 'Bet returned' : 'House rolled higher'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={phase !== 'rolling' ? rollDice : undefined} disabled={phase === 'rolling' || bet > balance}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                  cursor: phase === 'rolling' || bet > balance ? 'not-allowed' : 'pointer',
                  background: phase === 'rolling' || bet > balance ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #6366f1, #22c55e)',
                  color: phase === 'rolling' || bet > balance ? 'rgba(255,255,255,0.3)' : '#fff',
                  fontWeight: 900, fontSize: 14, transition: 'all 0.2s',
                }}>
                {phase === 'rolling' ? 'ROLLING...' : phase === 'betting' ? `ROLL — $${bet}` : 'ROLL AGAIN'}
              </button>
            </div>

            {/* Arena */}
            <div style={{
              ...panel,
              minHeight: 460,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28,
            }}>
              {/* House */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>House</p>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                  {houseDice.map((v, i) => (
                    <motion.div key={i} animate={phase === 'rolling' ? { rotate: [0,90,180,270,360], transition: { duration: 0.5, repeat: Infinity, ease: 'linear' } } : { rotate: 0 }}>
                      <DieFace value={v} glow={phase === 'result' && outcome === 'lose'} size={88} />
                    </motion.div>
                  ))}
                </div>
                {phase === 'result' && (
                  <p style={{ fontSize: 22, fontWeight: 900, marginTop: 10, color: '#fff' }}>{houseDice[0]+houseDice[1]}</p>
                )}
              </div>

              {/* VS */}
              <div style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.15)', letterSpacing: 4 }}>VS</div>

              {/* Player */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                  {playerDice.map((v, i) => (
                    <motion.div key={i} animate={phase === 'rolling' ? { rotate: [0,-90,-180,-270,-360], transition: { duration: 0.5, repeat: Infinity, ease: 'linear' } } : { rotate: 0 }}>
                      <DieFace value={v} glow={phase === 'result' && outcome === 'win'} size={88} />
                    </motion.div>
                  ))}
                </div>
                {phase === 'result' && (
                  <p style={{ fontSize: 22, fontWeight: 900, marginTop: 10, color: '#fff' }}>{playerDice[0]+playerDice[1]}</p>
                )}
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 10 }}>You</p>
              </div>

              <AnimatePresence>
                {outcome && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '12px 40px', borderRadius: 14, fontWeight: 900, fontSize: 22,
                      border: `1px solid ${outcomeColor}44`,
                      background: `${outcomeColor}14`,
                      color: outcomeColor,
                    }}>
                    {outcome === 'win' ? '🎉 YOU WIN!' : outcome === 'push' ? '🤝 TIE' : '💀 HOUSE WINS'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div><GameRules gameId="dice-duel" variant="side" /></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
