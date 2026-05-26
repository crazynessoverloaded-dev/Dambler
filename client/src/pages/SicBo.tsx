import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

type Phase = 'betting' | 'rolling' | 'result';

interface BetOption {
  id: string; label: string; payout: number; description: string;
  check: (dice: number[]) => boolean;
}

const PAYOUT_ROW = [0,0,0,0,60,30,17,12,8,6,6,6,8,12,17,30,60,60];

const BETS: BetOption[] = [
  { id: 'small',     label: 'Small',      payout: 1,  description: '1:1',   check: d => { const s=d[0]+d[1]+d[2]; return s>=4&&s<=10&&!(d[0]===d[1]&&d[1]===d[2]); } },
  { id: 'big',       label: 'Big',        payout: 1,  description: '1:1',   check: d => { const s=d[0]+d[1]+d[2]; return s>=11&&s<=17&&!(d[0]===d[1]&&d[1]===d[2]); } },
  { id: 'any-triple',label: 'Any Triple', payout: 30, description: '30:1',  check: d => d[0]===d[1]&&d[1]===d[2] },
  ...[4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(total => ({
    id: `total-${total}`, label: `${total}`, payout: PAYOUT_ROW[total],
    description: `${PAYOUT_ROW[total]}:1`,
    check: (d: number[]) => d[0]+d[1]+d[2] === total,
  })),
  ...[1,2,3,4,5,6].map(n => ({
    id: `pair-${n}`, label: `${n}`, payout: 10, description: '10:1',
    check: (d: number[]) => d.filter(v=>v===n).length >= 2,
  })),
  ...[1,2,3,4,5,6].map(n => ({
    id: `triple-${n}`, label: `${n}`, payout: 180, description: '180:1',
    check: (d: number[]) => d.every(v=>v===n),
  })),
];

const CHIP_VALUES = [1, 5, 10, 25, 50, 100];
const CHIP_COLORS: Record<number, string> = {
  1:'#e2e8f0', 5:'#ef4444', 10:'#3b82f6', 25:'#10b981', 50:'#f59e0b', 100:'#8b5cf6'
};

const PIP: Record<number, [number,number][]> = {
  1:[[50,50]],
  2:[[28,28],[72,72]],
  3:[[28,28],[50,50],[72,72]],
  4:[[28,28],[72,28],[28,72],[72,72]],
  5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
  6:[[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]],
};

function Die({ value, rolling, highlight, idx }: { value: number; rolling: boolean; highlight?: boolean; idx: number }) {
  const dirs = [1, -1, 1];
  const delays = [0, 0.05, 0.1];
  const d = dirs[idx];
  return (
    <motion.div
      animate={rolling ? {
        rotate: [0, d*130, d*270, d*420, d*570, d*700, d*720],
        x: [0, d*-8, d*10, d*-7, d*5, d*-3, 0],
        y: [0, -10, 5, -8, 4, -5, 0],
        scale: [1, 1.07, 0.93, 1.05, 0.95, 1.02, 1],
      } : { rotate: 0, x: 0, y: 0, scale: 1 }}
      transition={{ duration: 0.85, ease: 'easeOut', delay: delays[idx] }}
      style={{ filter: highlight ? 'drop-shadow(0 0 14px #f59e0b)' : rolling ? `drop-shadow(0 0 16px rgba(220,38,38,0.7))` : 'none' }}
    >
      <div style={{
        width: 80, height: 80, borderRadius: 16,
        background: highlight
          ? 'linear-gradient(145deg, #fff9e6, #fff0b3)'
          : 'linear-gradient(145deg, #ffffff, #e4e4e4)',
        boxShadow: highlight
          ? '0 0 0 3px #f59e0b, 0 10px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.95)'
          : '0 10px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.9)',
        position: 'relative', transition: 'box-shadow 0.25s, background 0.25s',
      }}>
        <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%', position:'absolute', inset:0 }}>
          {(PIP[value]||[]).map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r="10" fill={highlight ? '#92400e' : '#1a1a2e'}
              style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
          ))}
        </svg>
      </div>
    </motion.div>
  );
}

function payoutColor(p: number): string {
  if (p >= 60) return '#f59e0b';
  if (p >= 17) return '#a78bfa';
  if (p >= 8)  return '#60a5fa';
  return 'rgba(255,255,255,0.55)';
}

function payoutBg(p: number): string {
  if (p >= 60) return 'rgba(245,158,11,0.1)';
  if (p >= 17) return 'rgba(167,139,250,0.08)';
  if (p >= 8)  return 'rgba(96,165,250,0.07)';
  return 'rgba(255,255,255,0.04)';
}

