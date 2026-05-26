import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';
import { Zap } from 'lucide-react';

type Phase = 'betting' | 'lightning' | 'rolling' | 'result';

const ALL_SUMS = Array.from({ length: 16 }, (_, i) => i + 3);

const BASE_PAYS: Record<number, number> = {
  3:150, 4:55, 5:30, 6:17, 7:12, 8:8, 9:6,
  10:6, 11:6, 12:6, 13:8, 14:12, 15:17, 16:30, 17:55, 18:150,
};

const CHIP_VALUES = [1, 5, 10, 25, 50, 100];
const CHIP_COLORS: Record<number, string> = {
  1:'#e2e8f0', 5:'#ef4444', 10:'#3b82f6', 25:'#10b981', 50:'#f59e0b', 100:'#8b5cf6',
};

const PIP: Record<number, [number,number][]> = {
  1:[[50,50]],
  2:[[28,28],[72,72]],
  3:[[28,28],[50,50],[72,72]],
  4:[[28,28],[72,28],[28,72],[72,72]],
  5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
  6:[[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]],
};

function payTier(p: number) {
  if (p >= 100) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  if (p >= 30)  return { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' };
  if (p >= 12)  return { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' };
  return          { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.04)' };
}

function pickLightning(): Record<number, number> {
  const count = Math.floor(Math.random() * 3) + 1;
  const sums = [...ALL_SUMS].sort(() => Math.random() - 0.5).slice(0, count);
  const mults = [25, 50, 75, 100];
  const result: Record<number, number> = {};
  sums.forEach(s => { result[s] = mults[Math.floor(Math.random() * mults.length)]; });
  return result;
}

function Die({ value, rolling, lit, idx, rollKey }: { value: number; rolling: boolean; lit: boolean; idx: number; rollKey: number }) {
  const dirs = [1, -1, 1];
  const d = dirs[idx];
  const delays = [0, 0.06, 0.12];

  return (
    <motion.div
      key={rollKey}
      animate={rolling ? {
        rotate: [0, d*140, d*290, d*450, d*600, d*720],
        x: [0, d*-10, d*12, d*-8, d*5, 0],
        y: [0, -14, 6, -10, 4, 0],
        scale: [1, 1.1, 0.92, 1.07, 0.95, 1],
      } : { rotate: 0, x: 0, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: 'easeOut', delay: delays[idx] }}
      style={{
        filter: rolling
          ? 'drop-shadow(0 0 20px rgba(234,179,8,0.8))'
          : lit
          ? 'drop-shadow(0 0 16px rgba(234,179,8,0.9))'
          : 'none',
      }}
    >
      <div style={{
        width: 88, height: 88, borderRadius: 18, position: 'relative',
        background: lit
          ? 'linear-gradient(145deg, #fffde7, #fff9c4)'
          : 'linear-gradient(145deg, #ffffff, #e0e0e0)',
        boxShadow: lit
          ? '0 0 0 3px #f59e0b, 0 0 0 6px rgba(245,158,11,0.25), 0 12px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.95)'
          : '0 10px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.9)',
        transition: 'box-shadow 0.3s, background 0.3s',
      }}>
        <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%', position:'absolute', inset:0 }}>
          {(PIP[value]||[]).map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r="10"
              fill={lit ? '#92400e' : '#1a1a2e'}
              style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
          ))}
        </svg>
      </div>
    </motion.div>
  );
}

