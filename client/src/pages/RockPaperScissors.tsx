import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

type Choice = 'rock' | 'paper' | 'scissors';
type Outcome = 'win' | 'lose' | 'draw';

const CHOICES: Choice[] = ['rock', 'paper', 'scissors'];
const EMOJI: Record<Choice, string> = { rock: '🪨', paper: '📄', scissors: '✂️' };
const BEATS: Record<Choice, Choice> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
const CHIPS = [5, 10, 25, 50, 100];

function getOutcome(player: Choice, house: Choice): Outcome {
  if (player === house) return 'draw';
  return BEATS[player] === house ? 'win' : 'lose';
}

const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

function ShockWave({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.div
      style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.6)', pointerEvents: 'none', zIndex: 10 }}
      initial={{ width: 0, height: 0, opacity: 1 }}
      animate={{ width: 300, height: 300, opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    />
  );
}

export default function RockPaperScissors() {
  const { balance, balanceRef, setBalance } = useGameWallet('RockPaperScissors');
  const [bet, setBet] = useState(10);
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [houseChoice, setHouseChoice] = useState<Choice | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [profit, setProfit] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shockwave, setShockwave] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeHouse, setShakeHouse] = useState(false);

  const play = (choice: Choice) => {
    if (animating || bet > balance) return;
    setBalance(b => +(b - bet).toFixed(2));
    setPlayerChoice(choice);
    setHouseChoice(null);
    setOutcome(null);
    setAnimating(true);
    setCountdown(3);
    setShockwave(false);

    // House picks
    let house: Choice;
    const r = Math.random();
    if (r < 0.55) {
      house = (Object.keys(BEATS) as Choice[]).find(k => BEATS[k] === choice)!;
    } else if (r < 0.80) {
      house = choice;
    } else {
      house = BEATS[choice];
    }

    // Countdown 3-2-1-GO
    let count = 3;
    const cInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(cInterval);
        setCountdown(0);

        setTimeout(() => {
          const result = getOutcome(choice, house);
          setHouseChoice(house);
          setOutcome(result);
          setCountdown(null);

          // Impact effects
          setShockwave(true);
          if (result === 'lose') setShakePlayer(true);
          if (result === 'win') setShakeHouse(true);
          setTimeout(() => { setShockwave(false); setShakePlayer(false); setShakeHouse(false); }, 600);

          if (result === 'win') {
            setBalance(b => +(b + bet * 2).toFixed(2));
            setProfit(bet);
          } else if (result === 'draw') {
            setBalance(b => +(b + bet).toFixed(2));
            setProfit(0);
          } else {
            setProfit(-bet);
          }
          setAnimating(false);
        }, 400);
      }
    }, 350);
  };

  const reset = () => { setPlayerChoice(null); setHouseChoice(null); setOutcome(null); setCountdown(null); };

  const outcomeColor = outcome === 'win' ? '#4ade80' : outcome === 'lose' ? '#f87171' : '#fbbf24';
  const outcomeBg = outcome === 'win' ? 'rgba(255,255,255,0.0)' : outcome === 'lose' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)';
  const outcomeBorder = outcome === 'win' ? '#4ade8044' : outcome === 'lose' ? '#f8717144' : '#fbbf2444';

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 75%)',
          pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 38, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4ade80 50%, #86efac 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Rock Paper Scissors</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>Beat the house to double your bet — draw returns your stake</p>
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
                    <button key={c} onClick={() => setBet(c)} disabled={animating}
                      style={{
                        padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid',
                        borderColor: bet === c ? '#6366f1' : 'rgba(255,255,255,0.1)',
                        background: bet === c ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                        color: bet === c ? '#818cf8' : 'rgba(255,255,255,0.5)',
                        cursor: animating ? 'not-allowed' : 'pointer',
                        opacity: animating ? 0.5 : 1, transition: 'all 0.15s',
                      }}>${c}</button>
                  ))}
                </div>
              </div>

              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payouts</p>
                {[{ l: 'Win', v: '2× bet', c: '#4ade80' }, { l: 'Draw', v: 'returned', c: '#fbbf24' }, { l: 'Lose', v: 'lose bet', c: '#f87171' }].map(({ l, v, c }) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, color: 'rgba(255,255,255,0.45)' }}>
                    <span>{l}</span>
                    <span style={{ color: c, fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {outcome !== null && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{
                      borderRadius: 14, padding: '14px 0', textAlign: 'center',
                      border: `1px solid ${outcomeBorder}`, background: outcomeBg,
                    }}>
                    <p style={{ fontSize: 28, margin: 0, fontWeight: 900, color: outcomeColor }}>
                      {outcome === 'win' ? `+$${profit.toFixed(2)}` : outcome === 'draw' ? 'DRAW' : `-$${bet.toFixed(2)}`}
                    </p>
                    <p style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.4)' }}>
                      {outcome === 'win' ? 'You win!' : outcome === 'draw' ? 'Bet returned' : 'House wins'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {outcome !== null && !animating && (
                <motion.button onClick={reset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #4f46e5, #6366f1, #818cf8)', color: '#fff', fontWeight: 900, fontSize: 14, boxShadow: '0 4px 24px rgba(99,102,241,0.4)' }}>
                  PLAY AGAIN
                </motion.button>
              )}
            </div>

            {/* Battle Arena */}
            <div style={{ ...panel, minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, position: 'relative', overflow: 'hidden' }}>

              {/* Background clash glow */}
              {outcome && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: `radial-gradient(circle at 50% 50%, ${outcomeBg.replace('0.1', '0.08')} 0%, transparent 60%)`,
                    pointerEvents: 'none',
                  }} />
              )}

              {/* Shockwave on clash */}
              <ShockWave active={shockwave} />

              {/* Countdown overlay */}
              <AnimatePresence>
                {countdown !== null && countdown > 0 && (
                  <motion.div key={countdown}
                    initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      position: 'absolute', fontSize: 80, fontWeight: 900, color: '#6366f1',
                      textShadow: '0 0 40px rgba(99,102,241,0.8)', zIndex: 20, pointerEvents: 'none',
                    }}>
                    {countdown}
                  </motion.div>
                )}
                {countdown === 0 && (
                  <motion.div key="go"
                    initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute', fontSize: 52, fontWeight: 900, color: '#fbbf24',
                      textShadow: '0 0 40px rgba(251,191,36,0.8)', zIndex: 20, pointerEvents: 'none',
                    }}>
                    GO!
                  </motion.div>
                )}
              </AnimatePresence>

              {/* VS display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 32, width: '100%', justifyContent: 'center' }}>
                {/* Player */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>You</p>
                  <AnimatePresence mode="wait">
                    <motion.div key={playerChoice ?? 'empty'}
                      initial={{ scale: 0.5, opacity: 0, x: -30 }} animate={{ scale: 1, opacity: 1, x: 0 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      animate={shakePlayer ? { x: [-8, 8, -8, 8, 0], transition: { duration: 0.4 } } : { scale: 1, opacity: 1, x: 0 }}
                      style={{
                        width: 110, height: 110, borderRadius: 24,
                        background: outcome === 'win'
                          ? 'rgba(255,255,255,0.0)'
                          : outcome === 'lose' ? 'rgba(248,113,113,0.1)'
                          : playerChoice ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${outcome === 'win' ? '#4ade8044' : outcome === 'lose' ? '#f8717144' : 'rgba(99,102,241,0.3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54,
                        boxShadow: outcome === 'win' ? '0 0 30px rgba(74,222,128,0.3)' : 'none',
                        transition: 'all 0.3s',
                      }}>
                      {playerChoice ? EMOJI[playerChoice] : '?'}
                    </motion.div>
                  </AnimatePresence>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'capitalize', margin: 0 }}>{playerChoice ?? '—'}</p>
                </div>

                {/* VS divider with lightning */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <motion.div
                    animate={{ opacity: animating ? [0.4, 1, 0.4] : 1 }}
                    transition={{ duration: 0.4, repeat: animating ? Infinity : 0 }}
                    style={{ fontSize: 28, fontWeight: 900, color: animating ? '#fbbf24' : 'rgba(255,255,255,0.25)' }}>
                    {animating ? '⚡' : 'VS'}
                  </motion.div>
                </div>

                {/* House */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>House</p>
                  <AnimatePresence mode="wait">
                    <motion.div key={houseChoice ?? (animating ? 'thinking' : 'empty')}
                      initial={{ scale: 0.5, opacity: 0, x: 30 }} animate={{ scale: 1, opacity: 1, x: 0 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      animate={shakeHouse ? { x: [-8, 8, -8, 8, 0], transition: { duration: 0.4 } } : { scale: 1, opacity: 1, x: 0 }}
                      style={{
                        width: 110, height: 110, borderRadius: 24,
                        background: animating ? 'rgba(255,255,255,0.04)'
                          : outcome === 'lose' ? 'rgba(248,113,113,0.12)'
                          : outcome === 'win' ? 'rgba(74,222,128,0.08)'
                          : houseChoice ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${outcome === 'lose' ? '#f8717144' : outcome === 'win' ? '#4ade8022' : 'rgba(99,102,241,0.3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54,
                        transition: 'all 0.3s',
                      }}>
                      {animating ? (
                        <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 0.3, repeat: Infinity }}>🤔</motion.span>
                      ) : houseChoice ? EMOJI[houseChoice] : '?'}
                    </motion.div>
                  </AnimatePresence>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'capitalize', margin: 0 }}>{houseChoice ?? '—'}</p>
                </div>
              </div>

              {/* Outcome banner */}
              <AnimatePresence>
                {outcome && (
                  <motion.div initial={{ opacity: 0, y: 16, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    style={{
                      fontSize: 26, fontWeight: 900, padding: '12px 48px', borderRadius: 14,
                      border: `1px solid ${outcomeBorder}`, background: outcomeBg, color: outcomeColor,
                    }}>
                    {outcome === 'win' ? '🏆 YOU WIN!' : outcome === 'draw' ? '🤝 DRAW' : '💀 HOUSE WINS'}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Choice buttons */}
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: 11, textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                  {animating ? 'Choosing...' : outcome ? 'Pick again' : 'Pick your throw'}
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  {CHOICES.map(c => {
                    const isMyChoice = playerChoice === c && outcome;
                    const winColor = outcome === 'win' ? '#4ade80' : outcome === 'lose' ? '#f87171' : '#fbbf24';
                    return (
                      <motion.button key={c} onClick={() => play(c)}
                        disabled={animating || bet > balance}
                        whileHover={{ scale: animating || bet > balance ? 1 : 1.1, y: animating || bet > balance ? 0 : -4 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          padding: '16px 20px', borderRadius: 16, border: '2px solid',
                          borderColor: isMyChoice ? `${winColor}88` : 'rgba(99,102,241,0.3)',
                          background: isMyChoice ? `${winColor}15` : 'rgba(99,102,241,0.08)',
                          color: isMyChoice ? winColor : '#818cf8',
                          fontWeight: 800, fontSize: 12, cursor: animating || bet > balance ? 'not-allowed' : 'pointer',
                          opacity: animating || bet > balance ? 0.4 : 1, transition: 'all 0.2s',
                          boxShadow: isMyChoice ? `0 0 20px ${winColor}33` : 'none',
                        }}>
                        <span style={{ fontSize: 36 }}>{EMOJI[c]}</span>
                        <span style={{ textTransform: 'capitalize' }}>{c}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div><GameRules gameId="rps" variant="side" /></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

