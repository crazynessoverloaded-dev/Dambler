import { useState, useRef, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';
import { motion, AnimatePresence } from 'framer-motion';

type GameState = 'idle' | 'revealing' | 'shuffling' | 'waiting_pick' | 'result';

interface GameResult { id: string; won: boolean; betAmount: number; profit: number; }

const CupSVG = ({ lifted, hasCoin, isWin, isLoss, canPick }: { lifted: boolean; hasCoin: boolean; isWin?: boolean; isLoss?: boolean; canPick?: boolean }) => {
  const bodyColor = isWin ? '#f59e0b' : isLoss ? '#ef4444' : canPick ? '#f97316' : '#92400e';
  const glowColor = isWin ? '#f59e0b' : isLoss ? '#ef4444' : '#f97316';
  return (
    <svg viewBox="0 0 80 100" style={{ width: '100%', height: '100%' }} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`cupBody-${bodyColor}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bodyColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={isWin ? '#92400e' : isLoss ? '#7f1d1d' : '#451a03'} />
        </linearGradient>
        <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="90" rx="28" ry="7"
        fill={isWin ? 'rgba(245,158,11,0.3)' : isLoss ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.15)'}
        stroke={glowColor} strokeWidth="1" strokeOpacity="0.6" />
      <path d="M18 30 Q14 60 12 84 Q20 90 40 90 Q60 90 68 84 Q66 60 62 30 Z"
        fill={`url(#cupBody-${bodyColor})`} stroke={glowColor} strokeWidth="1.5" strokeOpacity="0.8" />
      <path d="M22 30 Q19 55 17 78 Q22 82 30 84 Q26 58 28 30 Z" fill="url(#shine)" />
      <path d="M18 30 Q40 24 62 30" stroke={glowColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeOpacity="0.9" />
      <rect x="33" y="2" width="14" height="28" rx="7"
        fill={isWin ? 'rgba(245,158,11,0.4)' : isLoss ? 'rgba(239,68,68,0.4)' : 'rgba(249,115,22,0.25)'}
        stroke={glowColor} strokeWidth="1.2" strokeOpacity="0.7" />
      {hasCoin && (
        <motion.ellipse cx="40" cy="88" rx="14" ry="5"
          fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5"
          animate={{ scale: [0.8, 1.1, 1] }} transition={{ type: 'spring', stiffness: 300 }} />
      )}
    </svg>
  );
};

const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];

export default function GuessTheCup() {
  const { balance, balanceRef, setBalance } = useGameWallet('GuessTheCup');
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [cupPositions, setCupPositions] = useState([0, 1, 2]);
  const [coinSlot, setCoinSlot] = useState(0);
  const [selectedCup, setSelectedCup] = useState<number | null>(null);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [revealedCups, setRevealedCups] = useState<boolean[]>([false, false, false]);
  const [shuffleSpeed, setShuffleSpeed] = useState(0);

  const betAmountRef = useRef(betAmount);
  useEffect(() => { betAmountRef.current = betAmount; }, [betAmount]);

  const handleBetNow = async () => {
    if (balanceRef.current < betAmountRef.current) return;
    setBalance(prev => { const n = prev - betAmountRef.current; balanceRef.current = n; return n; });
    setGameState('revealing');
    setRevealedCups([false, false, false]);

    await new Promise(r => setTimeout(r, 300));
    setRevealedCups([true, true, true]);
    await new Promise(r => setTimeout(r, 1200));
    setRevealedCups([false, false, false]);

    setGameState('shuffling');
    await shuffleCups();
    setShuffleSpeed(0);
    setGameState('waiting_pick');
  };

  const shuffleCups = async () => {
    let pos = [...cupPositions];
    let coin = coinSlot;
    const swaps = Math.floor(Math.random() * 5) + 7;

    for (let i = 0; i < swaps; i++) {
      // Speed up in middle, slow at end
      const progress = i / swaps;
      const speed = progress < 0.3 ? 380 : progress < 0.7 ? 200 : progress < 0.9 ? 280 : 400;
      setShuffleSpeed(progress < 0.3 ? 1 : progress < 0.7 ? 3 : 2);
      await new Promise(r => setTimeout(r, speed));

      const a = Math.floor(Math.random() * 3);
      let b = Math.floor(Math.random() * 3);
      while (b === a) b = Math.floor(Math.random() * 3);

      [pos[a], pos[b]] = [pos[b], pos[a]];
      if (coin === a) coin = b;
      else if (coin === b) coin = a;
      setCupPositions([...pos]);
    }

    if (Math.random() > 0.48) coin = 1;
    setCoinSlot(coin);
  };

  const handleCupClick = async (cupIndex: number) => {
    if (gameState !== 'waiting_pick') return;
    setGameState('result');
    setSelectedCup(cupIndex);
    setRevealedCups([true, true, true]);

    await new Promise(r => setTimeout(r, 300));
    const won = cupIndex === coinSlot;
    const profit = won ? betAmountRef.current : -betAmountRef.current;

    setBalance(prev => { const n = prev + (won ? betAmountRef.current : 0); balanceRef.current = n; return n; });
    setLastProfit(profit);
    setGameResults(prev => [{ id: Date.now().toString(), won, betAmount: betAmountRef.current, profit }, ...prev].slice(0, 10));

    await new Promise(r => setTimeout(r, 2500));
    setGameState('idle');
    setSelectedCup(null);
    setRevealedCups([false, false, false]);
    setCupPositions([0, 1, 2]);
    setCoinSlot(Math.floor(Math.random() * 3));
  };

  const isPlaying = gameState !== 'idle';
  const speedLabel = shuffleSpeed === 3 ? 'FAST' : shuffleSpeed === 2 ? 'SLOWING' : shuffleSpeed === 1 ? 'SLOW' : '';

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.22) 0%, rgba(249,115,22,0.10) 50%, transparent 75%)',
          pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Guess The Cup</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>Watch the shuffle — find the coin — double your bet</p>
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
                  {BET_AMOUNTS.slice(0, 6).map(a => (
                    <button key={a} onClick={() => setBetAmount(a)} disabled={isPlaying}
                      style={{
                        padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid',
                        borderColor: betAmount === a ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                        background: betAmount === a ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                        color: betAmount === a ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                        cursor: isPlaying ? 'not-allowed' : 'pointer',
                        opacity: isPlaying ? 0.5 : 1, transition: 'all 0.15s',
                      }}>${a}</button>
                  ))}
                </div>
              </div>

              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Win Chance</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b', margin: '0 0 4px' }}>48%</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Pays 2× your bet</p>
              </div>

              <AnimatePresence>
                {lastProfit !== null && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{
                      borderRadius: 14, padding: '14px 0', textAlign: 'center',
                      border: `1px solid ${lastProfit >= 0 ? '#4ade8044' : '#f8717144'}`,
                      background: lastProfit >= 0 ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.1)',
                    }}>
                    <p style={{ fontSize: 28, margin: 0, fontWeight: 900, color: lastProfit >= 0 ? '#4ade80' : '#f87171' }}>
                      {lastProfit >= 0 ? `+$${lastProfit.toFixed(2)}` : `-$${Math.abs(lastProfit).toFixed(2)}`}
                    </p>
                    <p style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.4)' }}>
                      {lastProfit >= 0 ? '🪙 Found it!' : 'Wrong cup'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={handleBetNow}
                disabled={isPlaying || balance < betAmount}
                whileHover={{ scale: isPlaying || balance < betAmount ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  cursor: isPlaying || balance < betAmount ? 'not-allowed' : 'pointer',
                  background: isPlaying || balance < betAmount ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #b45309, #f59e0b, #fbbf24)',
                  color: isPlaying || balance < betAmount ? 'rgba(255,255,255,0.3)' : '#000',
                  fontWeight: 900, fontSize: 13, transition: 'all 0.2s',
                  boxShadow: isPlaying || balance < betAmount ? 'none' : '0 4px 24px rgba(245,158,11,0.4)',
                }}>
                {gameState === 'idle' ? `BET $${betAmount}` : gameState === 'revealing' ? 'Watch carefully…' : gameState === 'shuffling' ? `Shuffling… ${speedLabel}` : gameState === 'waiting_pick' ? '▶ Pick a cup!' : 'Revealing…'}
              </motion.button>

              {/* Recent results */}
              {gameResults.length > 0 && (
                <div style={panel}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {gameResults.map(r => (
                      <span key={r.id} style={{
                        padding: '4px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: r.won ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                        border: `1px solid ${r.won ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                        color: r.won ? '#4ade80' : '#f87171',
                      }}>
                        {r.won ? '🪙 WIN' : 'MISS'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Game area */}
            <div style={{ ...panel, minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>

              {/* State label */}
              <AnimatePresence mode="wait">
                <motion.p key={gameState}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  style={{
                    fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0,
                    color: gameState === 'waiting_pick' ? '#f59e0b'
                      : gameState === 'result' ? (lastProfit !== null && lastProfit >= 0 ? '#4ade80' : '#f87171')
                      : 'rgba(255,255,255,0.35)',
                  }}>
                  {gameState === 'idle' && '🏆 Place your bet to begin'}
                  {gameState === 'revealing' && '👀 Watch carefully…'}
                  {gameState === 'shuffling' && `🔀 Shuffling ${shuffleSpeed === 3 ? '⚡⚡⚡' : shuffleSpeed === 2 ? '⚡⚡' : '⚡'}…`}
                  {gameState === 'waiting_pick' && '▶ Choose a cup!'}
                  {gameState === 'result' && (lastProfit !== null && lastProfit >= 0 ? '🏆 Correct!' : '❌ Wrong cup!')}
                </motion.p>
              </AnimatePresence>

              {/* Shuffle speed indicator */}
              {gameState === 'shuffling' && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3].map(i => (
                    <motion.div key={i}
                      style={{ width: 24, height: 6, borderRadius: 3, background: i <= shuffleSpeed ? '#f59e0b' : 'rgba(255,255,255,0.1)' }}
                      animate={{ opacity: i <= shuffleSpeed ? [0.6, 1, 0.6] : 0.3 }}
                      transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }} />
                  ))}
                </div>
              )}

              {/* Cups */}
              <div style={{ display: 'flex', gap: 40, alignItems: 'flex-end', padding: '20px 0' }}>
                {[0, 1, 2].map(index => {
                  const cupPos = cupPositions.indexOf(index);
                  const isRevealed = revealedCups[cupPos];
                  const hasCoin = isRevealed && cupPos === coinSlot;
                  const isSelected = selectedCup === cupPos;
                  const isWin = isSelected && hasCoin;
                  const isLoss = isSelected && !hasCoin && gameState === 'result';
                  const canPick = gameState === 'waiting_pick';

                  return (
                    <motion.div key={index}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: canPick ? 'pointer' : 'default' }}
                      onClick={() => handleCupClick(cupPos)}
                      animate={{ y: isRevealed ? -40 : 0 }}
                      whileHover={canPick ? { y: -12, scale: 1.08 } : {}}
                      whileTap={canPick ? { scale: 0.95 } : {}}
                      transition={{ type: 'spring', stiffness: 280, damping: 22 }}>

                      {canPick && (
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                          style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Cup {index + 1}
                        </motion.span>
                      )}

                      <div style={{
                        width: 100, height: 120,
                        filter: isWin
                          ? 'drop-shadow(0 0 24px rgba(245,158,11,0.8))'
                          : isLoss ? 'drop-shadow(0 0 16px rgba(239,68,68,0.6))'
                          : canPick ? 'drop-shadow(0 0 14px rgba(249,115,22,0.5))' : 'none',
                        transition: 'filter 0.3s',
                      }}>
                        <CupSVG lifted={isRevealed} hasCoin={hasCoin} isWin={isWin} isLoss={isLoss} canPick={canPick} />
                      </div>

                      {/* Coin display */}
                      {isRevealed && (
                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          style={{ marginTop: 4 }}>
                          {hasCoin ? (
                            <motion.span style={{ fontSize: 28 }}
                              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
                              transition={{ duration: 0.5 }}>
                              🪙
                            </motion.span>
                          ) : (
                            <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.15)' }}>·</span>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Shuffle dots */}
              {gameState === 'shuffling' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                  ))}
                </div>
              )}

              {gameState === 'idle' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', margin: 0 }}>The coin hides under one cup — can you track it?</p>
                </motion.div>
              )}
            </div>

            <div><GameRules gameId="guess-the-cup" variant="side" /></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

