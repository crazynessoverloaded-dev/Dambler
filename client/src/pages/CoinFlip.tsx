import { useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [1, 5, 10, 25, 50, 100];
const CHIP_COLORS: Record<number,string> = {
  1:'#e2e8f0', 5:'#ef4444', 10:'#3b82f6', 25:'#10b981', 50:'#f59e0b', 100:'#8b5cf6',
};

const GOLD = '#f59e0b';
const SILVER = '#94a3b8';

function HeadsFace({ size = 200 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id="hg" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#fef9c3"/>
          <stop offset="40%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#78350f"/>
        </radialGradient>
        <radialGradient id="hg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      {/* Outer ring (ridges) */}
      {Array.from({length:36},(_,i)=>{
        const a=(i/36)*Math.PI*2; const r1=98; const r2=92;
        return <line key={i} x1={100+r1*Math.cos(a)} y1={100+r1*Math.sin(a)} x2={100+r2*Math.cos(a)} y2={100+r2*Math.sin(a)} stroke="#92400e" strokeWidth="2.5" opacity="0.7"/>;
      })}
      {/* Main face */}
      <circle cx="100" cy="100" r="90" fill="url(#hg)"/>
      <circle cx="100" cy="100" r="90" fill="url(#hg2)"/>
      {/* Inner decorative ring */}
      <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(254,243,199,0.4)" strokeWidth="2"/>
      <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(254,243,199,0.2)" strokeWidth="1"/>
      {/* Crown */}
      <polygon points="100,30 68,65 80,60 100,50 120,60 132,65" fill="#fef3c7" opacity="0.9"/>
      <polygon points="68,65 132,65 128,82 72,82" fill="#fbbf24"/>
      <rect x="72" y="82" width="56" height="10" rx="3" fill="#f59e0b"/>
      {/* Jewels on crown */}
      <circle cx="100" cy="50" r="5" fill="#06b6d4" opacity="0.9"/>
      <circle cx="80" cy="60" r="3.5" fill="#ef4444" opacity="0.9"/>
      <circle cx="120" cy="60" r="3.5" fill="#10b981" opacity="0.9"/>
      {/* H text */}
      <text x="100" y="138" textAnchor="middle" dominantBaseline="middle"
        fontFamily="Georgia,serif" fontSize="38" fontWeight="900"
        fill="#78350f" opacity="0.85">H</text>
      {/* Bottom text */}
      <text x="100" y="162" textAnchor="middle" dominantBaseline="middle"
        fontFamily="system-ui" fontSize="10" fontWeight="700" letterSpacing="3"
        fill="rgba(254,243,199,0.6)">HEADS</text>
      {/* Shine */}
      <ellipse cx="70" cy="60" rx="22" ry="12" fill="rgba(255,255,255,0.15)" transform="rotate(-30,70,60)"/>
    </svg>
  );
}

function TailsFace({ size = 200 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id="tg" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#f1f5f9"/>
          <stop offset="45%" stopColor="#94a3b8"/>
          <stop offset="100%" stopColor="#1e293b"/>
        </radialGradient>
        <radialGradient id="tg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      {/* Ridges */}
      {Array.from({length:36},(_,i)=>{
        const a=(i/36)*Math.PI*2; const r1=98; const r2=92;
        return <line key={i} x1={100+r1*Math.cos(a)} y1={100+r1*Math.sin(a)} x2={100+r2*Math.cos(a)} y2={100+r2*Math.sin(a)} stroke="#475569" strokeWidth="2.5" opacity="0.7"/>;
      })}
      <circle cx="100" cy="100" r="90" fill="url(#tg)"/>
      <circle cx="100" cy="100" r="90" fill="url(#tg2)"/>
      <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(226,232,240,0.35)" strokeWidth="2"/>
      <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(226,232,240,0.18)" strokeWidth="1"/>
      {/* Star burst */}
      {Array.from({length:8},(_,i)=>{
        const a=(i/8)*Math.PI*2 - Math.PI/2;
        const a2=a+Math.PI/8;
        const r1=52; const r2=28;
        return (
          <polygon key={i}
            points={`${100+r1*Math.cos(a)},${100+r1*Math.sin(a)} ${100+r2*Math.cos(a2)},${100+r2*Math.sin(a2)} ${100+r1*Math.cos(a+Math.PI/4)},${100+r1*Math.sin(a+Math.PI/4)}`}
            fill="rgba(226,232,240,0.5)" />
        );
      })}
      <circle cx="100" cy="100" r="22" fill="#94a3b8"/>
      <circle cx="100" cy="100" r="18" fill="#cbd5e1"/>
      {/* T text */}
      <text x="100" y="138" textAnchor="middle" dominantBaseline="middle"
        fontFamily="Georgia,serif" fontSize="38" fontWeight="900"
        fill="#1e293b" opacity="0.85">T</text>
      <text x="100" y="162" textAnchor="middle" dominantBaseline="middle"
        fontFamily="system-ui" fontSize="10" fontWeight="700" letterSpacing="3"
        fill="rgba(226,232,240,0.6)">TAILS</text>
      <ellipse cx="68" cy="58" rx="20" ry="11" fill="rgba(255,255,255,0.18)" transform="rotate(-30,68,58)"/>
    </svg>
  );
}

export default function CoinFlip() {
  const { balance, setBalance } = useGameWallet('CoinFlip');
  const [bet, setBet] = useState(10);
  const [side, setSide] = useState<'heads'|'tails'|null>(null);
  const [result, setResult] = useState<'heads'|'tails'|null>(null);
  const [flipping, setFlipping] = useState(false);
  const [phase, setPhase] = useState<'betting'|'result'>('betting');
  const [history, setHistory] = useState<{side:string;result:string;profit:number}[]>([]);
  const [showRings, setShowRings] = useState(false);
  const [faceShown, setFaceShown] = useState<'heads'|'tails'>('heads');
  const coinControls = useAnimation();
  const flipRef = useRef(false);

  const headCount = history.filter(h=>h.result==='heads').length;
  const tailCount = history.filter(h=>h.result==='tails').length;
  const winCount  = history.filter(h=>h.profit>0).length;
  const streak = (() => {
    let s=0; for(let i=0;i<history.length;i++){ if(history[i].profit>0) s++; else break; } return s;
  })();

  const flip = () => {
    if (!side || bet > balance || flipping || phase !== 'betting') return;
    flipRef.current = true;
    setFlipping(true);
    setBalance(b => +(b - bet).toFixed(2));

    const outcome: 'heads'|'tails' = Math.random() < 0.5 ? 'heads' : 'tails';

    // Spin many rotations, land on outcome face
    coinControls.start({
      rotateY: [0, 360, 720, 1080, 1440, 1800, outcome==='heads'?2160:2340],
      scaleX: [1, 1.05, 1.05, 1.05, 1, 1, 1],
      y: [0, -30, -20, -30, -10, -5, 0],
      transition: { duration: 2.4, ease: [0.22, 1, 0.36, 1] },
    });

    // Halfway through swap face
    setTimeout(() => setFaceShown(outcome), 1200);

    setTimeout(() => {
      const won = outcome === side;
      const profit = won ? +(bet * 0.90).toFixed(2) : -bet;
      setResult(outcome);
      setBalance(prev => +(prev + (won ? bet + profit : 0)).toFixed(2));
      setHistory(prev => [{side:side!,result:outcome,profit},...prev.slice(0,9)]);
      setFlipping(false);
      setPhase('result');
      flipRef.current = false;
      if (won) {
        setShowRings(true);
        setTimeout(() => setShowRings(false), 1200);
      }
    }, 2400);
  };

  const reset = () => {
    setPhase('betting');
    setSide(null);
    setResult(null);
    setFaceShown('heads');
    coinControls.set({ rotateY: 0, scaleX: 1, y: 0 });
  };

  const won = phase==='result' && result===side;
  const activeColor = result ? (result==='heads' ? GOLD : SILVER) : side ? (side==='heads' ? GOLD : SILVER) : '#6366f1';

  const panel: React.CSSProperties = {
    background:'rgba(255,255,255,0.03)',
    border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:16, padding:18,
  };

  return (
    <MainLayout>
      <div style={{ background:'#0d0d12', minHeight:'100vh', position:'relative', overflow:'hidden' }}>

        {/* Ambient */}
        <motion.div
          animate={{ opacity: flipping ? 0.7 : won ? 0.6 : 0.15 }}
          transition={{ duration: 0.8 }}
          style={{
            position:'absolute', top:0, left:0, right:0, height:600,
            background:`radial-gradient(ellipse at 50% 0%, ${activeColor}28 0%, transparent 65%)`,
            pointerEvents:'none', transition:'background 0.5s',
          }} />

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 24px 64px', position:'relative' }}>

          {/* Header */}
          <div style={{ marginBottom:32, display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:6 }}>🪙 Luck Games</div>
              <h1 style={{
                fontSize:42, fontWeight:900, letterSpacing:-1.5, margin:'0 0 6px',
                background:`linear-gradient(135deg, ${GOLD} 0%, #fbbf24 45%, ${SILVER} 80%, #e2e8f0 100%)`,
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>Coin Flip</h1>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, margin:0 }}>Pick Heads or Tails — 50/50 shot at 1.98× your bet</p>
            </div>
            <div style={{ padding:'10px 20px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', textAlign:'right' }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:600, textTransform:'uppercase', letterSpacing:1, marginBottom:2 }}>Balance</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#fff' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'196px 1fr 196px', gap:16, alignItems:'start' }}>

            {/* Left panel */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

              {/* Side picker */}
              <div style={panel}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Choose Side</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {(['heads','tails'] as const).map(s => {
                    const c = s==='heads' ? GOLD : SILVER;
                    const selected = side===s;
                    return (
                      <motion.button key={s} onClick={() => phase==='betting' && setSide(s)}
                        disabled={phase!=='betting'}
                        whileHover={{scale:1.04}} whileTap={{scale:0.96}}
                        style={{
                          padding:'14px 8px', borderRadius:12, border:`2px solid ${selected?c:'rgba(255,255,255,0.08)'}`,
                          background: selected?`${c}18`:'rgba(255,255,255,0.03)',
                          color: selected?c:'rgba(255,255,255,0.4)',
                          cursor: phase!=='betting'?'not-allowed':'pointer',
                          opacity: phase!=='betting'?0.5:1,
                          textAlign:'center', fontWeight:800, fontSize:11,
                          boxShadow: selected?`0 0 20px ${c}33`:'none',
                          transition:'all 0.2s',
                        }}>
                        <div style={{ marginBottom:6, display:'flex', justifyContent:'center' }}>
                          {s==='heads' ? <HeadsFace size={44}/> : <TailsFace size={44}/>}
                        </div>
                        <div style={{ textTransform:'capitalize', letterSpacing:1 }}>{s}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Chip selector */}
              <div style={panel}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Bet Amount</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5, marginBottom:10 }}>
                  {CHIPS.map(c => {
                    const active = bet===c;
                    return (
                      <button key={c} onClick={() => phase==='betting'&&setBet(c)} disabled={phase!=='betting'}
                        style={{
                          padding:'7px 0', borderRadius:8, fontSize:11, fontWeight:800, border:`2px solid ${active?CHIP_COLORS[c]:'rgba(255,255,255,0.08)'}`,
                          background: active?`${CHIP_COLORS[c]}20`:'rgba(255,255,255,0.03)',
                          color: active?CHIP_COLORS[c]:'rgba(255,255,255,0.35)',
                          cursor: phase!=='betting'?'not-allowed':'pointer',
                          opacity: phase!=='betting'?0.5:1, transition:'all 0.15s',
                          display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                        }}>
                        <div style={{ width:12, height:12, borderRadius:'50%', background:CHIP_COLORS[c], opacity:active?1:0.35, border:'2px dashed rgba(255,255,255,0.4)' }}/>
                        ${c}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <button onClick={() => setBet(p=>Math.max(1,Math.floor(p/2)))} disabled={phase!=='betting'}
                    style={{ flex:1, padding:'6px 0', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, cursor:'pointer' }}>½</button>
                  <div style={{ flex:2, padding:'6px 0', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', fontSize:13, fontWeight:900, color:'#fff', textAlign:'center' }}>${bet}</div>
                  <button onClick={() => setBet(p=>Math.min(balance,p*2))} disabled={phase!=='betting'}
                    style={{ flex:1, padding:'6px 0', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, cursor:'pointer' }}>2×</button>
                </div>
              </div>

              {/* Result */}
              <AnimatePresence>
                {phase==='result' && (
                  <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                    style={{
                      borderRadius:14, padding:'14px 0', textAlign:'center',
                      border:`1px solid ${won?'rgba(74,222,128,0.3)':'rgba(248,113,113,0.3)'}`,
                      background: won?'rgba(74,222,128,0.08)':'rgba(248,113,113,0.08)',
                    }}>
                    <div style={{ fontSize:28, fontWeight:900, color:won?'#4ade80':'#f87171' }}>
                      {won?`+$${(bet*0.98).toFixed(2)}`:`-$${bet.toFixed(2)}`}
                    </div>
                    <div style={{ fontSize:11, marginTop:4, color:'rgba(255,255,255,0.35)' }}>
                      {result==='heads'?'Heads':'Tails'} — {won?'You win!':'Better luck!'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action button */}
              {phase==='betting' ? (
                <motion.button onClick={flip} disabled={!side||bet>balance||flipping}
                  whileHover={{scale:!side||bet>balance||flipping?1:1.02}} whileTap={{scale:0.97}}
                  style={{
                    width:'100%', padding:'15px 0', borderRadius:14, border:'none',
                    cursor:!side||bet>balance?'not-allowed':'pointer',
                    background:!side||bet>balance?'rgba(255,255,255,0.06)':'linear-gradient(135deg,#b45309,#f59e0b,#fbbf24)',
                    color:!side||bet>balance?'rgba(255,255,255,0.2)':'#000',
                    fontWeight:900, fontSize:15, transition:'all 0.2s',
                    boxShadow:!side||bet>balance?'none':'0 4px 24px rgba(245,158,11,0.45)',
                  }}>
                  {flipping?'FLIPPING…':side?`FLIP — $${bet}`:'PICK A SIDE'}
                </motion.button>
              ) : (
                <motion.button onClick={reset} whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                  style={{ width:'100%', padding:'15px 0', borderRadius:14, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#b45309,#f59e0b,#fbbf24)', color:'#000', fontWeight:900, fontSize:15, boxShadow:'0 4px 24px rgba(245,158,11,0.4)' }}>
                  FLIP AGAIN
                </motion.button>
              )}

              {/* History */}
              {history.length>0 && (
                <div style={panel}>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Recent Flips</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {history.map((h,i) => (
                      <motion.div key={i} initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',delay:i*0.03}}
                        style={{
                          width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                          background: h.profit>0?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.15)',
                          border:`1px solid ${h.profit>0?'rgba(74,222,128,0.4)':'rgba(248,113,113,0.3)'}`,
                          fontSize:10, fontWeight:900, color:h.profit>0?'#4ade80':'#f87171',
                        }}>
                        {h.result==='heads'?'H':'T'}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coin arena */}
            <div style={{
              ...panel, minHeight:520,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:32, position:'relative', overflow:'hidden',
            }}>
              {/* Arena glow */}
              <motion.div
                animate={{ opacity: flipping?[0.3,0.8,0.3]:won?0.7:0.2, scale: flipping?[1,1.1,1]:1 }}
                transition={{ duration:0.7, repeat:flipping?Infinity:0 }}
                style={{
                  position:'absolute', width:360, height:360, borderRadius:'50%',
                  background:`radial-gradient(circle, ${activeColor}22 0%, transparent 65%)`,
                  pointerEvents:'none',
                }} />

              {/* Impact rings on win */}
              <AnimatePresence>
                {showRings && [1,2,3].map(i => (
                  <motion.div key={i}
                    initial={{scale:0.5, opacity:0.8}}
                    animate={{scale:3+i*0.8, opacity:0}}
                    transition={{duration:0.9, delay:i*0.12, ease:'easeOut'}}
                    style={{
                      position:'absolute', width:180, height:180, borderRadius:'50%',
                      border:`2px solid ${GOLD}`, pointerEvents:'none',
                    }} />
                ))}
              </AnimatePresence>

              {/* Coin shadow */}
              <motion.div
                animate={{
                  scaleX: flipping?[1,1.4,0.8,1.4,1]:1,
                  opacity: flipping?[0.3,0.1,0.3,0.1,0.3]:0.25,
                }}
                transition={{ duration:2.4, ease:'easeInOut' }}
                style={{
                  position:'absolute', bottom:80, width:160, height:24, borderRadius:'50%',
                  background:'radial-gradient(ellipse,rgba(0,0,0,0.7) 0%,transparent 70%)',
                  pointerEvents:'none', filter:'blur(6px)',
                }} />

              {/* Coin */}
              <div style={{ perspective:1200, position:'relative' }}>
                <motion.div animate={coinControls} style={{ transformStyle:'preserve-3d' }}>
                  {faceShown==='heads' ? <HeadsFace size={200}/> : <TailsFace size={200}/>}
                </motion.div>
              </div>

              {/* Status text */}
              <AnimatePresence mode="wait">
                {flipping && (
                  <motion.div key="spin" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                    <motion.div animate={{opacity:[0.5,1,0.5]}} transition={{duration:0.6,repeat:Infinity}}
                      style={{ fontSize:20, fontWeight:900, color:GOLD, letterSpacing:3 }}>
                      ◈  FLIPPING  ◈
                    </motion.div>
                  </motion.div>
                )}
                {phase==='result' && !flipping && (
                  <motion.div key="res" initial={{opacity:0,scale:0.7,y:20}} animate={{opacity:1,scale:1,y:0}}
                    exit={{opacity:0}} style={{textAlign:'center'}}>
                    <motion.div
                      animate={won?{scale:[1,1.14,1]}:{}}
                      transition={{duration:0.4}}
                      style={{ fontSize:54, fontWeight:900, color:won?'#4ade80':'#f87171', lineHeight:1, letterSpacing:-2 }}>
                      {won?`+$${(bet*0.98).toFixed(2)}`:`-$${bet}`}
                    </motion.div>
                    <div style={{ fontSize:15, color:'rgba(255,255,255,0.4)', marginTop:8, textTransform:'capitalize' }}>
                      {result} landed — {won?'🎉 You win!':'Better luck next time'}
                    </div>
                  </motion.div>
                )}
                {phase==='betting' && !flipping && (
                  <motion.div key="idle" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{textAlign:'center'}}>
                    {side ? (
                      <motion.div animate={{y:[0,-5,0]}} transition={{duration:2,repeat:Infinity}}
                        style={{ fontSize:15, fontWeight:700, color:side==='heads'?GOLD:SILVER }}>
                        {side==='heads'?'👑':'⭐'} Ready — click FLIP!
                      </motion.div>
                    ) : (
                      <div style={{ fontSize:14, color:'rgba(255,255,255,0.25)' }}>Pick Heads or Tails to begin</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Streak dots */}
              {history.length>0 && (
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginRight:2, letterSpacing:1 }}>LAST</span>
                  {history.slice(0,8).reverse().map((h,i) => (
                    <motion.div key={i} initial={{scale:0}} animate={{scale:1}} transition={{delay:i*0.04,type:'spring'}}
                      style={{ width:9, height:9, borderRadius:'50%', background:h.profit>0?'#4ade80':'#f87171',
                        boxShadow:h.profit>0?'0 0 6px #4ade8088':'0 0 6px #f8717188' }} />
                  ))}
                </div>
              )}
            </div>

            {/* Right panel — stats */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {history.length>0 && (
                <div style={panel}>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Session Stats</div>
                  {[
                    ['Flips', history.length, '#fff'],
                    ['Wins', winCount, '#4ade80'],
                    ['Win Rate', history.length?`${Math.round((winCount/history.length)*100)}%`:'—', '#fbbf24'],
                    ['Streak', streak, streak>=3?'#f59e0b':'rgba(255,255,255,0.5)'],
                  ].map(([label,val,col]) => (
                    <div key={label as string} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:8, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color:'rgba(255,255,255,0.35)' }}>{label}</span>
                      <span style={{ color:col as string, fontWeight:800 }}>{val}</span>
                    </div>
                  ))}
                  {/* H/T bar */}
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:5 }}>
                    Heads vs Tails
                  </div>
                  <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden', display:'flex' }}>
                    <motion.div
                      animate={{ width:`${history.length?(headCount/history.length)*100:50}%` }}
                      transition={{ duration:0.5 }}
                      style={{ height:'100%', background:`linear-gradient(90deg,${GOLD},#fbbf24)`, borderRadius:'3px 0 0 3px' }}/>
                    <motion.div
                      animate={{ width:`${history.length?(tailCount/history.length)*100:50}%` }}
                      transition={{ duration:0.5 }}
                      style={{ height:'100%', background:`linear-gradient(90deg,#475569,${SILVER})`, borderRadius:'0 3px 3px 0' }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:4 }}>
                    <span style={{color:GOLD}}>H {headCount}</span>
                    <span style={{color:SILVER}}>T {tailCount}</span>
                  </div>
                </div>
              )}

              <div style={panel}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Payout</div>
                {[['Win','1.98×','#4ade80'],['Lose','—','#f87171']].map(([k,v,c])=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6, paddingBottom:6, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{color:'rgba(255,255,255,0.4)'}}>{k}</span>
                    <span style={{color:c,fontWeight:800}}>{v}</span>
                  </div>
                ))}
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.7, marginTop:4 }}>
                  True 50/50 odds.<br/>2% house edge.
                </div>
              </div>

              <div><GameRules gameId="coinflip" /></div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