export default function SicBo() {
  const { balance, setBalance } = useGameWallet('SicBo');
  const [chipValue, setChipValue] = useState(5);
  const [placedBets, setPlacedBets] = useState<Record<string, number>>({});
  const [dice, setDice] = useState<number[]>([2, 4, 3]);
  const [phase, setPhase] = useState<Phase>('betting');
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [winningBets, setWinningBets] = useState<string[]>([]);
  const [rollKey, setRollKey] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalBet = Object.values(placedBets).reduce((s, v) => s + v, 0);
  const totalSum = dice[0] + dice[1] + dice[2];

  const placeBet = (id: string) => {
    if (phase !== 'betting') return;
    if (balance < chipValue) return;
    setBalance(b => parseFloat((b - chipValue).toFixed(2)));
    setPlacedBets(prev => ({ ...prev, [id]: (prev[id] || 0) + chipValue }));
  };

  const clearBets = () => {
    const refund = Object.values(placedBets).reduce((s, v) => s + v, 0);
    setBalance(b => parseFloat((b + refund).toFixed(2)));
    setPlacedBets({});
  };

  const roll = useCallback(async () => {
    if (totalBet === 0) return;
    setPhase('rolling');
    setWinningBets([]);
    setShowOverlay(false);
    setRollKey(k => k + 1);

    // Rapid random dice during roll
    intervalRef.current = setInterval(() => {
      setDice([Math.ceil(Math.random()*6), Math.ceil(Math.random()*6), Math.ceil(Math.random()*6)]);
    }, 70);

    await new Promise(r => setTimeout(r, 920));
    if (intervalRef.current) clearInterval(intervalRef.current);

    const finalDice = [Math.ceil(Math.random()*6), Math.ceil(Math.random()*6), Math.ceil(Math.random()*6)];
    setDice(finalDice);

    let totalWin = 0;
    const winners: string[] = [];
    for (const bet of BETS) {
      const amount = placedBets[bet.id] || 0;
      if (amount > 0 && bet.check(finalDice)) {
        totalWin += amount * (bet.payout + 1);
        winners.push(bet.id);
      }
    }

    const profit = parseFloat((totalWin - totalBet).toFixed(2));
    setLastProfit(profit);
    setWinningBets(winners);
    if (totalWin > 0) setBalance(b => parseFloat((b + totalWin).toFixed(2)));
    setPhase('result');
    setTimeout(() => setShowOverlay(true), 300);
  }, [totalBet, placedBets]);

  const reset = () => {
    setPhase('betting');
    setLastProfit(null);
    setWinningBets([]);
    setPlacedBets({});
    setShowOverlay(false);
  };

  const mainBets = BETS.filter(b => ['small','big','any-triple'].includes(b.id));
  const totalBets = BETS.filter(b => b.id.startsWith('total-'));
  const pairBets  = BETS.filter(b => b.id.startsWith('pair-'));
  const tripleBets = BETS.filter(b => b.id.startsWith('triple-'));

  const isWin = lastProfit !== null && lastProfit > 0;
  const isRolling = phase === 'rolling';
  const canRoll = totalBet > 0 && phase === 'betting';

  const mainBetConfig: Record<string, { accent: string; sub: string }> = {
    small:       { accent: '#3b82f6', sub: 'Total 4–10' },
    big:         { accent: '#ef4444', sub: 'Total 11–17' },
    'any-triple':{ accent: '#f59e0b', sub: 'All three same' },
  };

  return (
    <MainLayout>
      <div style={{ background: '#0d0d12', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse, rgba(220,38,38,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 300, left: '20%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 300, right: '20%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', padding: '3px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20 }}>
                  🎲 Dice Game
                </span>
              </div>
              <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: 0, color: '#ffffff' }}>Sic Bo</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '4px 0 0' }}>Three dice — bet on totals, pairs, triples and more</p>
            </div>
            <div style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Balance</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '196px 1fr', gap: 18, alignItems: 'start' }}>

            {/* Left panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Chip selector */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Chip</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                  {CHIP_VALUES.map(v => {
                    const active = chipValue === v;
                    return (
                      <button key={v} onClick={() => { if (phase === 'betting') setChipValue(v); }}
                        disabled={phase !== 'betting'}
                        style={{
                          padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: phase !== 'betting' ? 'default' : 'pointer',
                          border: `2px solid ${active ? CHIP_COLORS[v] : 'rgba(255,255,255,0.08)'}`,
                          background: active ? `${CHIP_COLORS[v]}20` : 'rgba(255,255,255,0.03)',
                          color: active ? CHIP_COLORS[v] : 'rgba(255,255,255,0.35)',
                          transition: 'all 0.15s', opacity: phase !== 'betting' ? 0.5 : 1,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: CHIP_COLORS[v], opacity: active ? 1 : 0.35, border: '2px dashed rgba(255,255,255,0.35)', flexShrink: 0 }} />
                        ${v}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active bets summary */}
              {totalBet > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' }}>Active Bets</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>${totalBet}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                    {Object.entries(placedBets).filter(([,v]) => v > 0).map(([id, amt]) => {
                      const b = BETS.find(x => x.id === id);
                      const isWinBet = winningBets.includes(id);
                      return b ? (
                        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 6px', borderRadius: 6, background: isWinBet ? 'rgba(74,222,128,0.1)' : 'transparent' }}>
                          <span style={{ color: isWinBet ? '#4ade80' : 'rgba(255,255,255,0.35)' }}>{b.label === b.id ? id : b.label}</span>
                          <span style={{ color: isWinBet ? '#4ade80' : 'rgba(255,255,255,0.55)', fontWeight: 700 }}>${amt}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Roll / Clear / Result buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {phase === 'betting' && (
                  <>
                    <motion.button
                      whileTap={canRoll ? { scale: 0.97 } : {}}
                      onClick={roll}
                      disabled={!canRoll}
                      style={{
                        width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                        fontWeight: 900, fontSize: 15, letterSpacing: 0.5, cursor: canRoll ? 'pointer' : 'not-allowed',
                        background: canRoll ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'rgba(255,255,255,0.06)',
                        color: canRoll ? '#fff' : 'rgba(255,255,255,0.2)',
                        boxShadow: canRoll ? '0 4px 20px rgba(220,38,38,0.35)' : 'none',
                        transition: 'all 0.2s',
                      }}>
                      🎲 ROLL DICE
                    </motion.button>
                    {totalBet > 0 && (
                      <button onClick={clearBets}
                        style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                        Clear Bets
                      </button>
                    )}
                  </>
                )}
                {phase === 'rolling' && (
                  <div style={{ width: '100%', padding: '14px 0', borderRadius: 12, background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', color: '#ef4444', fontSize: 15, fontWeight: 900, textAlign: 'center' }}>
                    <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>Rolling…</motion.span>
                  </div>
                )}
                {phase === 'result' && (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={reset}
                    style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', fontWeight: 900, fontSize: 15, cursor: 'pointer', background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', boxShadow: '0 4px 20px rgba(220,38,38,0.35)' }}>
                    NEW ROUND
                  </motion.button>
                )}
              </div>

              {/* Result card */}
              <AnimatePresence>
                {lastProfit !== null && phase === 'result' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    style={{
                      borderRadius: 14, padding: '14px 12px', textAlign: 'center',
                      border: `1px solid ${isWin ? '#4ade8044' : '#f8717144'}`,
                      background: isWin ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.08)',
                    }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: isWin ? '#4ade80' : '#f87171' }}>
                      {lastProfit >= 0 ? '+' : ''}${lastProfit.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                      {winningBets.length > 0 ? `${winningBets.length} winning bet${winningBets.length > 1 ? 's' : ''}` : 'No winning bets'}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Total rolled: {totalSum}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Payout legend */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Payout Tiers</div>
                {[['1:1', 'rgba(255,255,255,0.55)', 'Small / Big'], ['10:1', '#60a5fa', 'Pairs'], ['30:1', '#a78bfa', 'Any Triple'], ['180:1', '#f59e0b', 'Specific Triple']].map(([pay, col, lbl]) => (
                  <div key={pay} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>{lbl}</span>
                    <span style={{ color: col as string, fontWeight: 800 }}>{pay}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: dice stage + bet board */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Dice stage */}
              <div style={{
                borderRadius: 20, overflow: 'hidden', position: 'relative',
                background: 'linear-gradient(160deg, #0f1520 0%, #0a0e18 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '32px 24px 28px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
              }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.013) 40px,rgba(255,255,255,0.013) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.013) 40px,rgba(255,255,255,0.013) 41px)', pointerEvents: 'none' }} />

                {/* The three dice */}
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', position: 'relative', zIndex: 1 }}>
                  {[0,1,2].map(i => (
                    <Die key={`${rollKey}-${i}`} value={dice[i]} rolling={isRolling} highlight={!isRolling && phase === 'result' && winningBets.length > 0} idx={i} />
                  ))}
                </div>

                {/* Sum display */}
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <AnimatePresence mode="wait">
                    {isRolling ? (
                      <motion.div key="rolling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', gap: 7, justifyContent: 'center', height: 60, alignItems: 'center' }}>
                        {[0,1,2].map(i => (
                          <motion.div key={i} animate={{ scale: [1, 1.6, 1], opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.18 }}
                            style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }} />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div key={`sum-${rollKey}`} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 310, damping: 20 }}>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Total</div>
                        <motion.div style={{ fontSize: 60, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}
                          animate={{ color: phase === 'result' ? (isWin ? '#4ade80' : '#f87171') : 'rgba(255,255,255,0.15)' }}
                          transition={{ duration: 0.3 }}>
                          {phase === 'result' ? totalSum : '?'}
                        </motion.div>
                        {phase === 'result' && (
                          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: totalSum <= 10 ? '#3b82f6' : totalSum >= 11 ? '#ef4444' : '#f59e0b' }}>
                            {totalSum <= 10 ? 'Small' : 'Big'} {dice[0]===dice[1]&&dice[1]===dice[2] ? '· Triple!' : ''}
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Main bets: Small / Big / Any Triple */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {mainBets.map(b => {
                  const cfg = mainBetConfig[b.id];
                  const amt = placedBets[b.id] || 0;
                  const isWinBet = winningBets.includes(b.id);
                  return (
                    <motion.button key={b.id}
                      whileTap={phase === 'betting' ? { scale: 0.96 } : {}}
                      animate={isWinBet ? { boxShadow: ['0 0 0px rgba(74,222,128,0)', '0 0 28px rgba(74,222,128,0.4)', '0 0 14px rgba(74,222,128,0.2)'] } : {}}
                      transition={isWinBet ? { duration: 0.8, repeat: 2 } : {}}
                      onClick={() => placeBet(b.id)}
                      disabled={phase !== 'betting'}
                      style={{
                        padding: '22px 10px', borderRadius: 16, border: '2px solid', textAlign: 'center',
                        borderColor: isWinBet ? '#4ade80' : amt > 0 ? cfg.accent : 'rgba(255,255,255,0.09)',
                        background: isWinBet ? 'rgba(74,222,128,0.1)' : amt > 0 ? `${cfg.accent}18` : 'rgba(255,255,255,0.03)',
                        color: '#fff', cursor: phase !== 'betting' ? 'default' : 'pointer',
                        opacity: phase === 'result' && !isWinBet ? 0.4 : 1,
                        position: 'relative', transition: 'all 0.18s',
                      }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: isWinBet ? '#4ade80' : amt > 0 ? cfg.accent : '#fff', marginBottom: 3 }}>{b.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{cfg.sub}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isWinBet ? '#4ade80' : cfg.accent }}>{b.description}</div>
                      {amt > 0 && <ChipBadge value={amt} />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Specific totals */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Specific Total</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
                  {totalBets.map(b => {
                    const amt = placedBets[b.id] || 0;
                    const isWinBet = winningBets.includes(b.id);
                    const pc = payoutColor(b.payout);
                    const pbg = payoutBg(b.payout);
                    return (
                      <motion.button key={b.id}
                        whileTap={phase === 'betting' ? { scale: 0.93 } : {}}
                        animate={isWinBet ? { scale: [1, 1.1, 1.05] } : {}}
                        onClick={() => placeBet(b.id)}
                        disabled={phase !== 'betting'}
                        style={{
                          padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, border: '1px solid', textAlign: 'center',
                          borderColor: isWinBet ? '#4ade80' : amt > 0 ? pc : 'rgba(255,255,255,0.08)',
                          background: isWinBet ? 'rgba(74,222,128,0.12)' : amt > 0 ? `${pc}22` : pbg,
                          color: isWinBet ? '#4ade80' : amt > 0 ? pc : pc,
                          cursor: phase !== 'betting' ? 'default' : 'pointer',
                          opacity: phase === 'result' && !isWinBet ? 0.3 : 1,
                          position: 'relative', transition: 'all 0.15s',
                        }}>
                        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 1 }}>{b.label}</div>
                        <div style={{ fontSize: 9, opacity: 0.7 }}>{b.description}</div>
                        {amt > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: '#f59e0b', color: '#000', fontSize: 8, borderRadius: '50%', width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>$</span>}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Pairs & Triples */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Pairs */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' }}>Pairs</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa' }}>10:1</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
                    {pairBets.map(b => {
                      const amt = placedBets[b.id] || 0;
                      const isWinBet = winningBets.includes(b.id);
                      return (
                        <motion.button key={b.id}
                          whileTap={phase === 'betting' ? { scale: 0.9 } : {}}
                          animate={isWinBet ? { scale: [1, 1.15, 1.05] } : {}}
                          onClick={() => placeBet(b.id)}
                          disabled={phase !== 'betting'}
                          style={{
                            padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 900, border: '1px solid', textAlign: 'center',
                            borderColor: isWinBet ? '#4ade80' : amt > 0 ? '#60a5fa' : 'rgba(255,255,255,0.08)',
                            background: isWinBet ? 'rgba(74,222,128,0.12)' : amt > 0 ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                            color: isWinBet ? '#4ade80' : amt > 0 ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                            cursor: phase !== 'betting' ? 'default' : 'pointer',
                            opacity: phase === 'result' && !isWinBet ? 0.3 : 1,
                            position: 'relative', transition: 'all 0.15s',
                          }}>
                          {b.label}
                          {amt > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#f59e0b', color: '#000', fontSize: 7, borderRadius: '50%', width: 13, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>$</span>}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Triples */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' }}>Triples</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b' }}>180:1</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
                    {tripleBets.map(b => {
                      const amt = placedBets[b.id] || 0;
                      const isWinBet = winningBets.includes(b.id);
                      return (
                        <motion.button key={b.id}
                          whileTap={phase === 'betting' ? { scale: 0.9 } : {}}
                          animate={isWinBet ? { scale: [1, 1.2, 1.05] } : {}}
                          onClick={() => placeBet(b.id)}
                          disabled={phase !== 'betting'}
                          style={{
                            padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 900, border: '1px solid', textAlign: 'center',
                            borderColor: isWinBet ? '#4ade80' : amt > 0 ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                            background: isWinBet ? 'rgba(74,222,128,0.12)' : amt > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                            color: isWinBet ? '#4ade80' : amt > 0 ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                            cursor: phase !== 'betting' ? 'default' : 'pointer',
                            opacity: phase === 'result' && !isWinBet ? 0.3 : 1,
                            position: 'relative', transition: 'all 0.15s',
                          }}>
                          {b.label}
                          {amt > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#f59e0b', color: '#000', fontSize: 7, borderRadius: '50%', width: 13, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>$</span>}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <GameRules gameId="sicbo" />
          </div>
        </div>

        {/* Win / Loss overlay */}
        <AnimatePresence>
          {showOverlay && lastProfit !== null && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 100 }}>
              {isWin && [1,2,3].map(i => (
                <motion.div key={i}
                  initial={{ scale: 0, opacity: 0.7 }}
                  animate={{ scale: 5 + i * 1.5, opacity: 0 }}
                  transition={{ duration: 1.1, delay: i * 0.14, ease: 'easeOut' }}
                  style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '2px solid #4ade80' }} />
              ))}
              <motion.div
                initial={{ scale: 0.3, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -30 }}
                transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                style={{
                  borderRadius: 24, padding: '28px 52px', textAlign: 'center',
                  background: isWin ? 'rgba(5,46,22,0.95)' : 'rgba(69,10,10,0.95)',
                  border: `2px solid ${isWin ? '#4ade80' : '#f87171'}`,
                  boxShadow: `0 0 60px ${isWin ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.25)'}`,
                }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: isWin ? '#4ade80' : '#f87171', marginBottom: 6 }}>
                  {isWin ? '🎉 WIN' : '💀 LOSE'}
                </div>
                <div style={{ fontSize: 52, fontWeight: 900, color: isWin ? '#4ade80' : '#f87171', lineHeight: 1, letterSpacing: -2 }}>
                  {lastProfit >= 0 ? `+$${lastProfit.toFixed(2)}` : `-$${Math.abs(lastProfit).toFixed(2)}`}
                </div>
                {winningBets.length > 0 && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                    {winningBets.length} winning bet{winningBets.length > 1 ? 's' : ''} · Total {totalSum}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}

function ChipBadge({ value }: { value: number }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      style={{
        position: 'absolute', top: -10, right: -10,
        minWidth: 28, height: 28, borderRadius: 14, paddingInline: 5,
        background: '#f59e0b', border: '2px solid #0d0d12',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 900, color: '#000',
        boxShadow: '0 2px 8px rgba(245,158,11,0.5)',
      }}>
      ${value}
    </motion.div>
  );
}
