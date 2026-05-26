import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCard(): number[][] {
  const ranges = [[1,15],[16,30],[31,45],[46,60],[61,75]];
  const card: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  ranges.forEach(([lo, hi], col) => {
    const pool = shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i));
    for (let row = 0; row < 5; row++) card[row][col] = pool[row];
  });
  card[2][2] = 0;
  return card;
}

function checkBingo(card: number[][], calledSet: Set<number>): boolean {
  const ok = (r: number, c: number) => card[r][c] === 0 || calledSet.has(card[r][c]);
  for (let r = 0; r < 5; r++) if ([0,1,2,3,4].every(c => ok(r, c))) return true;
  for (let c = 0; c < 5; c++) if ([0,1,2,3,4].every(r => ok(r, c))) return true;
  if ([0,1,2,3,4].every(i => ok(i, i))) return true;
  if ([0,1,2,3,4].every(i => ok(i, 4-i))) return true;
  return false;
}

const MAX_CALLS = 38;
const COLS = ['B','I','N','G','O'];
const CHIPS = [5, 10, 25, 50, 100];
type Phase = 'betting' | 'playing' | 'result';

const COL_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

function BingoCelebration() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Letter burst */}
      {['B','I','N','G','O'].map((l, i) => (
        <motion.div key={l}
          initial={{ scale: 0, opacity: 0, x: (i - 2) * 80, y: 0 }}
          animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 0], y: -60 }}
          transition={{ duration: 1.2, delay: i * 0.1 }}
          style={{ position: 'absolute', fontSize: 72, fontWeight: 900, color: COL_COLORS[i],
            textShadow: `0 0 30px ${COL_COLORS[i]}`, letterSpacing: 0 }}>
          {l}
        </motion.div>
      ))}
      {/* Stars */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 300 }}
          transition={{ duration: 1.0, delay: 0.3 + Math.random() * 0.5 }}
          style={{ position: 'absolute', fontSize: 24, color: COL_COLORS[i % 5] }}>
          ⭐
        </motion.div>
      ))}
    </div>
  );
}

