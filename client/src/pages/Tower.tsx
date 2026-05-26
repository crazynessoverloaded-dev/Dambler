import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [1, 5, 10, 25, 50, 100];

// 97% RTP: mult[n] = 0.97 / P(survive_n_rows) = 0.97 / (P_safe)^n
// Easy P(safe)=0.75: mult[n] = 0.97/0.75^n
// Medium P(safe)=0.50: mult[n] = 0.97/0.50^n
// Hard P(safe)=0.25: mult[n] = 0.97/0.25^n (capped at practical display limits)
const DIFFS = {
  easy:   { bombs: 1, tiles: 4, mults: [1.29, 1.73, 2.30, 3.07, 4.09, 5.46, 7.27, 9.70, 12.93, 17.24] },
  medium: { bombs: 2, tiles: 4, mults: [1.94, 3.88, 7.76, 15.52, 31.0, 62.08, 124.0, 248.0, 496.0, 992.0] },
  hard:   { bombs: 3, tiles: 4, mults: [3.88, 15.52, 62.08, 248.0, 992.0, 3968.0, 15872.0, 63488.0, 253952.0, 999999.0] },
};

type Diff = keyof typeof DIFFS;
type Cell = { bomb: boolean; state: 'hidden' | 'safe' | 'boom' };
type Phase = 'idle' | 'playing' | 'cashedout' | 'dead';

function genGrid(diff: Diff): Cell[][] {
  const { bombs, tiles } = DIFFS[diff];
  return Array.from({ length: 10 }, () => {
    const row: Cell[] = Array.from({ length: tiles }, () => ({ bomb: false, state: 'hidden' }));
    const idxs = [...Array(tiles).keys()].sort(() => Math.random() - 0.5).slice(0, bombs);
    idxs.forEach(i => (row[i].bomb = true));
    return row;
  });
}

const THEME = '#0ea5e9';
const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

