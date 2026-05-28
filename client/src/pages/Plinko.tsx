import { useState, useRef, useEffect, type CSSProperties, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';
import { Play, Volume2, VolumeX, Square } from 'lucide-react';

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  isWin: boolean;
}

interface ActiveBall {
  id: string;
  waypoints: { x: number; y: number }[];
  betAmount: number;
  bucketIndex: number;
  multiplier: number;
  segIdx: number;
  progress: number;
  landed: boolean;
  color: string;
  speed: number;
}

const RISK_MULTIPLIERS = {
  low:    [5,   3,  1.5, 1.2, 1,   0.9, 0.7, 0.9, 1,   1.2, 1.5, 3,  5  ],
  medium: [25,  10, 2,   1.5, 1,   0.7, 0.5, 0.7, 1,   1.5, 2,   10, 25 ],
  high:   [100, 30, 5,   2,   0.5, 0.2, 0.1, 0.2, 0.5, 2,   5,   30, 100],
} as const;

const RISK_THEME = {
  low:    { primary: '#3B82F6', glow: 'rgba(59,130,246,0.5)',  bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.4)' },
  medium: { primary: '#F59E0B', glow: 'rgba(245,158,11,0.5)',  bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.4)' },
  high:   { primary: '#EF4444', glow: 'rgba(239,68,68,0.5)',   bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.4)' },
} as const;

const BUCKET_COLORS = [
  '#FF1744', '#FF6D00', '#FFAB00', '#76FF03', '#00E676', '#1DE9B6',
  '#00B0FF',
  '#1DE9B6', '#00E676', '#76FF03', '#FFAB00', '#FF6D00', '#FF1744',
];

const CANVAS_WIDTH  = 600;
const CANVAS_HEIGHT = 620;
const PEG_RADIUS    = 5;
const BALL_RADIUS   = 7;
const NUM_ROWS      = 12;

const PEG_SPACING_X = CANVAS_WIDTH / (NUM_ROWS + 1);
const PEG_SPACING_Y = (CANVAS_HEIGHT - 100) / (NUM_ROWS + 2);
const NUM_BUCKETS   = 13;
const BUCKET_WIDTH  = CANVAS_WIDTH / NUM_BUCKETS;
const RISK_FRAMES   = { low: 14, medium: 11, high: 8 } as const;

const PEGS = (() => {
  const out: { x: number; y: number }[] = [];
  for (let row = 0; row < NUM_ROWS; row++) {
    const n = row + 1;
    const startX = (CANVAS_WIDTH - n * PEG_SPACING_X) / 2 + PEG_SPACING_X / 2;
    for (let col = 0; col < n; col++) {
      out.push({ x: startX + col * PEG_SPACING_X, y: 30 + row * PEG_SPACING_Y });
    }
  }
  return out;
})();

const BUCKET_WEIGHTS = [
  0.001, 0.003, 0.016, 0.050, 0.100, 0.200, 0.260,
  0.200, 0.100, 0.050, 0.016, 0.003, 0.001,
];

const ODDS_GROUPS = [
  { buckets: [6],     prob: '26.0%', pct: 26.0 },
  { buckets: [5, 7],  prob: '40.0%', pct: 40.0 },
  { buckets: [4, 8],  prob: '20.0%', pct: 20.0 },
  { buckets: [3, 9],  prob: '10.0%', pct: 10.0 },
  { buckets: [2, 10], prob: '3.2%',  pct: 3.2  },
  { buckets: [1, 11], prob: '0.6%',  pct: 0.6  },
  { buckets: [0, 12], prob: '0.2%',  pct: 0.2  },
];

function rollBucket(): number {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < BUCKET_WEIGHTS.length; i++) {
    cum += BUCKET_WEIGHTS[i];
    if (r < cum) return i;
  }
  return BUCKET_WEIGHTS.length - 1;
}