export default function Bingo() {
  const { balance, balanceRef, setBalance } = useGameWallet('Bingo');
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState<Phase>('betting');
  const [card, setCard] = useState<number[][]>([]);
  const [ballOrder, setBallOrder] = useState<number[]>([]);
  const [calledCount, setCalledCount] = useState(0);
  const [won, setWon] = useState(false);
  const [lastBall, setLastBall] = useState<number | null>(null);
  const [profit, setProfit] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentBalls, setRecentBalls] = useState<number[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cardRef = useRef<number[][]>([]);
  const ballRef = useRef<number[]>([]);
  const countRef = useRef(0);
  const betRef = useRef(bet);
  useEffect(() => { betRef.current = bet; }, [bet]);

  const called = new Set(ballOrder.slice(0, calledCount));

  const startGame = () => {
    if (bet > balance) return;
    setBalance(b => +(b - bet).toFixed(2));
    const c = generateCard();
    const b = shuffle(Array.from({ length: 75 }, (_, i) => i + 1));
    cardRef.current = c;
    ballRef.current = b;
    countRef.current = 0;
    setCard(c);
    setBallOrder(b);
    setCalledCount(0);
    setWon(false);
    setLastBall(null);
    setRecentBalls([]);
    setShowCelebration(false);
    setPhase('playing');

    timerRef.current = setInterval(() => {
      countRef.current++;
      const idx = countRef.current - 1;
      const ball = ballRef.current[idx];
      setLastBall(ball);
      setCalledCount(countRef.current);
      setRecentBalls(prev => [ball, ...prev].slice(0, 5));

      const calledSet = new Set(ballRef.current.slice(0, countRef.current));
      if (checkBingo(cardRef.current, calledSet)) {
        clearInterval(timerRef.current!);
        const win = +(betRef.current * 4).toFixed(2);
        setBalance(b => +(b + win).toFixed(2));
        setProfit(+(win - betRef.current).toFixed(2));
        setWon(true);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
        setPhase('result');
      } else if (countRef.current >= MAX_CALLS) {
        clearInterval(timerRef.current!);
        setProfit(-betRef.current);
        setPhase('result');
      }
    }, 600);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const getBallColor = (n: number) => {
    if (n <= 15) return '#3b82f6';
    if (n <= 30) return '#8b5cf6';
    if (n <= 45) return '#ec4899';
    if (n <= 60) return '#f59e0b';
    return '#10b981';
  };

  const getBallLetter = (n: number) => COLS[Math.min(Math.floor((n - 1) / 15), 4)];

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {showCelebration && <BingoCelebration />}

        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 75%)',
          pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #22c55e 40%, #ec4899 70%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Bingo</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>Get 5 in a row within {MAX_CALLS} calls — win 4× your bet</p>
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
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Card Price</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                  {CHIPS.map(c => (
                    <button key={c} onClick={() => setBet(c)} disabled={phase === 'playing'}
                      style={{
                        padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid',
                        borderColor: bet === c ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                        background: bet === c ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                        color: bet === c ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                        cursor: phase === 'playing' ? 'not-allowed' : 'pointer',
                        opacity: phase === 'playing' ? 0.5 : 1, transition: 'all 0.15s',
                      }}>${c}</button>
                  ))}
                </div>
              </div>

              {/* Ball machine display */}
              {phase === 'playing' && (
                <div style={{ ...panel, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Balls Called</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>
                    {calledCount} / {MAX_CALLS}
                  </p>

                  {/* Progress bar */}
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 14 }}>
                    <motion.div
                      style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #22c55e)', borderRadius: 2 }}
                      animate={{ width: `${(calledCount / MAX_CALLS) * 100}%` }}
                      transition={{ duration: 0.4 }} />
                  </div>

                  {/* Latest ball */}
                  <AnimatePresence mode="wait">
                    {lastBall && (
                      <motion.div key={lastBall}
                        initial={{ scale: 2, opacity: 0, y: -30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                        <div style={{
                          width: 60, height: 60, borderRadius: '50%', margin: '0 auto 6px',
                          background: `radial-gradient(circle at 35% 35%, ${getBallColor(lastBall)}dd, ${getBallColor(lastBall)}88)`,
                          border: `3px solid ${getBallColor(lastBall)}`,
                          boxShadow: `0 0 20px ${getBallColor(lastBall)}66, inset 0 2px 6px rgba(255,255,255,0.3)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                        }}>
                          <span style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.9)', lineHeight: 1 }}>{getBallLetter(lastBall)}</span>
                          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{lastBall}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Recent balls */}
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {recentBalls.slice(1, 5).map((b, i) => (
                      <div key={b} style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: `${getBallColor(b)}44`,
                        border: `1.5px solid ${getBallColor(b)}88`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 900, color: getBallColor(b),
                        opacity: 1 - i * 0.2,
                      }}>{b}</div>
                    ))}
                  </div>
                </div>
              )}

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
                      {won ? '🎉 BINGO!' : `No BINGO in ${MAX_CALLS} calls`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {phase !== 'playing' && (
                <motion.button onClick={startGame} disabled={bet > balance}
                  whileHover={{ scale: bet > balance ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                    cursor: bet > balance ? 'not-allowed' : 'pointer',
                    background: bet > balance ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #1d4ed8, #3b82f6, #60a5fa)',
                    color: bet > balance ? 'rgba(255,255,255,0.3)' : '#fff',
                    fontWeight: 900, fontSize: 14, transition: 'all 0.2s',
                    boxShadow: bet > balance ? 'none' : '0 4px 24px rgba(59,130,246,0.4)',
                  }}>
                  {phase === 'betting' ? `BUY CARD — $${bet}` : 'NEW CARD'}
                </motion.button>
              )}

              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payout</p>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                  BINGO → <span style={{ color: '#3b82f6', fontWeight: 700 }}>4× card price</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>No BINGO → lose bet</div>
              </div>
            </div>

            {/* Bingo Card */}
            <div style={{ ...panel, minHeight: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {phase === 'betting' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, textAlign: 'center' }}>
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                    <span style={{ fontSize: 80 }}>🎱</span>
                  </motion.div>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>Ready to Play?</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0, maxWidth: 280 }}>
                    Buy a card — balls drop automatically. Get 5 in a row to win 4×!
                  </p>
                </div>
              ) : (
                <>
                  {/* BINGO header */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                    {COLS.map((c, i) => (
                      <motion.div key={c}
                        animate={won && phase === 'result' ? { scale: [1, 1.2, 1], color: COL_COLORS[i] } : {}}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                        style={{
                          height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900, fontSize: 20, color: '#fff',
                          background: `linear-gradient(135deg, ${COL_COLORS[i]}cc, ${COL_COLORS[i]}77)`,
                          boxShadow: `0 4px 16px ${COL_COLORS[i]}44`,
                        }}>{c}</motion.div>
                    ))}
                  </div>

                  {/* Card grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, flex: 1 }}>
                    {Array.from({ length: 5 }).map((_, row) =>
                      Array.from({ length: 5 }).map((_, col) => {
                        const num = card[row]?.[col] ?? 0;
                        const isFree = row === 2 && col === 2;
                        const isMarked = isFree || called.has(num);
                        const colColor = COL_COLORS[col];
                        return (
                          <motion.div key={`${row}-${col}`}
                            animate={isMarked && !isFree && num === lastBall
                              ? { scale: [1, 1.25, 1] }
                              : {}}
                            transition={{ duration: 0.3 }}
                            style={{
                              aspectRatio: '1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 900, fontSize: 16, transition: 'all 0.3s',
                              background: isFree
                                ? `linear-gradient(135deg, ${colColor}cc, ${colColor}77)`
                                : isMarked
                                ? `${colColor}33`
                                : 'rgba(255,255,255,0.04)',
                              border: `2px solid ${isFree ? colColor : isMarked ? `${colColor}88` : 'rgba(255,255,255,0.08)'}`,
                              color: isFree ? '#fff' : isMarked ? colColor : 'rgba(255,255,255,0.6)',
                              boxShadow: isMarked && !isFree ? `0 0 12px ${colColor}44` : 'none',
                            }}>
                            {isFree ? (
                              <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>★</motion.span>
                            ) : num}
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {phase === 'result' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 250 }}
                      style={{
                        padding: '14px 0', borderRadius: 14, textAlign: 'center',
                        fontWeight: 900, fontSize: 26,
                        color: won ? '#4ade80' : '#f87171',
                        background: won ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.08)',
                        border: `1px solid ${won ? '#4ade8033' : '#f8717133'}`,
                      }}>
                      {won ? '🎉 BINGO!' : '❌ No Bingo'}
                    </motion.div>
                  )}
                </>
              )}
            </div>

            <div><GameRules gameId="bingo" variant="side" /></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

