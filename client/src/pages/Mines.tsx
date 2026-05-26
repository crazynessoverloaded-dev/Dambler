import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';
import { Bomb, Gem, Play } from 'lucide-react';

const GRID_SIZE = 25;
const MINE_OPTIONS = [1, 3, 5, 10, 15, 20, 24];

type GameState = 'idle' | 'playing' | 'won' | 'lost';

interface Cell {
  isMine: boolean;
  revealed: boolean;
  exploded: boolean;
}

function calcMultiplier(mines: number, revealed: number): number {
  if (revealed === 0) return 1;
  let mult = 1;
  for (let i = 0; i < revealed; i++) {
    mult *= (GRID_SIZE - i) / (GRID_SIZE - mines - i);
  }
  return parseFloat((mult * 0.97).toFixed(2));
}

function buildGrid(mines: number): Cell[] {
  const grid: Cell[] = Array.from({ length: GRID_SIZE }, () => ({
    isMine: false,
    revealed: false,
    exploded: false,
  }));

  let placed = 0;
  while (placed < mines) {
    const idx = Math.floor(Math.random() * GRID_SIZE);
    if (!grid[idx].isMine) {
      grid[idx].isMine = true;
      placed++;
    }
  }
  return grid;
}

interface HistoryEntry {
  id: string;
  mines: number;
  revealed: number;
  multiplier: number;
  profit: number;
  won: boolean;
}

const THEME = '#10b981';
const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 16,
};