function buildPath(targetBucket: number): boolean[] {
  const path: boolean[] = [];
  let rightsLeft = targetBucket;
  for (let i = 0; i < NUM_ROWS; i++) {
    const flipsLeft = NUM_ROWS - i;
    if (Math.random() < rightsLeft / flipsLeft) { path.push(true); rightsLeft--; }
    else { path.push(false); }
  }
  return path;
}

function rollPath(): { path: boolean[]; bucket: number } {
  const bucket = rollBucket();
  return { path: buildPath(bucket), bucket };
}

function gapX(r: number, g: number): number {
  return (CANVAS_WIDTH - (r + 2) * PEG_SPACING_X) / 2 + (g + 0.5) * PEG_SPACING_X;
}

function buildWaypoints(path: boolean[]): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [{ x: CANVAS_WIDTH / 2, y: 8 }];
  let g = 0;
  for (let r = 0; r < path.length; r++) {
    if (path[r]) g++;
    pts.push({ x: gapX(r, g), y: 30 + r * PEG_SPACING_Y + PEG_SPACING_Y * 0.6 });
  }
  pts.push({ x: (g + 0.5) * BUCKET_WIDTH, y: CANVAS_HEIGHT - 44 });
  return pts;
}

// ── Web Audio sound engine ────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); }
    catch { return null; }
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function soundPegHit() {
  const ctx = getAudioCtx(); if (!ctx) return;
  const osc = ctx.createOscillator(); const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = 'sine';
  const f = 500 + Math.random() * 700;
  osc.frequency.setValueAtTime(f, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(f * 0.35, ctx.currentTime + 0.045);
  g.gain.setValueAtTime(0.10, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05);
}

function soundDrop() {
  const ctx = getAudioCtx(); if (!ctx) return;
  const osc = ctx.createOscillator(); const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
  g.gain.setValueAtTime(0.14, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.14);
}

function soundWin(mult: number) {
  const ctx = getAudioCtx(); if (!ctx) return;
  const freqs = mult >= 25 ? [523, 659, 784, 1047, 1319]
              : mult >= 5  ? [440, 554, 659, 880]
              : mult >= 1  ? [392, 494, 587]
              :              [330, 277];
  const vol = mult >= 25 ? 0.32 : mult >= 5 ? 0.22 : 0.14;
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    const t = ctx.currentTime + i * 0.09;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.start(t); osc.stop(t + 0.3);
  });
}

function soundLoss() {
  const ctx = getAudioCtx(); if (!ctx) return;
  const osc = ctx.createOscillator(); const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.28);
  g.gain.setValueAtTime(0.12, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
}
// ─────────────────────────────────────────────────────────────────────────────

function multColor(mult: number): string {
  if (mult >= 10)  return '#FF6D00';
  if (mult >= 2)   return '#FFAB00';
  if (mult >= 1)   return '#00E676';
  if (mult >= 0.5) return '#64748b';
  return '#EF4444';
}

