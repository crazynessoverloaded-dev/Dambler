import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const TOTAL_NUMBERS = 40;
const DRAW_COUNT = 10;
const MAX_PICKS = 10;

function getPayoutMultiplier(picks: number, matches: number): number {
  const table: Record<number, number[]> = {
    1:  [0, 3.8],
    2:  [0, 1, 9],
    3:  [0, 0, 2.5, 20],
    4:  [0, 0, 1, 5, 60],
    5:  [0, 0, 0.5, 2, 15, 120],
    6:  [0, 0, 0, 1, 5, 30, 200],
    7:  [0, 0, 0, 0.5, 2, 15, 60, 500],
    8:  [0, 0, 0, 0, 1, 5, 30, 100, 1000],
    9:  [0, 0, 0, 0, 0.5, 2, 15, 50, 200, 2000],
    10: [0, 0, 0, 0, 0, 1, 5, 20, 100, 500, 5000],
  };
  const row = table[picks];
  if (!row || matches >= row.length) return 0;
  return row[matches];
}

type Phase = 'idle' | 'drawing' | 'done';

const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

export default function Keno() {
  const { balance, balanceRef, setBalance } = useGameWallet('Keno');
  const [betAmount, setBetAmount] = useState(10);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [drawn, setDrawn] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<Phase>('idle');
  const [matches, setMatches] = useState(0);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [history, setHistory] = useState<{ picks: number; matches: number; profit: number }[]>([]);
  const [lastDrawn, setLastDrawn] = useState<number | null>(null);

  const togglePick = useCallback((n: number) => {
    if (phase !== 'idle') return;
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(n)) { next.delete(n); return next; }
      if (next.size >= MAX_PICKS) return prev;
      next.add(n);
      return next;
    });
  }, [phase]);

  const startDraw = useCallback(async () => {
    if (picked.size === 0 || balance < betAmount) return;
    setBalance(b => parseFloat((b - betAmount).toFixed(2)));
    setDrawn(new Set());
    setMatches(0);
    setLastProfit(null);
    setLastDrawn(null);
    setPhase('drawing');

    const pool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, DRAW_COUNT);
    const drawnSet = new Set(shuffled);

    for (let i = 0; i < shuffled.length; i++) {
      await new Promise(r => setTimeout(r, 160));
      setDrawn(prev => new Set([...prev, shuffled[i]]));
      setLastDrawn(shuffled[i]);
    }

    const matchCount = shuffled.filter(n => picked.has(n)).length;
    const mult = getPayoutMultiplier(picked.size, matchCount);
    const win = parseFloat((betAmount * mult).toFixed(2));
    const profit = parseFloat((win - betAmount).toFixed(2));

    setMatches(matchCount);
    setLastProfit(profit);
    if (win > 0) setBalance(b => parseFloat((b + win).toFixed(2)));
    setHistory(h => [{ picks: picked.size, matches: matchCount, profit }, ...h.slice(0, 14)]);
    setPhase('done');
  }, [picked, balance, betAmount]);

  const reset = useCallback(() => {
    setDrawn(new Set());
    setMatches(0);
    setLastProfit(null);
    setLastDrawn(null);
    setPhase('idle');
  }, []);

  const autoPick = () => {
    if (phase !== 'idle') return;
    const pool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setPicked(new Set(pool.slice(0, 10)));
  };

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.22) 0%, rgba(245,158,11,0.10) 50%, transparent 75%)',
          pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #fde68a 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Keno</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>Pick up to 10 numbers — match the draw to win big</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 200px', gap: 20, alignItems: 'start' }}>

            {/* Left Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bet Amount</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 8 }}>
                  {[5, 10, 50].map(a => (
                    <button key={a} onClick={() => setBetAmount(a)} disabled={phase === 'drawing'}
                      style={{
                        padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid',
                        borderColor: betAmount === a ? '#f97316' : 'rgba(255,255,255,0.1)',
                        background: betAmount === a ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                        color: betAmount === a ? '#f97316' : 'rgba(255,255,255,0.5)',
                        cursor: phase === 'drawing' ? 'not-allowed' : 'pointer',
                        opacity: phase === 'drawing' ? 0.5 : 1, transition: 'all 0.15s',
                      }}>${a}</button>
                  ))}
                </div>
                <input type="number" value={betAmount} min={1}
                  onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))}
                  disabled={phase === 'drawing'}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', boxSizing: 'border-box',
                    opacity: phase === 'drawing' ? 0.5 : 1,
                  }} />
              </div>

              {/* Stats */}
              <div style={panel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Selected</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>{picked.size}/{MAX_PICKS}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Drawn</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{drawn.size}/{DRAW_COUNT}</span>
                </div>
                {phase === 'done' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Matches</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>{matches}</span>
                  </div>
                )}
              </div>

              {/* Latest ball */}
              {phase === 'drawing' && lastDrawn !== null && (
                <div style={{ ...panel, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Last Drawn</p>
                  <AnimatePresence mode="wait">
                    <motion.div key={lastDrawn}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      style={{
                        width: 56, height: 56, borderRadius: '50%', margin: '0 auto',
                        background: picked.has(lastDrawn)
                          ? 'radial-gradient(circle at 35% 35%, #4ade80dd, #16a34a88)'
                          : 'radial-gradient(circle at 35% 35%, #f97316dd, #c2410c88)',
                        border: `3px solid ${picked.has(lastDrawn) ? '#4ade80' : '#f97316'}`,
                        boxShadow: `0 0 20px ${picked.has(lastDrawn) ? 'rgba(74,222,128,0.6)' : 'rgba(249,115,22,0.6)'}, inset 0 2px 6px rgba(255,255,255,0.3)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 900, color: '#fff',
                      }}>
                      {lastDrawn}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              <AnimatePresence>
                {lastProfit !== null && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{
                      borderRadius: 14, padding: '14px 0', textAlign: 'center',
                      border: `1px solid ${lastProfit >= 0 ? '#4ade8044' : '#f8717144'}`,
                      background: lastProfit >= 0 ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.1)',
                    }}>
                    <p style={{ fontSize: 26, margin: 0, fontWeight: 900, color: lastProfit >= 0 ? '#4ade80' : '#f87171' }}>
                      {lastProfit >= 0 ? `+$${lastProfit.toFixed(2)}` : `-$${Math.abs(lastProfit).toFixed(2)}`}
                    </p>
                    <p style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.4)' }}>
                      {matches > 0 ? `${matches} match${matches > 1 ? 'es' : ''}!` : 'No matches'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(phase === 'idle' || phase === 'done') && (
                  <>
                    {phase === 'done' && (
                      <motion.button onClick={reset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        style={{
                          width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid rgba(249,115,22,0.3)',
                          background: 'rgba(249,115,22,0.08)', color: '#f97316', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        }}>CLEAR PICKS</motion.button>
                    )}
                    <motion.button
                      onClick={startDraw} disabled={picked.size === 0 || balance < betAmount}
                      whileHover={{ scale: picked.size === 0 || balance < betAmount ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{
                        width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                        cursor: picked.size === 0 || balance < betAmount ? 'not-allowed' : 'pointer',
                        background: picked.size === 0 || balance < betAmount ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #c2410c, #f97316, #fb923c)',
                        color: picked.size === 0 || balance < betAmount ? 'rgba(255,255,255,0.3)' : '#fff',
                        fontWeight: 900, fontSize: 14, transition: 'all 0.2s',
                        boxShadow: picked.size === 0 || balance < betAmount ? 'none' : '0 4px 24px rgba(249,115,22,0.4)',
                      }}>
                      {phase === 'done' ? 'PLAY AGAIN' : 'DRAW'}
                    </motion.button>
                  </>
                )}
                {phase === 'drawing' && (
                  <div style={{ ...panel, textAlign: 'center' }}>
                    <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.6, repeat: Infinity }}
                      style={{ color: '#f97316', fontWeight: 700, fontSize: 14, margin: 0 }}>Drawing…</motion.p>
                  </div>
                )}
                {phase === 'idle' && (
                  <button onClick={autoPick}
                    style={{
                      width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>Auto-Pick 10</button>
                )}
              </div>

              {/* History */}
              {history.length > 0 && (
                <div style={panel}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>History</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {history.slice(0, 6).map((h, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 8,
                        background: h.profit >= 0 ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                        border: `1px solid ${h.profit >= 0 ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.2)'}`,
                      }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{h.matches}/{h.picks} match</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: h.profit >= 0 ? '#4ade80' : '#f87171' }}>
                          {h.profit >= 0 ? '+' : ''}${h.profit.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Number Grid */}
            <div style={{ ...panel, minHeight: 480 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, marginBottom: 16 }}>
                {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map(n => {
                  const isPicked = picked.has(n);
                  const isDrawn = drawn.has(n);
                  const isMatch = isPicked && isDrawn;
                  const isMiss = isDrawn && !isPicked;

                  return (
                    <motion.button key={n}
                      onClick={() => togglePick(n)}
                      disabled={phase !== 'idle'}
                      whileHover={phase === 'idle' ? { scale: 1.12, y: -2 } : {}}
                      whileTap={phase === 'idle' ? { scale: 0.9 } : {}}
                      animate={isMatch ? { scale: [1, 1.3, 1] } : {}}
                      transition={isMatch ? { type: 'spring', stiffness: 400 } : {}}
                      style={{
                        aspectRatio: '1', borderRadius: 10, fontSize: 13, fontWeight: 800,
                        border: '2px solid',
                        borderColor: isMatch ? '#4ade80' : isMiss ? '#f97316' : isPicked ? '#f97316' : 'rgba(255,255,255,0.08)',
                        background: isMatch
                          ? 'radial-gradient(circle at 35% 35%, #4ade80cc, #16a34a88)'
                          : isMiss ? 'rgba(249,115,22,0.25)'
                          : isPicked ? 'rgba(249,115,22,0.2)'
                          : 'rgba(255,255,255,0.03)',
                        color: isMatch ? '#fff' : isMiss ? '#fb923c' : isPicked ? '#f97316' : 'rgba(255,255,255,0.35)',
                        boxShadow: isMatch
                          ? '0 0 18px rgba(74,222,128,0.5), inset 0 1px 4px rgba(255,255,255,0.2)'
                          : isPicked ? '0 0 10px rgba(249,115,22,0.3)' : 'none',
                        cursor: phase !== 'idle' ? 'default' : 'pointer',
                        transition: 'border-color 0.15s, background 0.15s, color 0.15s, box-shadow 0.15s',
                      }}>
                      {n}
                    </motion.button>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[{ c: '#f97316', bg: 'rgba(249,115,22,0.2)', l: 'Your picks' }, { c: '#4ade80', bg: 'rgba(255,255,255,0.0)', l: 'Match!' }, { c: '#fb923c', bg: 'rgba(249,115,22,0.15)', l: 'Drawn (no match)' }].map(({ c, bg, l }) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: `2px solid ${c}` }} />
                    {l}
                  </div>
                ))}
              </div>

              {phase === 'done' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: 16, padding: '12px 0', borderRadius: 14, textAlign: 'center', fontWeight: 900,
                    fontSize: 18,
                    color: matches > 0 ? '#4ade80' : '#f87171',
                    background: matches > 0 ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.08)',
                    border: `1px solid ${matches > 0 ? '#4ade8033' : '#f8717133'}`,
                  }}>
                  {matches > 0
                    ? `${matches} match${matches > 1 ? 'es' : ''}! — ${getPayoutMultiplier(picked.size, matches)}× payout`
                    : 'No matches this round'}
                </motion.div>
              )}
            </div>

            {/* Payout table */}
            <div style={panel}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Payout ({picked.size} picks)
              </p>
              {picked.size > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {Array.from({ length: picked.size + 1 }, (_, m) => {
                    const payout = getPayoutMultiplier(picked.size, m);
                    const isActive = phase === 'done' && matches === m;
                    return (
                      <div key={m} style={{
                        display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 8px', borderRadius: 6,
                        background: isActive ? 'rgba(249,115,22,0.15)' : 'transparent',
                        border: isActive ? '1px solid rgba(249,115,22,0.4)' : '1px solid transparent',
                      }}>
                        <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>{m} match{m !== 1 ? 'es' : ''}</span>
                        <span style={{ color: payout > 0 ? '#f97316' : 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                          {payout > 0 ? `${payout}×` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>Pick numbers to see payouts</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