export default function Mines() {
  const { balance, balanceRef, setBalance } = useGameWallet('Mines');
  const [betAmount, setBetAmount] = useState(10);
  const [mineCount, setMineCount] = useState(3);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [grid, setGrid] = useState<Cell[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastProfit, setLastProfit] = useState<number | null>(null);

  const safeCount = GRID_SIZE - mineCount;
  const nextMultiplier = calcMultiplier(mineCount, revealedCount + 1);
  const cashOutAmount = parseFloat((betAmount * currentMultiplier).toFixed(2));

  const startGame = useCallback(() => {
    if (balance < betAmount) return;
    setBalance((b) => parseFloat((b - betAmount).toFixed(2)));
    setGrid(buildGrid(mineCount));
    setRevealedCount(0);
    setCurrentMultiplier(1);
    setLastProfit(null);
    setGameState('playing');
  }, [balance, betAmount, mineCount]);

  const revealCell = useCallback(
    (index: number) => {
      if (gameState !== 'playing') return;
      setGrid((prev) => {
        if (prev[index].revealed) return prev;
        const next = prev.map((c, i) => (i === index ? { ...c, revealed: true } : c));

        if (prev[index].isMine) {
          const boom = next.map((c, idx) =>
            c.isMine ? { ...c, revealed: true, exploded: idx === index } : c
          );
          const profit = -betAmount;
          setLastProfit(profit);
          setHistory((h) => [
            { id: crypto.randomUUID(), mines: mineCount, revealed: revealedCount, multiplier: currentMultiplier, profit, won: false },
            ...h.slice(0, 19),
          ]);
          setGameState('lost');
          return boom;
        }

        const newRevealed = revealedCount + 1;
        const newMult = calcMultiplier(mineCount, newRevealed);
        setRevealedCount(newRevealed);
        setCurrentMultiplier(newMult);

        if (newRevealed === safeCount) {
          const winAmount = parseFloat((betAmount * newMult).toFixed(2));
          const profit = parseFloat((winAmount - betAmount).toFixed(2));
          setBalance((b) => parseFloat((b + winAmount).toFixed(2)));
          setLastProfit(profit);
          setHistory((h) => [
            { id: crypto.randomUUID(), mines: mineCount, revealed: newRevealed, multiplier: newMult, profit, won: true },
            ...h.slice(0, 19),
          ]);
          setGameState('won');
        }

        return next;
      });
    },
    [gameState, betAmount, mineCount, revealedCount, currentMultiplier, safeCount]
  );

  const cashOut = useCallback(() => {
    if (gameState !== 'playing' || revealedCount === 0) return;
    const winAmount = cashOutAmount;
    const profit = parseFloat((winAmount - betAmount).toFixed(2));
    setBalance((b) => parseFloat((b + winAmount).toFixed(2)));
    setLastProfit(profit);
    setHistory((h) => [
      { id: crypto.randomUUID(), mines: mineCount, revealed: revealedCount, multiplier: currentMultiplier, profit, won: true },
      ...h.slice(0, 19),
    ]);
    setGrid((prev) => prev.map((c) => (c.isMine ? { ...c, revealed: true } : c)));
    setGameState('won');
  }, [gameState, revealedCount, cashOutAmount, betAmount, mineCount, currentMultiplier]);

  const isPlaying = gameState === 'playing';
  const isIdle = gameState === 'idle';

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420, background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.18) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Bomb style={{ width: 28, height: 28, color: '#ef4444' }} />
                <h1 style={{
                  fontSize: 36, fontWeight: 900, letterSpacing: -1, margin: 0,
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #22c55e 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>Mines</h1>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>Reveal gems, avoid the mines, cash out before you explode</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 200px', gap: 16, alignItems: 'start' }}>

            {/* Left Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bet Amount</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 8 }}>
                  {[1, 10, 100].map((amt) => (
                    <button key={amt} onClick={() => setBetAmount(amt)} disabled={isPlaying}
                      style={{
                        padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, border: '1px solid',
                        borderColor: betAmount === amt ? THEME : 'rgba(255,255,255,0.1)',
                        background: betAmount === amt ? THEME : 'rgba(255,255,255,0.04)',
                        color: betAmount === amt ? '#000' : 'rgba(255,255,255,0.5)',
                        cursor: isPlaying ? 'not-allowed' : 'pointer',
                        opacity: isPlaying ? 0.4 : 1, transition: 'all 0.15s',
                      }}>${amt}</button>
                  ))}
                </div>
                <input
                  type="number"
                  value={betAmount}
                  min={1}
                  onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                  disabled={isPlaying}
                  style={{
                    width: '100%', padding: '6px 10px', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff',
                    fontSize: 12, boxSizing: 'border-box', opacity: isPlaying ? 0.4 : 1,
                  }}
                />
              </div>

              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Mines <span style={{ color: '#ef4444' }}>{mineCount}</span>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {MINE_OPTIONS.map((n) => (
                    <button key={n} onClick={() => setMineCount(n)} disabled={isPlaying}
                      style={{
                        padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, border: '1px solid',
                        borderColor: mineCount === n ? '#ef4444' : 'rgba(255,255,255,0.1)',
                        background: mineCount === n ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)',
                        color: mineCount === n ? '#ef4444' : 'rgba(255,255,255,0.5)',
                        cursor: isPlaying ? 'not-allowed' : 'pointer',
                        opacity: isPlaying ? 0.4 : 1, transition: 'all 0.15s',
                      }}>{n} 💣</button>
                  ))}
                </div>
              </div>

              {isPlaying && (
                <div style={{ ...panel, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Next gem</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: THEME, margin: 0 }}>{nextMultiplier}x</p>
                </div>
              )}

              {isIdle || gameState === 'won' || gameState === 'lost' ? (
                <button onClick={startGame} disabled={balance < betAmount}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
                    cursor: balance < betAmount ? 'not-allowed' : 'pointer',
                    background: balance < betAmount ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #10b981, #06b6d4)',
                    color: balance < betAmount ? 'rgba(255,255,255,0.3)' : '#000',
                    fontWeight: 900, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
                  }}>
                  <Play size={14} />
                  {gameState === 'idle' ? 'BET' : 'BET AGAIN'}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={cashOut} disabled={revealedCount === 0}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
                      cursor: revealedCount === 0 ? 'not-allowed' : 'pointer',
                      background: revealedCount === 0 ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #10b981, #22c55e)',
                      color: revealedCount === 0 ? 'rgba(255,255,255,0.3)' : '#000',
                      fontWeight: 900, fontSize: 13, transition: 'all 0.2s',
                    }}>
                    CASH OUT ${cashOutAmount.toFixed(2)}
                  </button>
                  <p style={{ fontSize: 11, textAlign: 'center', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{currentMultiplier}x multiplier</p>
                </div>
              )}

              <AnimatePresence>
                {lastProfit !== null && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    style={{
                      borderRadius: 12, padding: '12px 0', textAlign: 'center', fontSize: 14, fontWeight: 700,
                      border: `1px solid ${lastProfit >= 0 ? '#4ade8044' : '#f8717144'}`,
                      background: lastProfit >= 0 ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.1)',
                      color: lastProfit >= 0 ? '#4ade80' : '#f87171',
                    }}>
                    {lastProfit >= 0 ? '+' : ''}${lastProfit.toFixed(2)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mine Grid */}
            <div style={{ ...panel }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {isIdle
                  ? Array.from({ length: GRID_SIZE }).map((_, i) => (
                      <div key={i} style={{ aspectRatio: '1', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
                    ))
                  : grid.map((cell, i) => (
                      <MineCell key={i} cell={cell} isPlaying={isPlaying} onClick={() => revealCell(i)} />
                    ))}
              </div>

              <AnimatePresence>
                {gameState === 'won' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: 16, textAlign: 'center', color: '#4ade80', fontWeight: 700, fontSize: 18 }}>
                    You cashed out! 💎
                  </motion.div>
                )}
                {gameState === 'lost' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: 16, textAlign: 'center', color: '#f87171', fontWeight: 700, fontSize: 18 }}>
                    Boom! You hit a mine 💥
                  </motion.div>
                )}
                {gameState === 'idle' && (
                  <p style={{ marginTop: 16, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                    Set your bet and mines, then press BET to start
                  </p>
                )}
              </AnimatePresence>
            </div>

            {/* Right Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Game</p>
                {[
                  ['Mines', `${isIdle ? mineCount : grid.filter(c => c.isMine).length} 💣`, '#ef4444'],
                  ['Gems left', `${isIdle ? GRID_SIZE - mineCount : safeCount - revealedCount} 💎`, THEME],
                  ['Revealed', `${revealedCount}`, '#fff'],
                  ['Multiplier', `${currentMultiplier}x`, THEME],
                ].map(([label, val, col]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                    <span style={{ color: col, fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>

              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Multiplier Table</p>
                <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {Array.from({ length: Math.min(safeCount, 10) }, (_, k) => {
                    const mult = calcMultiplier(mineCount, k + 1);
                    return (
                      <div key={k} style={{
                        display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3, padding: '2px 4px', borderRadius: 4,
                        background: revealedCount === k + 1 ? 'rgba(16,185,129,0.15)' : 'transparent',
                      }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k + 1} gem{k > 0 ? 's' : ''}</span>
                        <span style={{ color: THEME, fontWeight: 700 }}>{mult}x</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {history.length > 0 && (
                <div style={panel}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>History</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {history.slice(0, 8).map((h) => (
                      <div key={h.id} style={{
                        padding: '6px 8px', borderRadius: 8, fontSize: 11,
                        background: h.won ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                        border: `1px solid ${h.won ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.2)'}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>{h.revealed} gem{h.revealed !== 1 ? 's' : ''}</span>
                          <span style={{ color: h.won ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                            {h.profit >= 0 ? '+' : ''}${h.profit.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{h.mines} mines · {h.multiplier}x</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <GameRules gameId="mines" />
        </div>
      </div>
    </MainLayout>
  );
}

function MineCell({ cell, isPlaying, onClick }: { cell: Cell; isPlaying: boolean; onClick: () => void }) {
  const canClick = isPlaying && !cell.revealed;

  if (!cell.revealed) {
    return (
      <motion.button
        whileHover={canClick ? { scale: 1.06 } : {}}
        whileTap={canClick ? { scale: 0.94 } : {}}
        onClick={onClick}
        disabled={!canClick}
        style={{
          aspectRatio: '1', borderRadius: 10, border: '1px solid',
          borderColor: canClick ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)',
          background: canClick ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
          cursor: canClick ? 'pointer' : 'default',
          transition: 'all 0.15s',
        }}
      />
    );
  }

  if (cell.isMine) {
    return (
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          aspectRatio: '1', borderRadius: 10, border: '1px solid',
          borderColor: cell.exploded ? '#ef4444' : 'rgba(239,68,68,0.4)',
          background: cell.exploded ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: cell.exploded ? '0 0 20px rgba(239,68,68,0.4)' : 'none',
        }}>
        <Bomb size={18} style={{ color: cell.exploded ? '#fca5a5' : 'rgba(239,68,68,0.6)' }} />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      style={{
        aspectRatio: '1', borderRadius: 10, border: '1px solid rgba(16,185,129,0.5)',
        background: 'rgba(16,185,129,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 12px rgba(16,185,129,0.2)',
      }}>
      <Gem size={18} style={{ color: '#10b981' }} />
    </motion.div>
  );
}

