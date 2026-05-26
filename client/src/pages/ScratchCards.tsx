import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

type SymId = 'diamond' | 'crown' | 'seven' | 'lightning' | 'clover' | 'bell';
type Phase = 'betting' | 'scratching' | 'result';

const SYMS: SymId[] = ['diamond', 'crown', 'seven', 'lightning', 'clover', 'bell'];

const SYM_META: Record<SymId, { label: string; payout: number; color: string; dark: string }> = {
  diamond:   { label: 'Diamond',   payout: 50, color: '#06b6d4', dark: '#0e7490' },
  crown:     { label: 'Crown',     payout: 20, color: '#f59e0b', dark: '#b45309' },
  seven:     { label: 'Lucky 7',   payout: 10, color: '#ef4444', dark: '#b91c1c' },
  lightning: { label: 'Lightning', payout: 5,  color: '#fbbf24', dark: '#d97706' },
  clover:    { label: 'Clover',    payout: 3,  color: '#4ade80', dark: '#16a34a' },
  bell:      { label: 'Bell',      payout: 2,  color: '#f97316', dark: '#c2410c' },
};

function SymbolSVG({ id, size = 52 }: { id: SymId; size?: number }) {
  const { color, dark } = SYM_META[id];
  const s = size;
  if (id === 'diamond') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f7ff"/><stop offset="50%" stopColor={color}/><stop offset="100%" stopColor={dark}/>
        </linearGradient>
      </defs>
      <polygon points="50,5 90,42 50,95 10,42" fill="url(#dg)" stroke={color} strokeWidth="2"/>
      <polygon points="50,5 90,42 50,42 10,42" fill="rgba(255,255,255,0.25)"/>
      <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      <line x1="10" y1="42" x2="90" y2="42" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
    </svg>
  );
  if (id === 'crown') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="cg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde68a"/><stop offset="100%" stopColor={dark}/>
        </linearGradient>
      </defs>
      <polygon points="10,75 10,35 28,55 50,10 72,55 90,35 90,75" fill="url(#cg)" stroke={color} strokeWidth="2"/>
      <rect x="8" y="72" width="84" height="14" rx="4" fill={dark} stroke={color} strokeWidth="1.5"/>
      <circle cx="28" cy="55" r="5" fill="#fff" opacity="0.6"/>
      <circle cx="50" cy="10" r="5" fill="#fff" opacity="0.6"/>
      <circle cx="72" cy="55" r="5" fill="#fff" opacity="0.6"/>
    </svg>
  );
  if (id === 'seven') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fca5a5"/><stop offset="100%" stopColor={dark}/>
        </linearGradient>
      </defs>
      <text x="50" y="82" textAnchor="middle" fontFamily="Georgia,serif" fontSize="82" fontWeight="900"
        fill="url(#sg)" stroke={dark} strokeWidth="3" paintOrder="stroke">7</text>
      <text x="50" y="82" textAnchor="middle" fontFamily="Georgia,serif" fontSize="82" fontWeight="900"
        fill="url(#sg)" opacity="0.9">7</text>
    </svg>
  );
  if (id === 'lightning') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef9c3"/><stop offset="100%" stopColor={dark}/>
        </linearGradient>
      </defs>
      <polygon points="58,5 20,55 45,55 42,95 80,45 55,45" fill="url(#lg)" stroke={color} strokeWidth="2"/>
      <polygon points="58,5 20,55 45,55 42,95 80,45 55,45" fill="rgba(255,255,255,0.15)"/>
    </svg>
  );
  if (id === 'clover') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <radialGradient id="clg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#bbf7d0"/><stop offset="100%" stopColor={dark}/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="32" r="20" fill="url(#clg)" stroke={color} strokeWidth="1.5"/>
      <circle cx="50" cy="68" r="20" fill="url(#clg)" stroke={color} strokeWidth="1.5"/>
      <circle cx="32" cy="50" r="20" fill="url(#clg)" stroke={color} strokeWidth="1.5"/>
      <circle cx="68" cy="50" r="20" fill="url(#clg)" stroke={color} strokeWidth="1.5"/>
      <rect x="46" y="65" width="8" height="22" rx="4" fill={dark}/>
      <rect x="36" y="84" width="28" height="6" rx="3" fill={dark}/>
    </svg>
  );
  // bell
  return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="bg2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa"/><stop offset="100%" stopColor={dark}/>
        </linearGradient>
      </defs>
      <path d="M50 10 C30 10, 18 28, 18 52 L14 70 L86 70 L82 52 C82 28, 70 10, 50 10 Z"
        fill="url(#bg2)" stroke={color} strokeWidth="2"/>
      <ellipse cx="50" cy="70" rx="36" ry="8" fill={dark} opacity="0.8"/>
      <ellipse cx="50" cy="78" rx="10" ry="7" fill={dark} stroke={color} strokeWidth="1.5"/>
      <circle cx="50" cy="12" r="5" fill={dark} stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