export default function TowerGame() {
  const { balance, balanceRef, setBalance } = useGameWallet('Tower');
  const [bet, setBet] = useState(10);
  const [diff, setDiff] = useState<Diff>('medium');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [profit, setProfit] = useState(0);

  const cfg = DIFFS[diff];
  const currentMult = currentRow > 0 ? cfg.mults[currentRow - 1] : 1;
  const nextMult = cfg.mults[currentRow];

  const start = () => {
    if (bet > balance) return;
    setBalance(p => +(p - bet).toFixed(2));
    setGrid(genGrid(diff));
    setCurrentRow(0);
    setPhase('playing');
    setProfit(0);
  };

  const clickCell = (row: number, col: number) => {
    if (phase !== 'playing' || row !== currentRow) return;
    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    const cell = newGrid[row][col];
    if (cell.bomb) {
      newGrid[row].forEach(c => (c.state = c.bomb ? 'boom' : 'safe'));
      setGrid(newGrid);
      setPhase('dead');
      setProfit(-bet);
    } else {
      cell.state = 'safe';
      setGrid(newGrid);
      const nextRow = currentRow + 1;
      if (nextRow >= 10) {
        const win = +(bet * cfg.mults[9]).toFixed(2);
        setBalance(p => +(p + win).toFixed(2));
        setProfit(+(win - bet).toFixed(2));
        setPhase('cashedout');
      } else {
        setCurrentRow(nextRow);
      }
    }
  };

  const cashout = () => {
    if (phase !== 'playing' || currentRow === 0) return;
    const win = +(bet * currentMult).toFixed(2);
    setBalance(p => +(p + win).toFixed(2));
    setProfit(+(win - bet).toFixed(2));
    setPhase('cashedout');
  };

  const CELL_ICONS: Record<Cell['state'], string> = { hidden: '?', safe: '✓', boom: '💣' };

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420, background: 'radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.22) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 38, fontWeight: 900, letterSpacing: -1, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #22c55e 50%, #0ea5e9 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Tower</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>Climb the tower floor by floor — avoid bombs and cash out any time</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {phase === 'playing' && (
                <div style={{ ...panel, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Floor {currentRow + 1} · Next up</p>
                  <p style={{ fontSize: 36, fontWeight: 900, color: THEME, margin: '0 0 12px' }}>{nextMult}×</p>
                  {currentRow > 0 && (
                    <button onClick={cashout}
                      style={{ width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #0ea5e9, #22c55e)', color: '#fff', fontWeight: 900, fontSize: 13 }}>
                      Cash Out ${(bet * currentMult).toFixed(2)}
                    </button>
                  )}
                </div>
              )}

              {(phase === 'idle' || phase === 'cashedout' || phase === 'dead') && (
                <>
                  <div style={panel}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Difficulty</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                      {(Object.keys(DIFFS) as Diff[]).map(d => (
                        <button key={d} onClick={() => setDiff(d)}
                          style={{
                            padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid',
                            borderColor: diff === d ? THEME : 'rgba(255,255,255,0.1)',
                            background: diff === d ? THEME : 'rgba(255,255,255,0.04)',
                            color: diff === d ? '#000' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s',
                          }}>{d}</button>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6, textAlign: 'center' }}>{cfg.bombs} bomb · {cfg.tiles} tiles per floor</p>
                  </div>

                  <div style={panel}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bet Amount</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {CHIPS.map(c => (
                        <button key={c} onClick={() => setBet(c)}
                          style={{
                            padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: '1px solid',
                            borderColor: bet === c ? THEME : 'rgba(255,255,255,0.1)',
                            background: bet === c ? THEME : 'rgba(255,255,255,0.04)',
                            color: bet === c ? '#000' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}>${c}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setBet(p => Math.max(1, Math.floor(p / 2)))}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer' }}>½</button>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center' }}>${bet}</div>
                      <button onClick={() => setBet(p => Math.min(balance, p * 2))}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer' }}>2×</button>
                    </div>
                  </div>

                  <button onClick={start} disabled={bet > balance}
                    style={{
                      width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                      cursor: bet > balance ? 'not-allowed' : 'pointer',
                      background: bet > balance ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #0ea5e9, #22c55e)',
                      color: bet > balance ? 'rgba(255,255,255,0.3)' : '#fff',
                      fontWeight: 900, fontSize: 14, transition: 'all 0.2s',
                    }}>
                    {phase === 'idle' ? 'Start Climb' : 'Play Again'}
                  </button>
                </>
              )}

              {/* Multiplier table */}
              <div style={panel}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Multiplier Table</p>
                {cfg.mults.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 6px', borderRadius: 6, marginBottom: 2,
                    background: i === currentRow && phase === 'playing' ? 'rgba(14,165,233,0.15)' : 'transparent',
                    color: i === currentRow && phase === 'playing' ? THEME : 'rgba(255,255,255,0.4)',
                    fontWeight: i === currentRow && phase === 'playing' ? 700 : 400,
                  }}>
                    <span>Floor {i + 1}</span><span>{m}×</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tower Grid */}
            <div style={{ ...panel, minHeight: 560 }}>
              {phase === 'idle' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, gap: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 64 }}>🏰</div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Ready to Climb?</p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 280, margin: 0, lineHeight: 1.6 }}>
                    Set your bet and difficulty, then hit Start Climb. Tap a tile on the active floor — avoid the bombs and cash out any time.
                  </p>
                  <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                      <div key={d} style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize', marginBottom: 4 }}>{d}</p>
                        <p style={{ fontSize: 12, color: THEME, margin: 0 }}>{({ easy: '1 bomb', medium: '2 bombs', hard: '3 bombs' })[d]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <AnimatePresence>
                    {(phase === 'cashedout' || phase === 'dead') && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                          textAlign: 'center', padding: '12px 0', borderRadius: 12, fontWeight: 900, fontSize: 20, marginBottom: 8,
                          color: phase === 'cashedout' ? '#4ade80' : '#f87171',
                          background: phase === 'cashedout' ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.1)',
                          border: `1px solid ${phase === 'cashedout' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                        }}>
                        {phase === 'cashedout' ? `🏆 Cashed out! +$${profit}` : `💣 Boom! -$${bet}`}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {[...Array(10)].map((_, displayIdx) => {
                    const rowIdx = 9 - displayIdx;
                    const row = grid[rowIdx] || [];
                    const isActive = rowIdx === currentRow && phase === 'playing';
                    const isPassed = rowIdx < currentRow;
                    return (
                      <div key={rowIdx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, width: 48, textAlign: 'right',
                          color: rowIdx === currentRow ? THEME : 'rgba(255,255,255,0.3)',
                        }}>
                          {cfg.mults[rowIdx]}×
                        </span>
                        <div style={{
                          flex: 1, display: 'flex', gap: 6, padding: '8px', borderRadius: 12, border: '1px solid',
                          borderColor: isActive ? 'rgba(14,165,233,0.4)' : isPassed ? 'rgba(255,255,255,0.0)' : 'rgba(255,255,255,0.05)',
                          background: isActive ? 'rgba(14,165,233,0.06)' : isPassed ? 'rgba(74,222,128,0.04)' : 'transparent',
                          opacity: isActive ? 1 : isPassed ? 0.8 : 0.35,
                          transition: 'all 0.15s',
                        }}>
                          {row.map((cell, col) => (
                            <motion.button key={col}
                              whileHover={isActive ? { scale: 1.06 } : {}}
                              whileTap={isActive ? { scale: 0.94 } : {}}
                              onClick={() => clickCell(rowIdx, col)}
                              style={{
                                flex: 1, height: 40, borderRadius: 8, fontWeight: 700, fontSize: 14, border: '1px solid', transition: 'all 0.15s',
                                borderColor: cell.state === 'hidden'
                                  ? isActive ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.08)'
                                  : cell.state === 'safe' ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)',
                                background: cell.state === 'hidden'
                                  ? isActive ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.03)'
                                  : cell.state === 'safe' ? 'rgba(255,255,255,0.0)' : 'rgba(239,68,68,0.15)',
                                color: cell.state === 'hidden'
                                  ? isActive ? THEME : 'rgba(255,255,255,0.2)'
                                  : cell.state === 'safe' ? '#4ade80' : '#f87171',
                                cursor: isActive ? 'pointer' : 'default',
                              }}>
                              {cell.state === 'hidden' ? (isActive ? '?' : '') : CELL_ICONS[cell.state]}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <GameRules gameId="tower" />
        </div>
      </div>
    </MainLayout>
  );
}

