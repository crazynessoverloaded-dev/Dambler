import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [1, 5, 10, 25, 50, 100];

const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

function Rocket({ flying, won, phase }: { flying: boolean; won: boolean; phase: string }) {
  const color = phase === 'result' ? (won ? '#4ade80' : '#f87171') : '#818cf8';
  return (
    <svg width="80" height="130" viewBox="0 0 80 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lbody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="lnose" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
        <linearGradient id="lfin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={phase === 'result' && won ? '#16a34a' : phase === 'result' ? '#b91c1c' : '#4338ca'} />
        </linearGradient>
        <radialGradient id="lwin" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.7" />
        </radialGradient>
      </defs>

      {/* Body */}
      <path d="M40 8 C26 20 21 46 21 66 L59 66 C59 46 54 20 40 8Z" fill="url(#lbody)" />
      {/* Nose */}
      <path d="M28 26 C28 10 52 10 52 26 L40 8Z" fill="url(#lnose)" />
      {/* Body details - rivets */}
      <rect x="21" y="52" width="38" height="4" rx="1" fill={color} opacity="0.6" />
      <rect x="21" y="44" width="38" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
      {/* Window */}
      <circle cx="40" cy="40" r="10" fill="url(#lwin)" />
      <circle cx="37" cy="37" r="4" fill="white" opacity="0.55" />
      <circle cx="42" cy="43" r="2" fill="white" opacity="0.2" />
      {/* Fins */}
      <path d="M21 66 L7 88 L22 80Z" fill="url(#lfin)" />
      <path d="M59 66 L73 88 L58 80Z" fill="url(#lfin)" />
      {/* Small side fins */}
      <path d="M21 60 L14 70 L21 68Z" fill={color} opacity="0.5" />
      <path d="M59 60 L66 70 L59 68Z" fill={color} opacity="0.5" />
      {/* Nozzle */}
      <path d="M28 66 L24 76 L56 76 L52 66Z" fill="#334155" />
      <rect x="33" y="74" width="14" height="4" rx="1" fill="#1e293b" />

      {/* Exhaust — only when flying */}
      {flying && (
        <>
          <ellipse cx="40" cy="82" rx="10" ry="5" fill="#fde68a" opacity="0.98" />
          <ellipse cx="40" cy="90" rx="8" ry="9" fill="#fbbf24" opacity="0.9" />
          <ellipse cx="40" cy="100" rx="6" ry="10" fill="#f97316" opacity="0.78" />
          <ellipse cx="40" cy="112" rx="4" ry="11" fill="#ef4444" opacity="0.58" />
          <ellipse cx="40" cy="123" rx="2.5" ry="8" fill="#b91c1c" opacity="0.3" />
        </>
      )}
      {/* Idle glow under nozzle */}
      {!flying && (
        <ellipse cx="40" cy="78" rx="6" ry="3" fill={color} opacity="0.3" />
      )}
    </svg>
  );
}

function Starfield() {
  const stars = useMemo(() => [
    [7,4,1.4,0.65],[22,11,0.9,0.38],[43,3,1.8,0.7],[68,8,1.0,0.42],[84,4,1.2,0.55],[95,14,0.7,0.3],
    [3,21,0.9,0.4],[15,32,1.5,0.55],[35,16,0.7,0.28],[56,22,1.1,0.48],[75,18,0.8,0.35],[91,28,1.3,0.55],
    [6,43,1.0,0.42],[28,45,1.6,0.6],[51,36,0.7,0.3],[72,40,1.0,0.44],[88,47,0.8,0.35],
    [12,57,1.2,0.5],[40,54,0.6,0.26],[63,61,1.4,0.52],[81,54,0.9,0.4],[97,65,1.0,0.44],
    [18,69,0.7,0.3],[38,74,1.3,0.52],[58,67,0.8,0.36],[78,72,1.5,0.58],[4,81,1.0,0.4],
    [25,86,1.2,0.47],[48,89,0.7,0.3],[73,84,1.0,0.44],[93,79,0.8,0.35],
    [61,13,2.0,0.72],[32,62,1.6,0.62],[50,47,0.5,0.22],[86,33,1.1,0.48],[11,77,1.0,0.4],
  ], []);
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      {stars.map(([x, y, r, o], i) => (
        <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="white" opacity={o} />
      ))}
    </svg>
  );
}