function Confetti() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 20 }}>
      {Array.from({ length: 40 }, (_, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', left: `${10 + Math.random() * 80}%`, top: '-10px',
            width: i % 3 === 0 ? 10 : 7, height: i % 3 === 0 ? 10 : 7,
            borderRadius: i % 2 === 0 ? '50%' : 2,
            background: ['#f59e0b','#4ade80','#06b6d4','#ef4444','#fbbf24','#f97316','#c084fc'][i % 7],
          }}
          animate={{ y: ['0vh', '110vh'], rotate: [0, 720 * (i % 2 === 0 ? 1 : -1)], x: [0, (Math.random() - 0.5) * 160] }}
          transition={{ duration: 2 + Math.random() * 0.8, delay: Math.random() * 0.4, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

function generateGrid(): SymId[] {
  const grid: SymId[] = [];
  const hasMatch = Math.random() < 0.30;
  if (hasMatch) {
    const winSym = SYMS[Math.floor(Math.random() * SYMS.length)];
    const positions = [0,1,2,3,4,5,6,7,8].sort(() => Math.random() - 0.5);
    const winPos = new Set(positions.slice(0, 3));
    for (let i = 0; i < 9; i++) {
      if (winPos.has(i)) grid.push(winSym);
      else { let s: SymId; do { s = SYMS[Math.floor(Math.random() * SYMS.length)]; } while (s === winSym); grid.push(s); }
    }
  } else {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 9; i++) {
      let sym: SymId; let attempts = 0;
      do { sym = SYMS[Math.floor(Math.random() * SYMS.length)]; attempts++; } while ((counts[sym] ?? 0) >= 2 && attempts < 20);
      counts[sym] = (counts[sym] ?? 0) + 1;
      grid.push(sym);
    }
  }
  return grid;
}

function findWinner(grid: SymId[]): { symbol: SymId; positions: number[] } | null {
  const counts: Record<string, number[]> = {};
  grid.forEach((s, i) => { if (!counts[s]) counts[s] = []; counts[s].push(i); });
  for (const [sym, positions] of Object.entries(counts)) {
    if (positions.length >= 3) return { symbol: sym as SymId, positions };
  }
  return null;
}

const panel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16, padding: 20,
};

export default function ScratchCards() {
  const { balance, setBalance } = useGameWallet('ScratchCards');
  const [betAmount, setBetAmount] = useState(5);
  const [phase, setPhase] = useState<Phase>('betting');
  const [grid, setGrid] = useState<SymId[]>([]);
  const [scratched, setScratched] = useState<boolean[]>(Array(9).fill(false));
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [winner, setWinner] = useState<{ symbol: SymId; positions: number[] } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const buyCard = () => {
    if (balance < betAmount) return;
    setBalance(b => parseFloat((b - betAmount).toFixed(2)));
    const g = generateGrid();
    setGrid(g);
    setScratched(Array(9).fill(false));
    setLastProfit(null);
    setWinner(null);
    setShowConfetti(false);
    setPhase('scratching');
  };

  const scratchTile = (i: number) => {
    if (phase !== 'scratching' || scratched[i]) return;
    const next = scratched.map((v, idx) => idx === i ? true : v);
    setScratched(next);
    if (next.every(Boolean)) revealResult(grid);
  };

  const revealAll = () => {
    if (phase !== 'scratching') return;
    setScratched(Array(9).fill(true));
    revealResult(grid);
  };

  const revealResult = (g: SymId[]) => {
    const win = findWinner(g);
    setWinner(win);
    let profit = -betAmount;
    if (win) {
      const winAmt = parseFloat((betAmount * SYM_META[win.symbol].payout).toFixed(2));
      setBalance(b => parseFloat((b + winAmt).toFixed(2)));
      profit = parseFloat((winAmt - betAmount).toFixed(2));
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    setLastProfit(profit);
    setPhase('result');
  };

  const scratchCount = scratched.filter(Boolean).length;

  return (
    <MainLayout>
      <div style={{ background: '#0d0d12', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

        {/* Ambient glows */}
        <div style={{ position:'absolute', top:-100, left:'30%', width:600, height:500, background:'radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:200, right:'20%', width:400, height:400, background:'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 65%)', pointerEvents:'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:6 }}>🎫 Luck Games</div>
              <h1 style={{
                fontSize: 42, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 6px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #f59e0b 50%, #ef4444 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Scratch Cards</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Match 3 symbols — click tiles to scratch</p>
            </div>
            <div style={{ padding:'10px 20px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', textAlign:'right' }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:600, textTransform:'uppercase', letterSpacing:1, marginBottom:2 }}>Balance</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#fff' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '196px 1fr 196px', gap: 16, alignItems: 'start' }}>

            {/* Left panel */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

              <div style={panel}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Card Price</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                  {[1,5,10,25].map(a => (
                    <button key={a} onClick={() => setBetAmount(a)} disabled={phase==='scratching'}
                      style={{
                        padding:'8px 0', borderRadius:8, fontSize:12, fontWeight:700, border:'1px solid',
                        borderColor: betAmount===a ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                        background: betAmount===a ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.03)',
                        color: betAmount===a ? '#06b6d4' : 'rgba(255,255,255,0.4)',
                        cursor: phase==='scratching' ? 'not-allowed' : 'pointer',
                        opacity: phase==='scratching' ? 0.5 : 1, transition:'all 0.15s',
                      }}>${a}</button>
                  ))}
                </div>
              </div>

              {/* Payout table */}
              <div style={panel}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Payouts (3 match)</div>
                {Object.entries(SYM_META).sort((a,b) => b[1].payout - a[1].payout).map(([id, meta]) => (
                  <div key={id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7, paddingBottom:7, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <SymbolSVG id={id as SymId} size={22} />
                      <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>{meta.label}</span>
                    </div>
                    <span style={{ fontSize:12, fontWeight:800, color:meta.color }}>{meta.payout}×</span>
                  </div>
                ))}
              </div>

              {/* Result */}
              <AnimatePresence>
                {lastProfit !== null && (
                  <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
                    style={{
                      borderRadius:14, padding:'14px 0', textAlign:'center',
                      border:`1px solid ${lastProfit>0?'rgba(74,222,128,0.3)':'rgba(248,113,113,0.3)'}`,
                      background: lastProfit>0?'rgba(74,222,128,0.08)':'rgba(248,113,113,0.08)',
                    }}>
                    {winner && (
                      <div style={{ display:'flex', justifyContent:'center', gap:4, marginBottom:6 }}>
                        {[0,1,2].map(i => <SymbolSVG key={i} id={winner.symbol} size={24} />)}
                      </div>
                    )}
                    <div style={{ fontSize:26, fontWeight:900, color:lastProfit>0?'#4ade80':'#f87171' }}>
                      {lastProfit>0?`+$${lastProfit.toFixed(2)}`:'No Match'}
                    </div>
                    {winner && <div style={{ fontSize:10, color:SYM_META[winner.symbol].color, fontWeight:700, marginTop:2, letterSpacing:1 }}>{SYM_META[winner.symbol].label.toUpperCase()} × {SYM_META[winner.symbol].payout}</div>}
                  </motion.div>
                )}
              </AnimatePresence>

              {phase==='scratching' && (
                <motion.button onClick={revealAll} whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                  style={{
                    width:'100%', padding:'13px 0', borderRadius:12, border:'1px solid rgba(6,182,212,0.35)',
                    background:'rgba(6,182,212,0.08)', color:'#06b6d4', fontWeight:800, fontSize:13, cursor:'pointer',
                  }}>
                  REVEAL ALL ({scratchCount}/9)
                </motion.button>
              )}

              {(phase==='betting'||phase==='result') && (
                <motion.button onClick={buyCard} disabled={balance<betAmount}
                  whileHover={{scale:balance<betAmount?1:1.02}} whileTap={{scale:0.97}}
                  style={{
                    width:'100%', padding:'15px 0', borderRadius:12, border:'none',
                    cursor:balance<betAmount?'not-allowed':'pointer',
                    background:balance<betAmount?'rgba(255,255,255,0.06)':'linear-gradient(135deg,#0e7490,#06b6d4,#22d3ee)',
                    color:balance<betAmount?'rgba(255,255,255,0.2)':'#fff',
                    fontWeight:900, fontSize:14, transition:'all 0.2s',
                    boxShadow:balance<betAmount?'none':'0 4px 24px rgba(6,182,212,0.4)',
                  }}>
                  {phase==='result'?`NEW CARD — $${betAmount}`:`BUY CARD — $${betAmount}`}
                </motion.button>
              )}
            </div>

            {/* Card Arena */}
            <div style={{ ...panel, minHeight:520, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, position:'relative', overflow:'hidden' }}>
              {showConfetti && <Confetti />}

              {phase==='betting' ? (
                <div style={{ textAlign:'center' }}>
                  <motion.div animate={{ rotate:[-4,4,-4], y:[0,-8,0] }} transition={{ duration:3, repeat:Infinity }}>
                    <div style={{ fontSize:90, filter:'drop-shadow(0 0 30px rgba(6,182,212,0.4))' }}>🎫</div>
                  </motion.div>
                  <p style={{ fontSize:22, fontWeight:900, color:'#fff', margin:'16px 0 8px' }}>Buy a Scratch Card</p>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.3)', margin:0 }}>Match 3 identical symbols to win</p>
                </div>
              ) : (
                <>
                  {/* The card */}
                  <div style={{
                    width:'100%', maxWidth:420,
                    background:'linear-gradient(160deg,#0a1628,#0f1f3d,#0a1628)',
                    border:'2px solid rgba(245,158,11,0.4)',
                    borderRadius:22,
                    boxShadow:'0 0 40px rgba(245,158,11,0.12), inset 0 0 60px rgba(0,0,0,0.4)',
                    overflow:'hidden',
                  }}>
                    {/* Card header - gold foil style */}
                    <div style={{
                      background:'linear-gradient(90deg,#78350f,#b45309,#f59e0b,#b45309,#78350f)',
                      padding:'10px 20px', display:'flex', justifyContent:'space-between', alignItems:'center',
                    }}>
                      <div style={{ fontSize:13, fontWeight:900, letterSpacing:2, color:'#fef3c7', textShadow:'0 0 10px rgba(245,158,11,0.8)' }}>✦ LUCKY SCRATCH ✦</div>
                      <div style={{ fontSize:9, color:'rgba(254,243,199,0.6)', fontFamily:'monospace' }}>#{Math.floor(1000000+scratchCount*777).toString().slice(0,7)}</div>
                    </div>

                    {/* Subtitle */}
                    <div style={{ textAlign:'center', padding:'10px 0 6px', borderBottom:'1px solid rgba(245,158,11,0.15)' }}>
                      <div style={{ fontSize:10, color:'rgba(245,158,11,0.7)', letterSpacing:2, fontWeight:700 }}>MATCH 3 TO WIN UP TO 50× YOUR BET</div>
                    </div>

                    {/* Grid */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, padding:16 }}>
                      {grid.map((sym, i) => {
                        const isScratched = scratched[i];
                        const isWinning = winner?.positions.includes(i);
                        const meta = SYM_META[sym];
                        return (
                          <motion.button key={i} onClick={() => scratchTile(i)}
                            disabled={isScratched||phase==='result'}
                            whileHover={!isScratched?{scale:1.05,y:-2}:{}}
                            whileTap={!isScratched?{scale:0.93}:{}}
                            style={{
                              aspectRatio:'1', borderRadius:14, border:'2px solid',
                              borderColor: isScratched&&isWinning ? meta.color : isScratched ? 'rgba(255,255,255,0.08)' : 'rgba(245,158,11,0.3)',
                              background: isScratched
                                ? isWinning ? `radial-gradient(circle at 40% 35%, ${meta.color}22, rgba(0,0,0,0.6))` : 'rgba(255,255,255,0.02)'
                                : 'linear-gradient(145deg,#4b5563,#6b7280,#4b5563)',
                              cursor: isScratched||phase==='result' ? 'default':'pointer',
                              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                              position:'relative', overflow:'hidden',
                              boxShadow: isScratched&&isWinning ? `0 0 20px ${meta.color}55, inset 0 0 20px ${meta.color}11` : 'none',
                              transition:'border-color 0.2s, box-shadow 0.2s',
                            }}>

                            {/* Shimmer on unscratched */}
                            {!isScratched && (
                              <>
                                <motion.div
                                  animate={{ backgroundPosition:['200% 0%','-200% 0%'] }}
                                  transition={{ duration:2.5, repeat:Infinity, ease:'linear' }}
                                  style={{
                                    position:'absolute', inset:0, borderRadius:12,
                                    background:'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.14) 50%, transparent 70%)',
                                    backgroundSize:'300% 100%',
                                  }} />
                                {/* Crosshatch texture */}
                                <div style={{
                                  position:'absolute', inset:0, opacity:0.15,
                                  backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,0.3) 0,rgba(255,255,255,0.3) 1px,transparent 0,transparent 50%)',
                                  backgroundSize:'8px 8px',
                                }} />
                                <div style={{ fontSize:26, color:'rgba(255,255,255,0.3)', fontWeight:900, userSelect:'none', position:'relative' }}>?</div>
                              </>
                            )}

                            <AnimatePresence>
                              {isScratched && (
                                <motion.div
                                  initial={{scale:0, opacity:0, rotate:-20}}
                                  animate={{scale:1, opacity:1, rotate:0}}
                                  transition={{type:'spring', stiffness:400, damping:18}}
                                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                                  <div style={{ filter: isWinning ? `drop-shadow(0 0 8px ${meta.color})` : 'none' }}>
                                    <SymbolSVG id={sym} size={44} />
                                  </div>
                                  {isWinning && (
                                    <motion.div
                                      initial={{opacity:0, y:4}} animate={{opacity:1, y:0}}
                                      style={{ fontSize:8, fontWeight:900, letterSpacing:1.5, color:meta.color }}>
                                      MATCH!
                                    </motion.div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Card footer */}
                    <div style={{ textAlign:'center', padding:'8px 16px 14px', borderTop:'1px solid rgba(245,158,11,0.12)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                        <div style={{ flex:1, height:3, borderRadius:2, background:'rgba(245,158,11,0.15)', overflow:'hidden' }}>
                          <motion.div
                            animate={{ width:`${(scratchCount/9)*100}%` }}
                            transition={{ duration:0.3 }}
                            style={{ height:'100%', background:'linear-gradient(90deg,#b45309,#f59e0b)', borderRadius:2 }} />
                        </div>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', whiteSpace:'nowrap' }}>{scratchCount}/9</span>
                      </div>
                    </div>
                  </div>

                  {/* Win result banner */}
                  <AnimatePresence>
                    {phase==='result' && (
                      <motion.div
                        initial={{opacity:0, scale:0.8, y:10}} animate={{opacity:1, scale:1, y:0}}
                        transition={{type:'spring', stiffness:260}}
                        style={{
                          padding:'14px 48px', borderRadius:16, textAlign:'center',
                          border:`2px solid ${winner?`${SYM_META[winner.symbol].color}55`:'rgba(248,113,113,0.35)'}`,
                          background: winner?`radial-gradient(ellipse,${SYM_META[winner.symbol].color}18 0%,transparent 70%)`:'rgba(248,113,113,0.1)',
                          boxShadow: winner?`0 0 40px ${SYM_META[winner.symbol].color}22`:'none',
                        }}>
                        <div style={{ fontSize:26, fontWeight:900, color:winner?SYM_META[winner.symbol].color:'#f87171' }}>
                          {winner ? `🎊 ${SYM_META[winner.symbol].label.toUpperCase()} MATCH!` : '😔 No Match'}
                        </div>
                        {winner && (
                          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginTop:4 }}>
                            {SYM_META[winner.symbol].payout}× payout · +${(betAmount*SYM_META[winner.symbol].payout - betAmount).toFixed(2)} profit
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Right panel */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={panel}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Symbol Guide</div>
                {Object.entries(SYM_META).sort((a,b)=>b[1].payout-a[1].payout).map(([id, meta]) => (
                  <div key={id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <SymbolSVG id={id as SymId} size={32} />
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:meta.color }}>{meta.label}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{meta.payout}× bet</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={panel}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>How to Play</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', lineHeight:1.8 }}>
                  Click tiles one by one or hit <span style={{color:'#06b6d4',fontWeight:700}}>Reveal All</span>.<br/>
                  Get <span style={{color:'#fff',fontWeight:700}}>3 matching</span> symbols to win.<br/>
                  Diamond pays <span style={{color:'#06b6d4',fontWeight:700}}>50×</span> your bet.
                </div>
              </div>
              <div><GameRules gameId="scratch-cards" /></div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
