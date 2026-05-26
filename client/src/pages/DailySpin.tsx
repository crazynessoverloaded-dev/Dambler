import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { Gift, Clock, Zap, CheckCircle, Star } from 'lucide-react';

const SEGMENTS = [
  { label: '$5',   sub: 'Bonus', color: '#1c1f2e', text: '#ffffff' },
  { label: 'FREE', sub: 'Spin',  color: '#13151f', text: 'rgba(255,255,255,0.45)' },
  { label: '$10',  sub: 'Bonus', color: '#21243380', text: '#ffffff' },
  { label: 'FREE', sub: 'Spin',  color: '#13151f', text: 'rgba(255,255,255,0.45)' },
  { label: '$25',  sub: 'Bonus', color: '#1c1f2e', text: '#ffffff' },
  { label: '100',  sub: 'DMB',   color: '#13151f', text: 'rgba(255,255,255,0.6)' },
  { label: '$50',  sub: 'Bonus', color: '#21243380', text: '#ffffff' },
  { label: '200',  sub: 'DMB',   color: '#13151f', text: 'rgba(255,255,255,0.6)' },
];

const WEIGHTS = [30,25,20,15,5,3,1.5,0.5];
const LAST_SPIN_KEY = 'dambler_last_spin';

function weightedRandom(): number {
  const total = WEIGHTS.reduce((a,b) => a+b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WEIGHTS.length; i++) { r -= WEIGHTS[i]; if (r <= 0) return i; }
  return WEIGHTS.length - 1;
}

function timeUntilNextSpin(): number {
  const last = localStorage.getItem(LAST_SPIN_KEY);
  if (!last) return 0;
  return Math.max(0, 24*3600*1000 - (Date.now() - parseInt(last)));
}

function formatCountdown(ms: number): string {
  const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000), s = Math.floor((ms%60000)/1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const N = SEGMENTS.length, SEG_DEG = 360/N, CX = 140, CY = 140, R = 128;

function polarXY(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg-90)*(Math.PI/180);
  return { x: cx+r*Math.cos(rad), y: cy+r*Math.sin(rad) };
}

function sectorPath(start: number, end: number) {
  const s = polarXY(CX,CY,R,start), e = polarXY(CX,CY,R,end);
  return `M ${CX},${CY} L ${s.x},${s.y} A ${R},${R} 0 0,1 ${e.x},${e.y} Z`;
}

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 };

export default function DailySpin() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number|null>(null);
  const [claimed, setClaimed] = useState(false);
  const [remaining, setRemaining] = useState<number>(() => timeUntilNextSpin());
  const rotRef = useRef(0);
  const [displayRot, setDisplayRot] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => { const r = timeUntilNextSpin(); setRemaining(r); if (r<=0) clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const spin = () => {
    if (spinning || remaining > 0) return;
    const seg = weightedRandom();
    const targetAngle = ((360-(seg*SEG_DEG+SEG_DEG/2))%360+360)%360;
    const delta = ((targetAngle-(rotRef.current%360))+360)%360||360;
    const newRot = rotRef.current+5*360+delta;
    rotRef.current = newRot;
    setSpinning(true); setResult(null); setClaimed(false); setDisplayRot(newRot);
    setTimeout(() => {
      setSpinning(false); setResult(seg);
      if (SEGMENTS[seg].sub.toLowerCase() !== 'spin') { localStorage.setItem(LAST_SPIN_KEY, String(Date.now())); setRemaining(24*3600*1000); }
    }, 4200);
  };

  const isFreeSpin = (i: number) => SEGMENTS[i].sub.toLowerCase() === 'spin';

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '52px 24px 80px' }}>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>Daily Spin</p>
            <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: -1, margin: '0 0 10px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Spin the Wheel</h1>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>One free spin every 24 hours. No deposit needed.</p>
          </motion.div>

          <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Wheel */}
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none' }}>
                <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '22px solid #fff', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }} />
              </div>
              <div style={{ position: 'relative', width: 280, height: 280 }}>
                <div style={{ position: 'absolute', inset: -5, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.12)', boxShadow: '0 0 28px rgba(255,255,255,0.06)' }} />
                <motion.div style={{ originX: '50%', originY: '50%' }} animate={{ rotate: displayRot }} transition={{ duration: 4.2, ease: [0.15,0.65,0.1,1.0] }} className="w-full h-full">
                  <svg width="280" height="280" viewBox="0 0 280 280">
                    {SEGMENTS.map((seg, i) => {
                      const start = i*SEG_DEG, end = (i+1)*SEG_DEG, mid = start+SEG_DEG/2;
                      const tp = polarXY(CX,CY,R*0.64,mid), lp = polarXY(CX,CY,R*0.78,mid);
                      const rot = mid>90&&mid<=270 ? mid+180 : mid;
                      return (
                        <g key={i}>
                          <path d={sectorPath(start,end)} fill={seg.color} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                          <text x={tp.x} y={tp.y} textAnchor="middle" dominantBaseline="middle" fill={seg.text} fontSize="12" fontWeight="900" fontFamily="system-ui" transform={`rotate(${rot},${tp.x},${tp.y})`}>{seg.label}</text>
                          <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill={seg.text} fontSize="8" fontWeight="600" fontFamily="system-ui" opacity="0.7" transform={`rotate(${rot},${lp.x},${lp.y})`}>{seg.sub}</text>
                        </g>
                      );
                    })}
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    <circle cx={CX} cy={CY} r="22" fill="#0f1118" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                  </svg>
                </motion.div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <Zap style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.5)' }} />
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {remaining > 0 ? (
                <div style={{ ...card, padding: '24px', textAlign: 'center' }}>
                  <Clock style={{ width: 24, height: 24, color: 'rgba(255,255,255,0.3)', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Next spin available in</p>
                  <p style={{ fontSize: 30, fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, margin: '0 0 6px' }}>{formatCountdown(remaining)}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', margin: 0 }}>Resets every 24 hours</p>
                </div>
              ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={spin} disabled={spinning}
                  style={{ width: '100%', padding: '16px', borderRadius: 12, background: '#fff', color: '#0c0e14', fontWeight: 800, fontSize: 15, border: 'none', cursor: spinning ? 'not-allowed' : 'pointer', opacity: spinning ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                  {spinning ? '🎰 Spinning…' : '🎰 Spin the Wheel'}
                </motion.button>
              )}

              <AnimatePresence>
                {result !== null && !spinning && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ ...card, padding: '22px', textAlign: 'center' }}>
                    {isFreeSpin(result)
                      ? <><p style={{ fontSize: 32, margin: '0 0 10px' }}>🎰</p>
                          <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Free Spin — Try Again!</p>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: 0 }}>Your daily spin is still available.</p>
                        </>
                      : <><Star style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.6)', margin: '0 auto 10px' }} />
                          <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 14 }}>You won {SEGMENTS[result].label} {SEGMENTS[result].sub}!</p>
                          {!claimed
                            ? <button onClick={() => setClaimed(true)} style={{ background: '#fff', color: '#0c0e14', fontWeight: 800, fontSize: 13, padding: '10px 24px', borderRadius: 9, border: 'none', cursor: 'pointer' }}>Claim Reward</button>
                            : <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: 0 }}><CheckCircle style={{ width: 14, height: 14 }} />Added to your balance!</p>
                          }
                        </>
                    }
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Prize table */}
              <div style={{ ...card, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>Prize Table</p>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Odds</span>
                </div>
                {SEGMENTS.map((seg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', borderBottom: i < SEGMENTS.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>{seg.label} {seg.sub}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', fontFamily: 'JetBrains Mono, monospace' }}>{WEIGHTS[i]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
