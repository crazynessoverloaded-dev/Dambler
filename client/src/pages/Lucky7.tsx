import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

type BetType = 'under' | 'seven' | 'over';
type Phase = 'betting' | 'rolling' | 'result';

const BET_CONFIG: Record<BetType, { label: string; sublabel: string; payout: number; range: string; accent: string; glow: string }> = {
  under: { label: 'UNDER 7', sublabel: '2 – 6',    payout: 2, range: '41.7%', accent: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },
  seven: { label: 'LUCKY 7', sublabel: 'Exactly 7', payout: 5, range: '16.7%', accent: '#f59e0b', glow: 'rgba(245,158,11,0.4)'  },
  over:  { label: 'OVER 7',  sublabel: '8 – 12',   payout: 2, range: '41.7%', accent: '#ef4444', glow: 'rgba(239,68,68,0.35)'  },
};

const CHIP_VALUES = [1, 5, 10, 25, 50, 100];
const CHIP_COLORS: Record<number, string> = {
  1: '#e2e8f0', 5: '#ef4444', 10: '#3b82f6',
  25: '#10b981', 50: '#f59e0b', 100: '#8b5cf6',
};

// probability weight for each sum 2–12
const SUM_PROB: Record<number, number> = {
  2:1, 3:2, 4:3, 5:4, 6:5, 7:6, 8:5, 9:4, 10:3, 11:2, 12:1
};

const PIP: Record<number, [number, number][]> = {
  1: [[50,50]],
  2: [[28,28],[72,72]],
  3: [[28,28],[50,50],[72,72]],
  4: [[28,28],[72,28],[28,72],[72,72]],
  5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
  6: [[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]],
};

function Die({ value, rolling, accent, idx }: { value: number; rolling: boolean; accent?: string; idx: number }) {
  const dir = idx === 0 ? 1 : -1;
  return (
    <motion.div
      animate={rolling ? {
        rotate: [0, dir*120, dir*240, dir*380, dir*520, dir*660, dir*720],
        x: [0, dir*-10, dir*12, dir*-8, dir*6, dir*-3, 0],
        y: [0, -12, 6, -10, 4, -6, 0],
        scale: [1, 1.08, 0.94, 1.06, 0.96, 1.02, 1],
      } : { rotate: 0, x: 0, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      style={{ filter: rolling ? `drop-shadow(0 0 18px ${accent ?? 'rgba(255,255,255,0.3)'})` : accent ? `drop-shadow(0 0 12px ${accent}88)` : 'none' }}
    >
      <div style={{
        width: 96, height: 96, borderRadius: 18,
        background: 'linear-gradient(145deg, #ffffff 0%, #e0e0e0 100%)',
        boxShadow: accent
          ? `0 0 0 3px ${accent}, 0 10px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.9)`
          : '0 10px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.9)',
        position: 'relative', transition: 'box-shadow 0.3s',
      }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
          {(PIP[value] ?? []).map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="10" fill={accent ?? '#1a1a2e'} style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }} />
          ))}
        </svg>
      </div>
    </motion.div>
  );
}