export default function Plinko() {
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const animIdRef       = useRef<number | null>(null);
  const ballsRef        = useRef<ActiveBall[]>([]);
  const ballIdRef       = useRef(0);
  const isAutoRef       = useRef(false);
  const betRef          = useRef(1);
  const riskRef         = useRef<'low' | 'medium' | 'high'>('medium');
  const landedBucketRef  = useRef<{ idx: number; startTime: number } | null>(null);
  const soundEnabledRef  = useRef(true);

  const { balance, balanceRef, setBalance } = useGameWallet('Plinko');
  const [betAmount,        setBetAmount]        = useState(1);
  const [riskLevel,        setRiskLevel]        = useState<'low' | 'medium' | 'high'>('medium');
  const [isRunning,        setIsRunning]        = useState(false);
  const [autoBetCount,     setAutoBetCount]     = useState(0);
  const [autoBetRemaining, setAutoBetRemaining] = useState(0);
  const [soundEnabled,     setSoundEnabled]     = useState(true);
  const [floatingTexts,    setFloatingTexts]    = useState<FloatingText[]>([]);
  const [history,          setHistory]          = useState<number[]>([]);
  const [lastResult,       setLastResult]       = useState<{ multiplier: number; winAmount: number } | null>(null);

  const betOptions = [0.1, 0.5, 1, 5, 10, 50, 100];

  useEffect(() => { betRef.current          = betAmount;    }, [betAmount]);
  useEffect(() => { riskRef.current         = riskLevel;    }, [riskLevel]);
  useEffect(() => { balanceRef.current      = balance;      }, [balance]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  const drawFrame = (ctx: CanvasRenderingContext2D) => {
    // Deep space gradient background
    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bg.addColorStop(0,   '#050A14');
    bg.addColorStop(0.5, '#060810');
    bg.addColorStop(1,   '#080A18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.018)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT - 40); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT - 40; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }

    // Drop-zone glow at top center
    const dropGrad = ctx.createRadialGradient(CANVAS_WIDTH / 2, 0, 0, CANVAS_WIDTH / 2, 0, 90);
    dropGrad.addColorStop(0, 'rgba(0,255,136,0.10)');
    dropGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = dropGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 90);

    // Glowing pegs
    ctx.shadowColor = 'rgba(160,210,255,0.75)';
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = 'rgba(255,255,255,0.92)';
    PEGS.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, PEG_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Buckets
    const bucketY    = CANVAS_HEIGHT - 40;
    const currentMults = RISK_MULTIPLIERS[riskRef.current];
    const landedIdx  = landedBucketRef.current?.idx ?? -1;
    const landedAge  = landedBucketRef.current ? Date.now() - landedBucketRef.current.startTime : 0;
    const flashT     = landedBucketRef.current ? Math.max(0, 1 - landedAge / 700) : 0;

    currentMults.forEach((mult, idx) => {
      const x     = idx * BUCKET_WIDTH;
      const color = BUCKET_COLORS[idx];
      const flash = idx === landedIdx && flashT > 0;

      const grad = ctx.createLinearGradient(x, bucketY, x, CANVAS_HEIGHT);
      grad.addColorStop(0, color + (flash ? 'FF' : 'CC'));
      grad.addColorStop(1, color + '44');
      ctx.fillStyle = grad;
      ctx.fillRect(x + 1, bucketY, BUCKET_WIDTH - 2, 40);

      // Top highlight line
      ctx.shadowColor = flash ? color : 'transparent';
      ctx.shadowBlur  = flash ? 18 * flashT : 0;
      ctx.fillStyle   = flash ? '#FFFFFF' : color;
      ctx.fillRect(x + 1, bucketY, BUCKET_WIDTH - 2, 2);

      // Label
      ctx.shadowColor = flash ? color : 'transparent';
      ctx.shadowBlur  = flash ? 10 * flashT : 0;
      ctx.fillStyle   = '#FFF';
      ctx.font        = 'bold 10px Arial';
      ctx.textAlign   = 'center';
      ctx.fillText(`${mult}x`, x + BUCKET_WIDTH / 2, bucketY + 25);
      ctx.shadowBlur  = 0;
    });

    // Balls with neon glow
    ballsRef.current.forEach(ball => {
      const from = ball.waypoints[ball.segIdx];
      const to   = ball.waypoints[ball.segIdx + 1];
      if (!from || !to) return;
      const x = from.x + (to.x - from.x) * ball.progress;
      const y = from.y + (to.y - from.y) * ball.progress;

      ctx.shadowColor = '#00FF88';
      ctx.shadowBlur  = 22;
      ctx.fillStyle   = ball.color;
      ctx.beginPath();
      ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Bright core
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.arc(x, y, BALL_RADIUS * 0.36, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = () => {
      ballsRef.current.forEach(ball => {
        ball.progress += ball.speed;
        if (ball.progress >= 1) {
          ball.progress = 0;
          ball.segIdx++;
          if (soundEnabledRef.current) soundPegHit();
          if (ball.segIdx >= ball.waypoints.length - 1) {
            ball.landed    = true;
            const mult     = ball.multiplier;
            const win      = ball.betAmount * mult;
            const profit   = win - ball.betAmount;
            if (soundEnabledRef.current) {
              if (profit >= 0) soundWin(mult); else soundLoss();
            }
            setBalance(prev => { const n = prev + win; balanceRef.current = n; return n; });
            const pt  = ball.waypoints[ball.waypoints.length - 1];
            const fid = `f-${Date.now()}-${Math.random()}`;
            setFloatingTexts(prev => [...prev, {
              id: fid, x: pt.x, y: pt.y,
              text: `${profit >= 0 ? '+' : ''}${profit.toFixed(2)}`,
              isWin: profit >= 0,
            }]);
            setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== fid)), 2000);
            setHistory(prev => [mult, ...prev.slice(0, 19)]);
            setLastResult({ multiplier: mult, winAmount: profit });
            landedBucketRef.current = { idx: ball.bucketIndex, startTime: Date.now() };
          }
        }
      });
      ballsRef.current = ballsRef.current.filter(b => !b.landed);
      drawFrame(ctx);
      animIdRef.current = requestAnimationFrame(tick);
    };

    animIdRef.current = requestAnimationFrame(tick);
    return () => { if (animIdRef.current) cancelAnimationFrame(animIdRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dropBall = () => {
    if (balanceRef.current < betRef.current) return;
    if (soundEnabledRef.current) soundDrop();
    setBalance(prev => { const n = prev - betRef.current; balanceRef.current = n; return n; });
    const { path, bucket } = rollPath();
    const waypoints = buildWaypoints(path);
    const mult = RISK_MULTIPLIERS[riskRef.current][bucket];
    ballsRef.current.push({
      id:          `b-${ballIdRef.current++}`,
      waypoints,
      betAmount:   betRef.current,
      bucketIndex: bucket,
      multiplier:  mult,
      segIdx:      0,
      progress:    0,
      landed:      false,
      color:       '#00FF88',
      speed:       1 / RISK_FRAMES[riskRef.current],
    });
  };

  const handleBetNow = async () => {
    if (balanceRef.current < betRef.current) { alert('Insufficient balance!'); return; }
    if (autoBetCount > 0) {
      isAutoRef.current = true;
      setIsRunning(true);
      let rem = autoBetCount;
      while (rem > 0 && isAutoRef.current && balanceRef.current >= betRef.current) {
        dropBall();
        await new Promise(r => setTimeout(r, 300));
        rem--;
        setAutoBetRemaining(rem);
      }
      isAutoRef.current = false;
      setIsRunning(false);
      setAutoBetCount(0);
      setAutoBetRemaining(0);
    } else {
      dropBall();
    }
  };

  const handleStop = () => {
    isAutoRef.current = false;
    setIsRunning(false);
    setAutoBetCount(0);
    setAutoBetRemaining(0);
  };

  const theme        = RISK_THEME[riskLevel];
  const currentMults = RISK_MULTIPLIERS[riskLevel];
  const maxMult      = Math.max(...currentMults);
  const edgeLabel    = riskLevel === 'low' ? '~9%' : riskLevel === 'medium' ? '~7%' : '~8%';

  return (
    <MainLayout>
      <section className="relative py-4 lg:py-6 overflow-hidden" style={{ background: '#0d0d12', minHeight: '100vh' }}>

        {/* Ambient glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{
            position: 'absolute', top: '5%', left: '28%',
            width: 520, height: 520, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 65%)',
            filter: 'blur(60px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '12%', right: '18%',
            width: 360, height: 360, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%)',
            filter: 'blur(50px)',
          }} />
          <div style={{
            position: 'absolute', top: '45%', left: '4%',
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }} />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 relative z-10">

          {/* ── Header ───────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
            style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 4, height: 50, flexShrink: 0, borderRadius: 2,
                background: 'linear-gradient(to bottom, #00FF88, rgba(0,255,136,0))',
              }} />
              <div>
                <h1 className="gradient-text" style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  PLINKO
                </h1>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.18em', marginTop: 5 }}>
                  BINOMIAL RNG · 12 ROWS · 95% RTP
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.18em', marginBottom: 3 }}>BALANCE</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#F59E0B', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                ${balance.toFixed(2)}
              </div>
            </div>
          </motion.div>

          {/* ── 3-col grid ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-4 items-start">

            {/* ── Left sidebar ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.08 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {/* Risk Level */}
              <div style={card}>
                <SectionLabel>RISK LEVEL</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(['low', 'medium', 'high'] as const).map(level => {
                    const th     = RISK_THEME[level];
                    const active = riskLevel === level;
                    return (
                      <motion.button key={level}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setRiskLevel(level)} disabled={isRunning}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 9,
                          fontSize: 13, fontWeight: 700, textAlign: 'left',
                          border: `1px solid ${active ? th.border : 'rgba(255,255,255,0.07)'}`,
                          background: active ? th.bg : 'rgba(255,255,255,0.03)',
                          color: active ? th.primary : 'rgba(255,255,255,0.42)',
                          boxShadow: active ? `0 0 18px ${th.glow}, inset 0 0 10px ${th.bg}` : 'none',
                          cursor: isRunning ? 'not-allowed' : 'pointer',
                          opacity: isRunning ? 0.5 : 1,
                          transition: 'all 0.2s ease',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 17 }}>
                          {level === 'low' ? '💎' : level === 'medium' ? '⚡' : '🔥'}
                        </span>
                        <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                        {active && (
                          <span style={{
                            marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%',
                            background: th.primary, boxShadow: `0 0 8px ${th.primary}`,
                          }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Bet Amount */}
              <div style={card}>
                <SectionLabel>BET AMOUNT</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
                  {betOptions.map(amount => (
                    <button key={amount} onClick={() => setBetAmount(amount)} disabled={isRunning}
                      style={{
                        padding: '7px 0', borderRadius: 7, fontSize: 12, fontWeight: 700,
                        border: `1px solid ${betAmount === amount ? 'rgba(0,255,136,0.45)' : 'rgba(255,255,255,0.07)'}`,
                        background: betAmount === amount ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.03)',
                        color: betAmount === amount ? '#00FF88' : 'rgba(255,255,255,0.45)',
                        boxShadow: betAmount === amount ? '0 0 12px rgba(0,255,136,0.2)' : 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        opacity: isRunning ? 0.5 : 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <input type="number" min="0.1" max="100" step="0.1" value={betAmount}
                  onChange={e => setBetAmount(parseFloat(e.target.value))} disabled={isRunning}
                  style={{
                    width: '100%', padding: '9px 11px', borderRadius: 7, boxSizing: 'border-box',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.09)',
                    color: '#E8EAED', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none',
                  }}
                />
              </div>

              {/* Auto-Bet */}
              <div style={card}>
                <SectionLabel>AUTO-BET</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
                  {[10, 50, 100].map(count => (
                    <button key={count}
                      onClick={() => setAutoBetCount(c => c === count ? 0 : count)}
                      disabled={isRunning}
                      style={{
                        padding: '8px 0', borderRadius: 7, fontSize: 12, fontWeight: 700,
                        border: `1px solid ${autoBetCount === count ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.07)'}`,
                        background: autoBetCount === count ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                        color: autoBetCount === count ? '#F59E0B' : 'rgba(255,255,255,0.45)',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        opacity: isRunning ? 0.5 : 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {count}×
                    </button>
                  ))}
                </div>
                {autoBetRemaining > 0 && (
                  <p style={{ fontSize: 12, color: '#F59E0B', marginTop: 8, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {autoBetRemaining} bets remaining
                  </p>
                )}
              </div>

              {/* BET NOW */}
              <motion.button
                whileHover={{ scale: balance >= betAmount && !isRunning ? 1.02 : 1 }}
                whileTap={{ scale: balance >= betAmount && !isRunning ? 0.97 : 1 }}
                onClick={handleBetNow}
                disabled={balance < betAmount || isRunning}
                className="btn-shimmer"
                style={{
                  width: '100%', padding: '15px 0', borderRadius: 11,
                  fontSize: 15, fontWeight: 900, letterSpacing: '0.08em',
                  background: balance < betAmount || isRunning
                    ? 'rgba(0,255,136,0.18)'
                    : 'linear-gradient(135deg, #00FF88 0%, #00DDAA 100%)',
                  color: balance < betAmount || isRunning ? 'rgba(255,255,255,0.35)' : '#052e16',
                  border: 'none',
                  cursor: balance < betAmount || isRunning ? 'not-allowed' : 'pointer',
                  boxShadow: balance < betAmount || isRunning ? 'none' : '0 4px 24px rgba(0,255,136,0.38)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s ease',
                }}
              >
                <Play style={{ width: 16, height: 16 }} /> BET NOW
              </motion.button>

              <AnimatePresence>
                {isRunning && (
                  <motion.button
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleStop}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 11,
                      fontSize: 14, fontWeight: 800, letterSpacing: '0.06em',
                      background: 'rgba(239,68,68,0.15)', color: '#EF4444',
                      border: '1px solid rgba(239,68,68,0.4)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <Square style={{ width: 14, height: 14 }} /> STOP
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Sound toggle */}
              <button onClick={() => setSoundEnabled(s => !s)}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 9,
                  fontSize: 12, background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.38)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'all 0.15s ease',
                }}
              >
                {soundEnabled
                  ? <><Volume2 style={{ width: 13, height: 13 }} /> Sound On</>
                  : <><VolumeX style={{ width: 13, height: 13 }} /> Sound Off</>}
              </button>

              {/* Last Result */}
              <AnimatePresence mode="wait">
                {lastResult && (
                  <motion.div
                    key={`${lastResult.multiplier}-${lastResult.winAmount.toFixed(2)}`}
                    initial={{ opacity: 0, scale: 0.88, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    style={{
                      borderRadius: 12, overflow: 'hidden',
                      background: lastResult.winAmount >= 0
                        ? 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,255,136,0.04))'
                        : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))',
                      border: `1px solid ${lastResult.winAmount >= 0 ? 'rgba(0,255,136,0.32)' : 'rgba(239,68,68,0.32)'}`,
                      boxShadow: lastResult.winAmount >= 0
                        ? '0 0 28px rgba(0,255,136,0.12)'
                        : '0 0 28px rgba(239,68,68,0.12)',
                      padding: '13px 15px',
                    }}
                  >
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.18em', marginBottom: 5 }}>
                      LAST RESULT
                    </div>
                    <div style={{
                      fontSize: 34, fontWeight: 900, lineHeight: 1,
                      color: lastResult.winAmount >= 0 ? '#00FF88' : '#EF4444',
                      fontFamily: 'var(--font-mono)', marginBottom: 5,
                    }}>
                      {lastResult.multiplier}x
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: 700,
                      color: lastResult.winAmount >= 0 ? '#4ade80' : '#f87171',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {lastResult.winAmount >= 0 ? '+' : ''}{lastResult.winAmount.toFixed(2)} DMB
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Canvas column ────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.04 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
            >
              {/* Animated glowing border wrapper */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(0,255,136,0.10), 0 0 0 1px rgba(0,255,136,0.18)',
                    '0 0 55px rgba(0,255,136,0.22), 0 0 0 1px rgba(0,255,136,0.34)',
                    '0 0 30px rgba(0,255,136,0.10), 0 0 0 1px rgba(0,255,136,0.18)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  borderRadius: 14, padding: 2, width: '100%', maxWidth: CANVAS_WIDTH + 4,
                  background: 'linear-gradient(135deg, rgba(0,255,136,0.35), rgba(0,180,255,0.2), rgba(99,102,241,0.3), rgba(0,255,136,0.35))',
                }}
              >
                <div style={{ borderRadius: 12, overflow: 'hidden', background: '#050A14', position: 'relative' }}>
                  <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
                    style={{ display: 'block', width: '100%', maxWidth: CANVAS_WIDTH, height: 'auto' }}
                  />
                  {/* Floating text overlay */}
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <AnimatePresence>
                      {floatingTexts.map(text => (
                        <motion.div key={text.id}
                          initial={{ opacity: 1, y: 0, scale: 1 }}
                          animate={{ opacity: 0, y: -65, scale: 1.35 }}
                          transition={{ duration: 1.8, ease: 'easeOut' }}
                          style={{
                            position: 'absolute', left: text.x - 32, top: text.y - 18,
                            fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-mono)',
                            color: text.isWin ? '#00FF88' : '#FF4444',
                            textShadow: text.isWin
                              ? '0 0 12px rgba(0,255,136,0.9)'
                              : '0 0 12px rgba(255,68,68,0.9)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {text.text}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* Live stats strip */}
              <div style={{
                display: 'flex', width: '100%', maxWidth: CANVAS_WIDTH + 4,
                background: 'rgba(14,17,26,0.85)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, overflow: 'hidden',
              }}>
                {[
                  { label: 'RISK',     value: riskLevel.toUpperCase(), color: theme.primary },
                  { label: 'BET',      value: `$${betAmount.toFixed(2)}`, color: '#E8EAED' },
                  { label: 'MAX WIN',  value: `${maxMult}x`,             color: '#F59E0B' },
                  { label: 'HOUSE EDGE', value: edgeLabel,               color: '#EF4444' },
                ].map((s, i, arr) => (
                  <div key={s.label} style={{
                    flex: 1, padding: '10px 0', textAlign: 'center',
                    borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.15em', marginBottom: 4 }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Right sidebar ────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {/* Multipliers — live with risk level */}
              <div style={card}>
                <SectionLabel>MULTIPLIERS</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {currentMults.map((mult, idx) => (
                    <div key={idx} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 8px', borderRadius: 6,
                      background: `${BUCKET_COLORS[idx]}12`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: BUCKET_COLORS[idx],
                          boxShadow: `0 0 5px ${BUCKET_COLORS[idx]}`,
                          flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>B{idx + 1}</span>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 800,
                        color: multColor(mult), fontFamily: 'var(--font-mono)',
                      }}>
                        {mult}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent history */}
              {history.length > 0 && (
                <div style={card}>
                  <SectionLabel>RECENT</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {history.slice(0, 12).map((mult, idx) => (
                      <motion.div key={idx}
                        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                        style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                          background: mult >= 1 ? 'rgba(0,230,118,0.15)' : 'rgba(239,68,68,0.15)',
                          border: `1px solid ${mult >= 1 ? 'rgba(0,230,118,0.38)' : 'rgba(239,68,68,0.38)'}`,
                          color: mult >= 1 ? '#00E676' : '#EF4444',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {mult}x
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bucket odds with bar chart — dynamic per risk */}
              <div style={card}>
                <SectionLabel>BUCKET ODDS</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ODDS_GROUPS.map((group, gi) => {
                    const mult  = currentMults[group.buckets[0]];
                    const label = group.buckets.length === 2 ? `${mult}x (×2)` : `${mult}x (ctr)`;
                    const color = BUCKET_COLORS[group.buckets[0]];
                    const barW  = Math.min(100, group.pct * 2.3);
                    return (
                      <div key={gi}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{label}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>{group.prob}</span>
                        </div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${barW}%` }}
                            transition={{ duration: 0.8, delay: gi * 0.05, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: 2, background: color, boxShadow: `0 0 5px ${color}` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* How it works */}
              <div style={card}>
                <SectionLabel style={{ color: '#4ade80' }}>HOW IT WORKS</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    '12 independent coin flips',
                    'Bucket = count of rights',
                    'P(k) = C(12,k) / 4096',
                    'Guaranteed bell curve',
                    'Pure RNG — no physics',
                  ].map((line, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,255,136,0.5)', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        <GameRules gameId="plinko" />
      </section>
    </MainLayout>
  );
}

// ── Shared style helpers ────────────────────────────────────────────────────

const card: CSSProperties = {
  background: 'rgba(14,17,26,0.85)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
  padding: '13px',
  backdropFilter: 'blur(12px)',
};

function SectionLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.18em', marginBottom: 10, ...style }}>
      {children}
    </p>
  );
}