export default function Limbo() {
  const { balance, balanceRef, setBalance } = useGameWallet('Limbo');
  const [bet, setBet] = useState(10);
  const [target, setTarget] = useState('2.00');
  const [phase, setPhase] = useState<'idle' | 'flying' | 'result'>('idle');
  const [displayMult, setDisplayMult] = useState(1.00);
  const [result, setResult] = useState(0);
  const [won, setWon] = useState(false);
  const [history, setHistory] = useState<{ target: number; result: number; profit: number }[]>([]);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const targetNum = Math.max(1.01, Math.min(1000, parseFloat(target) || 2));
  const maxWin = +(bet * targetNum).toFixed(2);
  const winChance = +(99 / targetNum).toFixed(2);

  const launch = () => {
    if (phase !== 'idle' || bet > balance) return;
    const rand = Math.random();
    const serverResult = +(0.95 / (1 - rand)).toFixed(2);
    const finalResult = Math.min(1000, Math.max(1.01, serverResult));
    const playerWon = finalResult >= targetNum;

    setPhase('flying');
    setDisplayMult(1.00);

    let current = 1.00;
    animRef.current = setInterval(() => {
      current = current < 10 ? current + 0.05 : current < 50 ? current + 0.3 : current + 2;
      if (current >= finalResult) {
        clearInterval(animRef.current!);
        setDisplayMult(finalResult);
        const profit = playerWon ? +(bet * (targetNum - 1)).toFixed(2) : -bet;
        setBalance(prev => +(prev + profit).toFixed(2));
        setResult(finalResult);
        setWon(playerWon);
        setHistory(prev => [{ target: targetNum, result: finalResult, profit }, ...prev.slice(0, 9)]);
        setPhase('result');
      } else {
        setDisplayMult(+current.toFixed(2));
      }
    }, 30);
  };

  useEffect(() => () => { if (animRef.current) clearInterval(animRef.current); }, []);
  const reset = () => { setPhase('idle'); setDisplayMult(1.00); };

  const multColor =
    phase === 'flying' ? '#818cf8' :
    phase === 'result' ? (won ? '#4ade80' : '#f87171') :
    'rgba(255,255,255,0.15)';

  const borderColor =
    phase === 'result' ? (won ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)') :
    phase === 'flying' ? 'rgba(99,102,241,0.35)' :
    'rgba(99,102,241,0.18)';

  const glowBg =
    phase === 'flying' ? 'radial-gradient(ellipse at 50% 75%, rgba(99,102,241,0.22) 0%, transparent 65%)' :
    phase === 'result' && won ? 'radial-gradient(ellipse at 50% 75%, rgba(255,255,255,0.0) 0%, transparent 65%)' :
    phase === 'result' ? 'radial-gradient(ellipse at 50% 75%, rgba(248,113,113,0.18) 0%, transparent 65%)' :
    'none';

  return (
    <MainLayout>
      <div style={{ background: '#0d0d12', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Top ambient */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 600, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% -10%, rgba(99,102,241,0.25) 0%, rgba(255,255,255,0.0) 40%, transparent 70%)',
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 44, fontWeight: 900, letterSpacing: -2, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4ade80 60%, #86efac 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Limbo</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>
                Set a target multiplier — win if the rocket reaches it
              </p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 220px', gap: 20, alignItems: 'start' }}>

            {/* ── Controls ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Target */}
              <div style={panel}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Target Multiplier</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <input
                    type="number" min="1.01" max="1000" step="0.01"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    disabled={phase === 'flying'}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 17, fontWeight: 800,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)',
                      color: '#818cf8', outline: 'none', opacity: phase === 'flying' ? 0.5 : 1,
                    }}
                  />
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#818cf8' }}>×</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                  {[1.5, 2, 5, 10, 25, 100].map(v => (
                    <button key={v} onClick={() => setTarget(String(v))} disabled={phase === 'flying'}
                      style={{
                        padding: '5px 9px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                        border: `1px solid ${parseFloat(target) === v ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                        background: parseFloat(target) === v ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                        color: parseFloat(target) === v ? '#818cf8' : 'rgba(255,255,255,0.38)',
                        cursor: phase === 'flying' ? 'not-allowed' : 'pointer',
                        opacity: phase === 'flying' ? 0.45 : 1, transition: 'all 0.15s',
                      }}>{v}×</button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>
                  <span>Win chance</span>
                  <span style={{ color: '#818cf8', fontWeight: 700 }}>{winChance}%</span>
                </div>
              </div>

              {/* Bet */}
              <div style={panel}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Bet Amount</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                  {CHIPS.map(c => (
                    <button key={c} onClick={() => phase === 'idle' && setBet(c)} disabled={phase !== 'idle'}
                      style={{
                        padding: '6px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                        border: `1px solid ${bet === c ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                        background: bet === c ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                        color: bet === c ? '#818cf8' : 'rgba(255,255,255,0.38)',
                        cursor: phase !== 'idle' ? 'not-allowed' : 'pointer',
                        opacity: phase !== 'idle' ? 0.45 : 1, transition: 'all 0.15s',
                      }}>${c}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setBet(p => Math.max(1, Math.floor(p / 2)))} disabled={phase !== 'idle'}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', cursor: phase !== 'idle' ? 'not-allowed' : 'pointer', opacity: phase !== 'idle' ? 0.45 : 1 }}>½</button>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 12px', fontSize: 14, fontWeight: 800, color: '#fff', textAlign: 'center' }}>${bet}</div>
                  <button onClick={() => setBet(p => Math.min(balance, p * 2))} disabled={phase !== 'idle'}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', cursor: phase !== 'idle' ? 'not-allowed' : 'pointer', opacity: phase !== 'idle' ? 0.45 : 1 }}>2×</button>
                </div>
              </div>

              {/* Potential */}
              <div style={{ ...panel, padding: '14px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: 1 }}>Max Win at {targetNum.toFixed(2)}×</p>
                <p style={{ fontSize: 24, fontWeight: 900, color: '#818cf8', margin: 0 }}>${maxWin}</p>
              </div>

              {/* Result card */}
              <AnimatePresence>
                {phase === 'result' && (
                  <motion.div initial={{ opacity: 0, scale: 0.88, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    style={{
                      borderRadius: 14, padding: '16px 12px', textAlign: 'center',
                      border: `1px solid ${won ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)'}`,
                      background: won ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                    }}>
                    <p style={{ fontSize: 30, margin: 0, fontWeight: 900, color: won ? '#4ade80' : '#f87171' }}>
                      {won ? `+$${(bet * (targetNum - 1)).toFixed(2)}` : `-$${bet}`}
                    </p>
                    <p style={{ fontSize: 11, marginTop: 5, color: 'rgba(255,255,255,0.38)' }}>
                      {won ? 'Target reached!' : `Crashed at ${result.toFixed(2)}×`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA */}
              {phase !== 'flying' ? (
                <motion.button onClick={phase === 'result' ? reset : launch} disabled={bet > balance}
                  whileHover={{ scale: bet > balance ? 1 : 1.025 }} whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', padding: '15px 0', borderRadius: 12, border: 'none',
                    cursor: bet > balance ? 'not-allowed' : 'pointer',
                    background: bet > balance
                      ? 'rgba(255,255,255,0.07)'
                      : 'linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #818cf8 100%)',
                    color: bet > balance ? 'rgba(255,255,255,0.2)' : '#fff',
                    fontWeight: 900, fontSize: 14, letterSpacing: 0.5, transition: 'all 0.2s',
                    boxShadow: bet > balance ? 'none' : '0 4px 32px rgba(99,102,241,0.5)',
                  }}>
                  {phase === 'result' ? 'Launch Again' : `LAUNCH — $${bet}`}
                </motion.button>
              ) : (
                <button disabled style={{
                  width: '100%', padding: '15px 0', borderRadius: 12, border: 'none',
                  background: 'rgba(99,102,241,0.2)', color: 'rgba(255,255,255,0.35)',
                  fontWeight: 900, fontSize: 14, cursor: 'not-allowed',
                }}>Flying…</button>
              )}
            </div>

            {/* ── Game Visual ── */}
            <div style={{
              position: 'relative', minHeight: 560,
              background: 'linear-gradient(180deg, #030410 0%, #050716 40%, #040a14 100%)',
              border: `1px solid ${borderColor}`,
              borderRadius: 20, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              transition: 'border-color 0.6s',
            }}>
              <Starfield />

              {/* Dynamic glow layer */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                background: glowBg,
                transition: 'background 0.7s',
              }} />

              {/* Main content */}
              <div style={{
                position: 'relative', zIndex: 1, flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 20, padding: '48px 32px 40px',
              }}>

                {phase === 'idle' ? (
                  <>
                    <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                      <Rocket flying={false} won={false} phase="idle" />
                    </motion.div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: -0.5 }}>
                        Ready for Liftoff?
                      </p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                        Configure your target multiplier and launch
                      </p>
                    </div>
                    <div style={{
                      padding: '10px 28px', borderRadius: 10,
                      background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                      fontSize: 13, color: '#818cf8', fontWeight: 700,
                    }}>
                      Target {targetNum.toFixed(2)}× &nbsp;·&nbsp; Max win ${maxWin}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Giant multiplier */}
                    <div style={{ textAlign: 'center', lineHeight: 1, position: 'relative' }}>
                      {/* Glow halo behind number */}
                      <div style={{
                        position: 'absolute', inset: '-20px',
                        background: `radial-gradient(ellipse at 50% 50%, ${multColor}28 0%, transparent 70%)`,
                        pointerEvents: 'none',
                        transition: 'background 0.3s',
                      }} />
                      <motion.p
                        animate={phase === 'flying' ? { scale: [1, 1.012, 1] } : {}}
                        transition={{ duration: 0.25, repeat: Infinity }}
                        style={{
                          fontSize: 108, fontWeight: 900, margin: 0,
                          letterSpacing: -4, fontVariantNumeric: 'tabular-nums',
                          color: multColor,
                          textShadow: phase !== 'idle'
                            ? `0 0 60px ${multColor}80, 0 0 120px ${multColor}30`
                            : 'none',
                          transition: 'color 0.3s, text-shadow 0.3s',
                          position: 'relative',
                        }}>
                        {displayMult.toFixed(2)}×
                      </motion.p>
                    </div>

                    {/* Target chip */}
                    <div style={{
                      padding: '7px 22px', borderRadius: 20,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      Target: {targetNum.toFixed(2)}×
                      {phase === 'flying' && displayMult >= targetNum && (
                        <span style={{ color: '#4ade80', fontWeight: 900 }}>✓ HIT</span>
                      )}
                    </div>

                    {/* Rocket */}
                    <motion.div
                      animate={phase === 'flying' ? { y: [-5, 5], rotate: [-2, 2] } : {}}
                      transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse' }}>
                      <Rocket flying={phase === 'flying'} won={won} phase={phase} />
                    </motion.div>

                    {/* Result overlay */}
                    <AnimatePresence>
                      {phase === 'result' && (
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: 40, fontWeight: 900, margin: '0 0 6px',
                            color: won ? '#4ade80' : '#f87171' }}>
                            {won ? `+$${(bet * (targetNum - 1)).toFixed(2)}` : `-$${bet}`}
                          </p>
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                            {won
                              ? `Landed at ${result.toFixed(2)}× — above target!`
                              : `Crashed at ${result.toFixed(2)}× — below target`}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* History */}
                {history.length > 0 && (
                  <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, marginTop: 4 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)', marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>Recent Launches</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {history.map((h, i) => (
                        <div key={i} style={{
                          padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: h.profit > 0 ? 'rgba(255,255,255,0.0)' : 'rgba(248,113,113,0.1)',
                          border: `1px solid ${h.profit > 0 ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
                          color: h.profit > 0 ? '#4ade80' : '#f87171',
                        }}>
                          {h.result.toFixed(2)}× {h.profit > 0 ? `+$${h.profit}` : `-$${Math.abs(h.profit)}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rules */}
            <div><GameRules gameId="limbo" variant="side" /></div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}