function useCountUp(target: number, active: boolean) {
  const [display, setDisplay] = useState(target);
  const frame = useRef<number | null>(null);
  useEffect(() => {
    if (!active) { setDisplay(target); return; }
    let current = 2;
    const step = () => {
      current += 1;
      setDisplay(current);
      if (current < target) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [target, active]);
  return display;
}

export default function Lucky7() {
  const { balance, setBalance } = useGameWallet('Lucky7');
  const [chip, setChip] = useState(10);
  const [betType, setBetType] = useState<BetType | null>(null);
  const [phase, setPhase] = useState<Phase>('betting');
  const [dice, setDice] = useState<[number, number]>([3, 4]);
  const [outcome, setOutcome] = useState<'win' | 'lose' | null>(null);
  const [profit, setProfit] = useState(0);
  const [rollKey, setRollKey] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const [history, setHistory] = useState<{ type: BetType; total: number; win: boolean }[]>([]);
  const [countingUp, setCountingUp] = useState(false);

  const total = dice[0] + dice[1];
  const displayTotal = useCountUp(total, countingUp);

  const totalAccent = total < 7 ? BET_CONFIG.under.accent : total === 7 ? BET_CONFIG.seven.accent : BET_CONFIG.over.accent;
  const totalZone: BetType = total < 7 ? 'under' : total === 7 ? 'seven' : 'over';

  const placeBet = () => {
    if (!betType || chip > balance || phase !== 'betting') return;
    setBalance(b => +(b - chip).toFixed(2));
    setPhase('rolling');
    setOutcome(null);
    setCountingUp(false);
    setRollKey(k => k + 1);

    setTimeout(() => {
      const d1 = Math.ceil(Math.random() * 6);
      const d2 = Math.ceil(Math.random() * 6);
      setDice([d1, d2]);
      const t = d1 + d2;
      const zone: BetType = t < 7 ? 'under' : t === 7 ? 'seven' : 'over';
      const wins = zone === betType;

      if (wins) {
        const pay = +(chip * BET_CONFIG[betType].payout).toFixed(2);
        setBalance(b => +(b + pay).toFixed(2));
        setProfit(+(pay - chip).toFixed(2));
        setOutcome('win');
        setShowBurst(true);
        setTimeout(() => setShowBurst(false), 1800);
      } else {
        setProfit(-chip);
        setOutcome('lose');
      }
      setPhase('result');
      setTimeout(() => setCountingUp(true), 100);
      setHistory(h => [{ type: betType!, total: t, win: wins }, ...h.slice(0, 19)]);
    }, 950);
  };

  const reset = () => {
    setPhase('betting');
    setOutcome(null);
    setCountingUp(false);
  };

  const canBet = betType !== null && chip <= balance && phase === 'betting';

  return (
    <MainLayout>
      <div style={{ background: '#0d0d12', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(245,158,11,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 300, left: '15%', width: 350, height: 350, background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 300, right: '15%', width: 350, height: 350, background: 'radial-gradient(ellipse, rgba(239,68,68,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', padding: '3px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20 }}>
                  🎲 Dice Game
                </span>
              </div>
              <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: 0, color: '#ffffff' }}>Lucky 7</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '4px 0 0' }}>Predict Under 7, Lucky 7, or Over 7 — then roll two dice</p>
            </div>
            <div style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Balance</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '188px 1fr 188px', gap: 16, alignItems: 'start' }}>

            {/* Left panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Chip selector */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Bet Amount</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                  {CHIP_VALUES.map(v => {
                    const active = chip === v;
                    return (
                      <button key={v} onClick={() => { if (phase === 'betting') setChip(v); }}
                        disabled={phase !== 'betting'}
                        style={{
                          padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: phase !== 'betting' ? 'default' : 'pointer',
                          border: `2px solid ${active ? CHIP_COLORS[v] : 'rgba(255,255,255,0.08)'}`,
                          background: active ? `${CHIP_COLORS[v]}20` : 'rgba(255,255,255,0.03)',
                          color: active ? CHIP_COLORS[v] : 'rgba(255,255,255,0.35)',
                          transition: 'all 0.15s', opacity: phase !== 'betting' ? 0.5 : 1,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: CHIP_COLORS[v], opacity: active ? 1 : 0.35, border: '2px dashed rgba(255,255,255,0.4)', flexShrink: 0 }} />
                        ${v}
                      </button>
                    );
                  })}
                </div>
                {betType && (
                  <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Potential win</span>
                    <span style={{ color: BET_CONFIG[betType].accent, fontWeight: 800 }}>
                      +${(chip * BET_CONFIG[betType].payout - chip).toFixed(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* History */}
              {history.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Last Rolls</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {history.slice(0, 15).map((h, i) => (
                      <motion.div key={i}
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: BET_CONFIG[h.type].accent + '22',
                          border: `1px solid ${BET_CONFIG[h.type].accent}55`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 900,
                          color: h.win ? BET_CONFIG[h.type].accent : 'rgba(255,255,255,0.3)',
                        }}>{h.total}</motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payout info */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Payouts</div>
                {(Object.entries(BET_CONFIG) as [BetType, typeof BET_CONFIG[BetType]][]).map(([k, cfg]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, paddingBottom: 7, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: cfg.accent }}>{cfg.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{cfg.range} chance</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{cfg.payout}×</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: main arena */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Dice stage */}
              <div style={{
                borderRadius: 20, overflow: 'hidden', position: 'relative',
                background: 'linear-gradient(160deg, #0f1520 0%, #0a0e18 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '36px 24px 28px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
              }}>
                {/* Grid texture */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px)', pointerEvents: 'none' }} />

                {/* Dice pair */}
                <div style={{ display: 'flex', gap: 28, alignItems: 'center', position: 'relative', zIndex: 1 }}>
                  <Die value={dice[0]} rolling={phase === 'rolling'} accent={phase === 'result' ? totalAccent : undefined} idx={0} />
                  <motion.span
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    style={{ fontSize: 24, color: 'rgba(255,255,255,0.2)', fontWeight: 900, userSelect: 'none' }}>+</motion.span>
                  <Die value={dice[1]} rolling={phase === 'rolling'} accent={phase === 'result' ? totalAccent : undefined} idx={1} />
                </div>

                {/* Sum */}
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <AnimatePresence mode="wait">
                    {phase === 'rolling' ? (
                      <motion.div key="rolling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', gap: 7, justifyContent: 'center', alignItems: 'center', height: 80 }}>
                        {[0,1,2].map(i => (
                          <motion.div key={i}
                            animate={{ scale: [1, 1.6, 1], opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.18 }}
                            style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div key={`sum-${rollKey}`} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}>
                        <motion.div
                          style={{ fontSize: 78, fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}
                          animate={{ color: phase === 'result' ? totalAccent : 'rgba(255,255,255,0.15)' }}
                          transition={{ duration: 0.3 }}
                        >{phase === 'result' ? displayTotal : '?'}</motion.div>
                        {phase === 'result' && (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                            {total < 7 ? 'Under 7' : total === 7 ? '✦ Lucky 7 ✦' : 'Over 7'}
                          </motion.div>
                        )}
                        {phase === 'betting' && (
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
                            {betType ? `Bet: ${BET_CONFIG[betType].label}` : 'Pick a zone below'}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Number line */}
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '14px 16px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
                  Probability Distribution
                </div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 44, justifyContent: 'center' }}>
                  {Array.from({ length: 11 }, (_, i) => i + 2).map(n => {
                    const prob = SUM_PROB[n] / 36;
                    const isResult = phase === 'result' && n === total;
                    const zone: BetType = n < 7 ? 'under' : n === 7 ? 'seven' : 'over';
                    const color = BET_CONFIG[zone].accent;
                    return (
                      <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <motion.div
                          animate={isResult ? { scale: [1, 1.3, 1.1], boxShadow: [`0 0 0px ${color}`, `0 0 16px ${color}`, `0 0 8px ${color}`] } : {}}
                          transition={{ duration: 0.6 }}
                          style={{
                            width: '100%', borderRadius: 3,
                            height: Math.round(prob * 200),
                            background: isResult ? color : `${color}40`,
                            transition: 'background 0.3s',
                          }} />
                        <div style={{ fontSize: 9, fontWeight: isResult ? 900 : 600, color: isResult ? color : 'rgba(255,255,255,0.2)', marginTop: 4 }}>{n}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bet zones */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8 }}>
                {(['under', 'seven', 'over'] as BetType[]).map(key => {
                  const cfg = BET_CONFIG[key];
                  const active = betType === key;
                  const isResult = phase === 'result' && key === totalZone;
                  const isWinZone = isResult && outcome === 'win';
                  return (
                    <motion.button
                      key={key}
                      whileTap={phase === 'betting' ? { scale: 0.96 } : {}}
                      onClick={() => { if (phase === 'betting') setBetType(key); }}
                      animate={isWinZone ? { boxShadow: [`0 0 0px ${cfg.glow}`, `0 0 32px ${cfg.glow}`, `0 0 16px ${cfg.glow}`] } : {}}
                      transition={isWinZone ? { duration: 0.8, repeat: 2 } : {}}
                      style={{
                        padding: key === 'seven' ? '20px 10px' : '20px 14px',
                        borderRadius: 14, border: `2px solid`,
                        borderColor: active ? cfg.accent : isResult ? `${cfg.accent}66` : 'rgba(255,255,255,0.09)',
                        background: active ? `${cfg.accent}18` : isResult ? `${cfg.accent}0e` : 'rgba(255,255,255,0.03)',
                        cursor: phase === 'betting' ? 'pointer' : 'default',
                        transition: 'all 0.18s', textAlign: 'center',
                        opacity: phase === 'result' && key !== totalZone ? 0.35 : 1,
                      }}>
                      <div style={{ fontSize: key === 'seven' ? 13 : 14, fontWeight: 900, color: active || isResult ? cfg.accent : '#fff', marginBottom: 4, letterSpacing: 0.5 }}>{cfg.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: cfg.accent, marginBottom: 2 }}>{cfg.payout}×</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{cfg.sublabel}</div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Action button */}
              <div>
                {phase === 'betting' && (
                  <motion.button
                    whileTap={canBet ? { scale: 0.97 } : {}}
                    onClick={placeBet}
                    disabled={!canBet}
                    style={{
                      width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
                      fontWeight: 900, fontSize: 16, letterSpacing: 1,
                      cursor: canBet ? 'pointer' : 'not-allowed',
                      background: canBet
                        ? betType ? `linear-gradient(135deg, ${BET_CONFIG[betType].accent}, ${BET_CONFIG[betType].accent}bb)` : 'rgba(255,255,255,0.06)'
                        : 'rgba(255,255,255,0.06)',
                      color: canBet ? '#fff' : 'rgba(255,255,255,0.2)',
                      transition: 'all 0.2s',
                      boxShadow: canBet && betType ? `0 4px 24px ${BET_CONFIG[betType].glow}` : 'none',
                    }}>
                    {betType ? `🎲 ROLL — $${chip}` : 'PICK A ZONE TO BET'}
                  </motion.button>
                )}
                {phase === 'rolling' && (
                  <button disabled style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', fontWeight: 900, fontSize: 16, cursor: 'not-allowed' }}>
                    <motion.span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}>🎲</motion.span>
                      Rolling…
                    </motion.span>
                  </button>
                )}
                {phase === 'result' && (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={reset}
                    style={{
                      width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
                      fontWeight: 900, fontSize: 16, letterSpacing: 1, cursor: 'pointer',
                      background: betType ? `linear-gradient(135deg, ${BET_CONFIG[betType].accent}, ${BET_CONFIG[betType].accent}bb)` : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                      boxShadow: betType ? `0 4px 24px ${BET_CONFIG[betType].glow}` : '0 4px 24px rgba(99,102,241,0.35)',
                    }}>
                    ROLL AGAIN
                  </motion.button>
                )}
              </div>
            </div>

            {/* Right panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Zone Stats</div>
                {(['under', 'seven', 'over'] as BetType[]).map(key => {
                  const cfg = BET_CONFIG[key];
                  const count = history.filter(h => (h.total < 7 ? 'under' : h.total === 7 ? 'seven' : 'over') === key).length;
                  const pct = history.length ? Math.round((count / history.length) * 100) : 0;
                  return (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.accent }}>{cfg.label}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{count}/{history.length || 0}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                        <motion.div
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.4 }}
                          style={{ height: '100%', borderRadius: 2, background: cfg.accent }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>How to Win</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.8 }}>
                  Pick <span style={{ color: BET_CONFIG.under.accent, fontWeight: 700 }}>Under</span> if you think the dice total will be 6 or less.<br />
                  Pick <span style={{ color: BET_CONFIG.seven.accent, fontWeight: 700 }}>Lucky 7</span> for the highest payout at exactly 7.<br />
                  Pick <span style={{ color: BET_CONFIG.over.accent, fontWeight: 700 }}>Over</span> if you think the dice total will be 8 or more.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>House Edge</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
                  Under/Over: <span style={{ color: '#fff', fontWeight: 700 }}>2.78%</span><br />
                  Lucky 7: <span style={{ color: '#fff', fontWeight: 700 }}>16.67%</span>
                </div>
              </div>
            </div>

          </div>

          <div style={{ marginTop: 24 }}>
            <GameRules gameId="lucky-7" />
          </div>
        </div>

        {/* Win/Loss overlay */}
        <AnimatePresence>
          {outcome && phase === 'result' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 100 }}>
              {outcome === 'win' && [1,2,3].map(i => (
                <motion.div key={i}
                  initial={{ scale: 0, opacity: 0.7 }}
                  animate={{ scale: 5 + i * 1.5, opacity: 0 }}
                  transition={{ duration: 1.1, delay: i * 0.14, ease: 'easeOut' }}
                  style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: `2px solid ${betType ? BET_CONFIG[betType].accent : '#f59e0b'}` }} />
              ))}
              <motion.div
                initial={{ scale: 0.3, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -30 }}
                transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                style={{
                  borderRadius: 24, padding: '28px 52px', textAlign: 'center',
                  background: outcome === 'win' ? 'rgba(5,46,22,0.95)' : 'rgba(69,10,10,0.95)',
                  border: `2px solid ${outcome === 'win' ? '#4ade80' : '#f87171'}`,
                  boxShadow: `0 0 60px ${outcome === 'win' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.25)'}`,
                }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: outcome === 'win' ? '#4ade80' : '#f87171', marginBottom: 6 }}>
                  {outcome === 'win' ? '🎉 WIN' : '💀 LOSE'}
                </div>
                <div style={{ fontSize: 52, fontWeight: 900, color: outcome === 'win' ? '#4ade80' : '#f87171', lineHeight: 1, letterSpacing: -2 }}>
                  {profit > 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
                  Rolled {total} — {total < 7 ? 'Under 7' : total === 7 ? 'Lucky 7!' : 'Over 7'}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
