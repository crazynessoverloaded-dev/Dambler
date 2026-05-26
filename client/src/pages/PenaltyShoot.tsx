import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [5, 10, 25, 50, 100];

const ZONES = ['Top Left', 'Top Right', 'Center', 'Bottom Left', 'Bottom Right'] as const;
type Zone = typeof ZONES[number];
type Phase = 'betting' | 'shooting' | 'result';

const ZONE_POS: Record<Zone, { x: number; y: number }> = {
  'Top Left':     { x: 18, y: 20 },
  'Top Right':    { x: 82, y: 20 },
  'Center':       { x: 50, y: 50 },
  'Bottom Left':  { x: 18, y: 78 },
  'Bottom Right': { x: 82, y: 78 },
};

const ZONE_LABEL: Record<Zone, string> = {
  'Top Left': 'TL', 'Top Right': 'TR', 'Center': 'C', 'Bottom Left': 'BL', 'Bottom Right': 'BR',
};

const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 20,
};

export default function PenaltyShoot() {
  const { balance, balanceRef, setBalance } = useGameWallet('PenaltyShoot');
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState<Phase>('betting');
  const [pick, setPick] = useState<Zone | null>(null);
  const [blocked, setBlocked] = useState<Zone[]>([]);
  const [won, setWon] = useState(false);
  const [profit, setProfit] = useState(0);
  const [ballPos, setBallPos] = useState<Zone | null>(null);
  const [keeperX, setKeeperX] = useState(50);
  const [ballVisible, setBallVisible] = useState(false);
  const [netShake, setNetShake] = useState(false);

  const startGame = () => {
    if (bet > balance) return;
    setBalance(b => +(b - bet).toFixed(2));
    setBlocked([]);
    setBallPos(null);
    setWon(false);
    setBallVisible(false);
    setNetShake(false);
    setKeeperX(50);
    setPhase('shooting');
  };

  const shoot = (zone: Zone) => {
    if (phase !== 'shooting') return;
    setPick(zone);
    setBallVisible(true);
    setBallPos(zone);

    const others = ZONES.filter(z => z !== zone);
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    const keeperZones: Zone[] = Math.random() < 0.6
      ? [zone, shuffled[0], shuffled[1]]
      : [shuffled[0], shuffled[1], shuffled[2]];
    setBlocked(keeperZones);

    // Keeper dives toward the picked zone
    const targetPos = ZONE_POS[zone];
    setKeeperX(targetPos.x);

    const isGoal = !keeperZones.includes(zone);
    setTimeout(() => {
      setWon(isGoal);
      if (isGoal) {
        const pay = +(bet * 2.3).toFixed(2);
        setBalance(b => +(b + pay).toFixed(2));
        setProfit(+(pay - bet).toFixed(2));
        setNetShake(true);
      } else {
        setProfit(-bet);
      }
      setPhase('result');
    }, 900);
  };

  const reset = () => {
    setPhase('betting');
    setPick(null);
    setBlocked([]);
    setBallPos(null);
    setBallVisible(false);
    setKeeperX(50);
    setNetShake(false);
  };

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.22) 0%, rgba(6,182,212,0.10) 50%, transparent 75%)',
          pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Penalty Shoot</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0 }}>Pick your zone — beat the keeper to score and win 2.3×</p>
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
                    <button key={c} onClick={() => setBet(c)} disabled={phase !== 'betting'}
                      style={{
                        padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid',
                        borderColor: bet === c ? '#10b981' : 'rgba(255,255,255,0.1)',
                        background: bet === c ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                        color: bet === c ? '#10b981' : 'rgba(255,255,255,0.5)',
                        cursor: phase !== 'betting' ? 'not-allowed' : 'pointer',
                        opacity: phase !== 'betting' ? 0.5 : 1, transition: 'all 0.15s',
                      }}>${c}</button>
                  ))}
                </div>
              </div>

              <div style={panel}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payout</p>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>
                  Goal → <span style={{ color: '#10b981', fontWeight: 700 }}>2.3× bet</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>
                  Saved → <span style={{ color: '#f87171', fontWeight: 700 }}>lose bet</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Keeper covers 3 of 5 zones</div>
              </div>

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
                      {won ? '⚽ GOAL!' : '🧤 Keeper saves!'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {phase === 'betting' && (
                <motion.button onClick={startGame} disabled={bet > balance}
                  whileHover={{ scale: bet > balance ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                    cursor: bet > balance ? 'not-allowed' : 'pointer',
                    background: bet > balance ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #059669, #10b981, #34d399)',
                    color: bet > balance ? 'rgba(255,255,255,0.3)' : '#000',
                    fontWeight: 900, fontSize: 14, transition: 'all 0.2s',
                    boxShadow: bet > balance ? 'none' : '0 4px 24px rgba(16,185,129,0.4)',
                  }}>PLAY — ${bet}</motion.button>
              )}
              {phase === 'shooting' && (
                <div style={{ ...panel, textAlign: 'center' }}>
                  <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }}
                    style={{ fontSize: 14, fontWeight: 700, color: '#10b981', margin: 0 }}>
                    ⚽ Click a zone to shoot!
                  </motion.p>
                </div>
              )}
              {phase === 'result' && (
                <motion.button onClick={reset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#000', fontWeight: 900, fontSize: 14, boxShadow: '0 4px 24px rgba(16,185,129,0.35)' }}>
                  SHOOT AGAIN
                </motion.button>
              )}
            </div>

            {/* Field Arena */}
            <div style={{ ...panel, minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>

              {phase === 'betting' ? (
                <div style={{ textAlign: 'center' }}>
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <span style={{ fontSize: 80 }}>⚽</span>
                  </motion.div>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '16px 0 8px' }}>Ready to Score?</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Place your bet, then pick a goal zone</p>
                </div>
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    <motion.p key={phase + String(won)}
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                      style={{
                        fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0,
                        color: phase === 'shooting' ? 'rgba(255,255,255,0.45)' : won ? '#4ade80' : '#f87171',
                      }}>
                      {phase === 'shooting' ? 'Click a zone to shoot' : won ? '⚽ GOAL!' : '🧤 Saved!'}
                    </motion.p>
                  </AnimatePresence>

                  {/* Goal frame */}
                  <div style={{ position: 'relative', width: 360, height: 300 }}>
                    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                      {/* Pitch grass gradient */}
                      <defs>
                        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#052e16" />
                          <stop offset="100%" stopColor="#064e3b" />
                        </linearGradient>
                        <filter id="netShakeFilter">
                          <feDisplacementMap in="SourceGraphic" scale={netShake ? "2" : "0"} />
                        </filter>
                      </defs>

                      {/* Pitch background */}
                      <rect x="0" y="0" width="100" height="100" fill="url(#grass)" />

                      {/* Field lines */}
                      <line x1="5" y1="90" x2="95" y2="90" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                      <ellipse cx="50" cy="90" rx="15" ry="6" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />

                      {/* Goal net frame */}
                      <rect x="8" y="8" width="84" height="75" rx="2" fill="none"
                        stroke={netShake ? '#4ade80' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5"
                        style={{ transition: 'stroke 0.3s' }} />

                      {/* Net lines horizontal */}
                      {[16, 24, 32, 40, 48, 56, 64, 72].map(y => (
                        <line key={y} x1="8" y1={y} x2="92" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                      ))}
                      {/* Net lines vertical */}
                      {[18, 28, 38, 48, 58, 68, 78].map(x => (
                        <line key={x} x1={x} y1="8" x2={x} y2="83" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                      ))}

                      {/* Zone dividers */}
                      <line x1="50" y1="8" x2="50" y2="83" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                      <line x1="8" y1="35" x2="92" y2="35" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

                      {/* Keeper gloves */}
                      {blocked.map(z => {
                        const pos = ZONE_POS[z];
                        return (
                          <motion.g key={z} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}>
                            <ellipse cx={pos.x} cy={pos.y} rx="13" ry="9"
                              fill="rgba(239,68,68,0.35)" stroke="#ef4444" strokeWidth="1.5" />
                            <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                              fontSize="6" fill="#fca5a5" fontWeight="bold">🧤</text>
                          </motion.g>
                        );
                      })}

                      {/* Ball */}
                      {ballVisible && ballPos && (
                        <motion.g
                          initial={{ cx: 50, cy: 90, scale: 0.3 }}
                          animate={{ scale: 1 }}
                          style={{ transformOrigin: `${ZONE_POS[ballPos].x}px ${ZONE_POS[ballPos].y}px` }}>
                          <motion.circle
                            cx={50} cy={90}
                            r="7"
                            animate={{ cx: ZONE_POS[ballPos].x, cy: ZONE_POS[ballPos].y }}
                            transition={{ duration: 0.5, ease: 'easeIn' }}
                            fill="#fff" stroke="rgba(0,0,0,0.5)" strokeWidth="0.5" />
                        </motion.g>
                      )}
                    </svg>

                    {/* Keeper body (animated separately) */}
                    <motion.div
                      animate={{ left: `${keeperX}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{
                        position: 'absolute', bottom: '22%', transform: 'translateX(-50%)',
                        fontSize: 28, pointerEvents: 'none', zIndex: 5,
                        filter: phase === 'result' && !won ? 'drop-shadow(0 0 8px #10b981)' : 'none',
                        transition: 'filter 0.3s',
                      }}>
                      🧤
                    </motion.div>

                    {/* Clickable zone overlays */}
                    {phase === 'shooting' && ZONES.map(z => {
                      const pos = ZONE_POS[z];
                      return (
                        <motion.button key={z} onClick={() => shoot(z)}
                          whileHover={{ y: -5, borderColor: 'rgba(52,211,153,0.85)', backgroundColor: 'rgba(16,185,129,0.28)' }}
                          whileTap={{ scale: 0.92 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                          style={{
                            position: 'absolute',
                            left: `${pos.x}%`, top: `${pos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            width: 52, height: 52, borderRadius: '50%',
                            background: 'rgba(16,185,129,0.15)',
                            border: '2px solid rgba(16,185,129,0.5)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 10,
                          }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#10b981' }}>{ZONE_LABEL[z]}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Result banner */}
                  <AnimatePresence>
                    {phase === 'result' && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 250 }}
                        style={{
                          fontSize: 24, fontWeight: 900, padding: '12px 48px', borderRadius: 14,
                          border: `1px solid ${won ? '#4ade8044' : '#f8717144'}`,
                          background: won ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                          color: won ? '#4ade80' : '#f87171',
                        }}>
                        {won ? '⚽ GOAL!' : '🧤 SAVED!'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            <div><GameRules gameId="penalty" variant="side" /></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