export default function LightningDice() {
  const { balance, setBalance } = useGameWallet('LightningDice');
  const [bet, setBet] = useState(10);
  const [chosen, setChosen] = useState<number | null>(null);
  const [lightning, setLightning] = useState<Record<number, number>>({});
  const [dice, setDice] = useState<[number,number,number]>([2,5,3]);
  const [phase, setPhase] = useState<Phase>('betting');
  const [profit, setProfit] = useState(0);
  const [rollKey, setRollKey] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [history, setHistory] = useState<{ chosen: number; result: number; profit: number; lit: boolean }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const diceSum = dice[0] + dice[1] + dice[2];
  const isLit = phase === 'result' && chosen !== null && diceSum === chosen && lightning[diceSum] !== undefined;
  const isWin = phase === 'result' && profit > 0;

  const generateLightning = () => {
    if (!chosen || bet > balance) return;
    setBalance(b => parseFloat((b - bet).toFixed(2)));
    setLightning(pickLightning());
    setPhase('lightning');
  };

  const rollDice = useCallback(() => {
    setPhase('rolling');
    setShowOverlay(false);
    setRollKey(k => k + 1);

    intervalRef.current = setInterval(() => {
      setDice([
        Math.ceil(Math.random()*6) as any,
        Math.ceil(Math.random()*6) as any,
        Math.ceil(Math.random()*6) as any,
      ]);
    }, 65);

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const result: [number,number,number] = [
        Math.ceil(Math.random()*6) as any,
        Math.ceil(Math.random()*6) as any,
        Math.ceil(Math.random()*6) as any,
      ];
      setDice(result);
      const sum = result[0] + result[1] + result[2];
      const isChosen = sum === chosen;
      const litMult = isChosen && lightning[sum] !== undefined;
      const multiplier = litMult ? lightning[sum] : BASE_PAYS[sum] ?? 6;
      const p = isChosen ? parseFloat((bet * multiplier).toFixed(2)) : 0;
      if (p > 0) setBalance(b => parseFloat((b + p).toFixed(2)));
      const netProfit = isChosen ? parseFloat((p - bet).toFixed(2)) : -bet;
      setProfit(netProfit);
      if (litMult) { setShowFlash(true); setTimeout(() => setShowFlash(false), 800); }
      setHistory(h => [{ chosen: chosen!, result: sum, profit: netProfit, lit: litMult }, ...h.slice(0, 11)]);
      setPhase('result');
      setTimeout(() => setShowOverlay(true), 350);
    }, 960);
  }, [chosen, lightning, bet]);

  const reset = () => {
    setPhase('betting');
    setChosen(null);
    setLightning({});
    setShowOverlay(false);
    setShowFlash(false);
    setDice([2, 5, 3]);
  };

  const canGenerate = chosen !== null && bet <= balance && phase === 'betting';

  return (
    <MainLayout>
      <div style={{ background: '#0d0d12', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 900, height: 550, background: 'radial-gradient(ellipse, rgba(234,179,8,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 250, left: '10%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(167,139,250,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Lightning flash overlay */}
        <AnimatePresence>
          {showFlash && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: [0, 0.35, 0.1, 0.3, 0] }}
              transition={{ duration: 0.7, times: [0, 0.1, 0.3, 0.5, 1] }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(234,179,8,1)', pointerEvents: 'none', zIndex: 50 }} />
          )}
        </AnimatePresence>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', padding: '3px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20 }}>
                  ⚡ Live Multipliers
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <motion.div animate={{ rotate: [0, -10, 10, -8, 8, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                  <Zap style={{ width: 36, height: 36, color: '#eab308' }} />
                </motion.div>
                <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: 0, color: '#ffffff' }}>Lightning Dice</h1>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '4px 0 0' }}>
                Bet on 3 dice sum (3–18) · Lightning boosts random totals to 25×–100×
              </p>
            </div>
            <div style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Balance</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '196px 1fr 224px', gap: 16, alignItems: 'start' }}>

            {/* Left panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Chip selector */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Bet Amount</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 10 }}>
                  {CHIP_VALUES.map(v => {
                    const active = bet === v;
                    return (
                      <button key={v} onClick={() => { if (phase === 'betting') setBet(v); }}
                        disabled={phase !== 'betting'}
                        style={{
                          padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 800,
                          border: `2px solid ${active ? CHIP_COLORS[v] : 'rgba(255,255,255,0.08)'}`,
                          background: active ? `${CHIP_COLORS[v]}20` : 'rgba(255,255,255,0.03)',
                          color: active ? CHIP_COLORS[v] : 'rgba(255,255,255,0.35)',
                          cursor: phase !== 'betting' ? 'default' : 'pointer',
                          transition: 'all 0.15s', opacity: phase !== 'betting' ? 0.5 : 1,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: CHIP_COLORS[v], opacity: active ? 1 : 0.35, border: '2px dashed rgba(255,255,255,0.35)', flexShrink: 0 }} />
                        ${v}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => { if (phase === 'betting') setBet(p => Math.max(1, Math.floor(p / 2))); }}
                    disabled={phase !== 'betting'}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>½</button>
                  <div style={{ flex: 2, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 0', fontSize: 14, fontWeight: 900, color: '#fff', textAlign: 'center' }}>${bet}</div>
                  <button onClick={() => { if (phase === 'betting') setBet(p => Math.min(balance, p * 2)); }}
                    disabled={phase !== 'betting'}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>2×</button>
                </div>
              </div>

              {/* Chosen sum info */}
              <AnimatePresence>
                {chosen !== null && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      background: lightning[chosen] ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${lightning[chosen] ? 'rgba(234,179,8,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 14, padding: 14,
                    }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Your Bet</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4, textAlign: 'center' }}>{chosen}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 6 }}>Base payout</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: payTier(BASE_PAYS[chosen]).color, textAlign: 'center', marginBottom: lightning[chosen] ? 8 : 0 }}>{BASE_PAYS[chosen]}:1</div>
                    {lightning[chosen] && (
                      <div style={{ borderTop: '1px solid rgba(234,179,8,0.3)', paddingTop: 8, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                          <Zap style={{ width: 12, height: 12, color: '#eab308' }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#eab308', letterSpacing: 1, textTransform: 'uppercase' }}>Lightning!</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#eab308' }}>{lightning[chosen]}:1</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          Win: ${(bet * lightning[chosen]).toFixed(0)}
                        </div>
                      </div>
                    )}
                    {phase === 'betting' && !lightning[chosen] && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 4 }}>
                        Potential: ${(bet * BASE_PAYS[chosen]).toFixed(0)}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* History */}
              {history.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>History</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {history.slice(0, 12).map((h, i) => (
                      <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{
                          padding: '4px 7px', borderRadius: 7, fontSize: 10, fontWeight: 900, border: '1px solid',
                          borderColor: h.profit > 0 ? (h.lit ? 'rgba(234,179,8,0.5)' : 'rgba(74,222,128,0.35)') : 'rgba(248,113,113,0.3)',
                          background: h.profit > 0 ? (h.lit ? 'rgba(234,179,8,0.12)' : 'rgba(74,222,128,0.07)') : 'rgba(248,113,113,0.07)',
                          color: h.profit > 0 ? (h.lit ? '#eab308' : '#4ade80') : '#f87171',
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                        {h.lit && <Zap style={{ width: 8, height: 8 }} />}
                        {h.result}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Center: main arena */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Dice stage */}
              <div style={{
                borderRadius: 20, overflow: 'hidden', position: 'relative',
                background: 'linear-gradient(160deg, #0f1520 0%, #0a0e18 100%)',
                border: `1px solid ${isLit ? 'rgba(234,179,8,0.5)' : phase === 'lightning' ? 'rgba(234,179,8,0.25)' : 'rgba(255,255,255,0.08)'}`,
                transition: 'border-color 0.4s',
                padding: '36px 24px 28px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
              }}>
                {/* Grid texture */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.013) 40px,rgba(255,255,255,0.013) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.013) 40px,rgba(255,255,255,0.013) 41px)', pointerEvents: 'none' }} />

                {/* Lightning phase glow */}
                <AnimatePresence>
                  {phase === 'lightning' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  )}
                </AnimatePresence>

                {/* Lightning hit glow */}
                <AnimatePresence>
                  {isLit && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.25, 0.12] }} transition={{ duration: 0.6 }}
                      style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(234,179,8,0.25) 0%, transparent 65%)', pointerEvents: 'none' }} />
                  )}
                </AnimatePresence>

                {/* Lightning banner */}
                <AnimatePresence>
                  {(phase === 'lightning' || phase === 'rolling' || isLit) && (
                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
                        <Zap style={{ width: 20, height: 20, color: '#eab308' }} />
                      </motion.div>
                      <span style={{
                        fontSize: 13, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
                        color: '#eab308',
                        textShadow: '0 0 20px rgba(234,179,8,0.8)',
                      }}>
                        {isLit ? '⚡ LIGHTNING HIT!' : 'Lightning Active'}
                      </span>
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}>
                        <Zap style={{ width: 20, height: 20, color: '#eab308' }} />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Three dice */}
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', position: 'relative', zIndex: 1 }}>
                  {[0,1,2].map(i => (
                    <Die key={`d${i}`} value={dice[i]} rolling={phase === 'rolling'} lit={isLit} idx={i} rollKey={rollKey} />
                  ))}
                </div>

                {/* Sum display */}
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <AnimatePresence mode="wait">
                    {phase === 'rolling' ? (
                      <motion.div key="rolling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', height: 72 }}>
                        {[0,1,2].map(i => (
                          <motion.div key={i} animate={{ scale: [1, 1.7, 1], opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.16 }}
                            style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div key={`sum-${rollKey}`}
                        initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 310, damping: 20 }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Total</div>
                        <motion.div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}
                          animate={{ color: isLit ? '#eab308' : phase === 'result' ? (isWin ? '#4ade80' : '#f87171') : 'rgba(255,255,255,0.12)' }}
                          transition={{ duration: 0.3 }}>
                          {phase === 'result' ? diceSum : '?'}
                        </motion.div>
                        {phase === 'result' && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                            style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontWeight: 600 }}>
                            {chosen !== null && diceSum === chosen
                              ? isLit ? `⚡ Lightning ${lightning[diceSum]}× multiplier!` : `Correct — sum ${diceSum}`
                              : `Sum ${diceSum} — not ${chosen}`
                            }
                          </motion.div>
                        )}
                        {phase === 'betting' && (
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)', marginTop: 4 }}>
                            {chosen ? 'Ready to roll' : 'Pick a sum to begin'}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action buttons */}
              <div>
                {phase === 'betting' && (
                  <motion.button
                    whileTap={canGenerate ? { scale: 0.97 } : {}}
                    onClick={generateLightning}
                    disabled={!canGenerate}
                    style={{
                      width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
                      fontWeight: 900, fontSize: 16, letterSpacing: 0.5,
                      cursor: canGenerate ? 'pointer' : 'not-allowed',
                      background: canGenerate ? 'linear-gradient(135deg, #ca8a04, #eab308, #fbbf24)' : 'rgba(255,255,255,0.06)',
                      color: canGenerate ? '#000' : 'rgba(255,255,255,0.2)',
                      boxShadow: canGenerate ? '0 4px 24px rgba(234,179,8,0.4)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                    {chosen ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Zap style={{ width: 18, height: 18 }} />
                        GENERATE LIGHTNING — ${bet} on {chosen}
                        <Zap style={{ width: 18, height: 18 }} />
                      </span>
                    ) : 'PICK A SUM FIRST'}
                  </motion.button>
                )}
                {phase === 'lightning' && (
                  <motion.button
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={rollDice}
                    style={{
                      width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
                      fontWeight: 900, fontSize: 16, letterSpacing: 0.5, cursor: 'pointer',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff', boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
                    }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      🎲 ROLL DICE
                    </span>
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
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={reset}
                    style={{
                      width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
                      fontWeight: 900, fontSize: 16, letterSpacing: 0.5, cursor: 'pointer',
                      background: 'linear-gradient(135deg, #ca8a04, #eab308, #fbbf24)',
                      color: '#000', boxShadow: '0 4px 24px rgba(234,179,8,0.4)',
                    }}>
                    NEW ROUND
                  </motion.button>
                )}
              </div>
            </div>

            {/* Right: Sum picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Pick a Sum</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {ALL_SUMS.map(s => {
                    const isSelected = chosen === s;
                    const litMult = lightning[s];
                    const tier = payTier(BASE_PAYS[s]);
                    const isResult = phase === 'result' && diceSum === s;

                    return (
                      <motion.button
                        key={s}
                        whileTap={phase === 'betting' ? { scale: 0.97 } : {}}
                        animate={litMult ? { boxShadow: ['0 0 0px rgba(234,179,8,0)', '0 0 12px rgba(234,179,8,0.4)', '0 0 6px rgba(234,179,8,0.2)'] } : {}}
                        transition={litMult ? { duration: 1.2, repeat: Infinity } : {}}
                        onClick={() => { if (phase === 'betting') setChosen(s); }}
                        disabled={phase !== 'betting'}
                        style={{
                          padding: '8px 10px', borderRadius: 10, border: '1px solid', cursor: phase !== 'betting' ? 'default' : 'pointer',
                          borderColor: isResult ? (isWin ? '#4ade80' : '#f87171') : isSelected ? '#eab308' : litMult ? 'rgba(234,179,8,0.45)' : 'rgba(255,255,255,0.07)',
                          background: isResult ? (isWin ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.08)') : isSelected ? 'rgba(234,179,8,0.14)' : litMult ? 'rgba(234,179,8,0.07)' : tier.bg,
                          transition: 'all 0.15s',
                          opacity: phase === 'result' && !isResult && !isSelected ? 0.4 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {litMult && (
                            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                              <Zap style={{ width: 11, height: 11, color: '#eab308', flexShrink: 0 }} />
                            </motion.div>
                          )}
                          <span style={{ fontSize: 14, fontWeight: 900, color: isSelected ? '#eab308' : isResult ? (isWin ? '#4ade80' : '#f87171') : '#fff' }}>{s}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {litMult ? (
                            <span style={{ fontSize: 12, fontWeight: 900, color: '#eab308' }}>{litMult}×</span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 700, color: tier.color }}>{BASE_PAYS[s]}:1</span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Lightning multipliers legend */}
              <div style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Zap style={{ width: 12, height: 12, color: '#eab308' }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#eab308', letterSpacing: 2, textTransform: 'uppercase' }}>Lightning Boosts</div>
                </div>
                {[100, 75, 50, 25].map(m => (
                  <div key={m} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Multiplier</span>
                    <span style={{ color: '#eab308', fontWeight: 800 }}>{m}×</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(234,179,8,0.15)', marginTop: 8, paddingTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
                  1–3 random sums get boosted each round before you roll.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <GameRules gameId="lightning-dice" />
          </div>
        </div>

        {/* Win / Loss overlay */}
        <AnimatePresence>
          {showOverlay && phase === 'result' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 100 }}>
              {(isWin || isLit) && [1,2,3].map(i => (
                <motion.div key={i}
                  initial={{ scale: 0, opacity: 0.7 }}
                  animate={{ scale: 5 + i * 1.5, opacity: 0 }}
                  transition={{ duration: 1.1, delay: i * 0.13, ease: 'easeOut' }}
                  style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: `2px solid ${isLit ? '#eab308' : '#4ade80'}` }} />
              ))}
              <motion.div
                initial={{ scale: 0.3, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -30 }}
                transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                style={{
                  borderRadius: 24, padding: '28px 52px', textAlign: 'center',
                  background: isLit ? 'rgba(66,32,0,0.96)' : isWin ? 'rgba(5,46,22,0.96)' : 'rgba(69,10,10,0.96)',
                  border: `2px solid ${isLit ? '#eab308' : isWin ? '#4ade80' : '#f87171'}`,
                  boxShadow: `0 0 60px ${isLit ? 'rgba(234,179,8,0.35)' : isWin ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.25)'}`,
                }}>
                {isLit && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                    <Zap style={{ width: 22, height: 22, color: '#eab308' }} />
                    <Zap style={{ width: 22, height: 22, color: '#eab308' }} />
                    <Zap style={{ width: 22, height: 22, color: '#eab308' }} />
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: isLit ? '#eab308' : isWin ? '#4ade80' : '#f87171', marginBottom: 6 }}>
                  {isLit ? '⚡ LIGHTNING WIN' : isWin ? '🎉 WIN' : '💀 LOSE'}
                </div>
                <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, letterSpacing: -2, color: isLit ? '#eab308' : isWin ? '#4ade80' : '#f87171' }}>
                  {profit > 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                </div>
                {isLit && chosen !== null && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                    {lightning[chosen]}× multiplier on sum {chosen}
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
