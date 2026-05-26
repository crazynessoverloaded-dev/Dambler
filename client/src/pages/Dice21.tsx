import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

type Phase = 'betting' | 'playing' | 'result';
type Outcome = 'win' | 'lose' | 'push' | null;

function rollDie() { return Math.floor(Math.random() * 6) + 1; }

const PIP: Record<number, [number,number][]> = {
  1:[[50,50]],
  2:[[28,28],[72,72]],
  3:[[28,28],[50,50],[72,72]],
  4:[[28,28],[72,28],[28,72],[72,72]],
  5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
  6:[[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]],
};

const CHIP_VALUES = [1, 5, 10, 25, 50, 100];
const CHIP_COLORS: Record<number,string> = {
  1:'#e2e8f0', 5:'#ef4444', 10:'#3b82f6', 25:'#10b981', 50:'#f59e0b', 100:'#8b5cf6',
};

function scoreColor(total: number): string {
  if (total > 21)  return '#f87171';
  if (total === 21) return '#f59e0b';
  if (total >= 18)  return '#fbbf24';
  if (total >= 15)  return '#f97316';
  return '#60a5fa';
}

function Die({ value, isNew, bust, perfect, size = 72 }: { value: number; isNew?: boolean; bust?: boolean; perfect?: boolean; size?: number }) {
  const r = Math.round(size * 0.18);
  const pipFill = bust ? '#ef4444' : perfect ? '#92400e' : '#1a1a2e';
  return (
    <motion.div
      initial={isNew ? { rotate: -180, scale: 0, opacity: 0 } : false}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 18 }}
      style={{
        filter: bust
          ? 'drop-shadow(0 0 12px rgba(239,68,68,0.7))'
          : perfect
          ? 'drop-shadow(0 0 14px rgba(245,158,11,0.8))'
          : 'none',
      }}
    >
      <div style={{
        width: size, height: size, borderRadius: r, position: 'relative', flexShrink: 0,
        background: perfect ? 'linear-gradient(145deg, #fffde7, #fef9c3)' : 'linear-gradient(145deg, #ffffff, #e0e0e0)',
        boxShadow: bust
          ? `0 0 0 3px #ef4444, 0 0 0 6px rgba(239,68,68,0.2), 0 8px 24px rgba(0,0,0,0.55)`
          : perfect
          ? `0 0 0 3px #f59e0b, 0 0 0 6px rgba(245,158,11,0.25), 0 8px 24px rgba(0,0,0,0.55)`
          : `0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.9)`,
        transition: 'box-shadow 0.3s',
      }}>
        <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%', position:'absolute', inset:0 }}>
          {(PIP[value]||[]).map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r="10" fill={pipFill}
              style={{ filter:'drop-shadow(0 1px 1px rgba(0,0,0,0.2))' }} />
          ))}
        </svg>
      </div>
    </motion.div>
  );
}

function HiddenDie({ size = 72 }: { size?: number }) {
  const r = Math.round(size * 0.18);
  return (
    <motion.div
      initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      style={{
        width: size, height: size, borderRadius: r, flexShrink: 0,
        background: 'linear-gradient(145deg, #1e2030, #151722)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      <div style={{ fontSize: size * 0.35, color: 'rgba(255,255,255,0.15)', fontWeight: 900, userSelect: 'none' }}>?</div>
    </motion.div>
  );
}

export default function Dice21() {
  const { balance, setBalance } = useGameWallet('Dice21');
  const [bet, setBet]           = useState(10);
  const [phase, setPhase]       = useState<Phase>('betting');
  const [playerDice, setPlayerDice] = useState<number[]>([]);
  const [houseDice, setHouseDice]   = useState<number[]>([]);
  const [outcome, setOutcome]   = useState<Outcome>(null);
  const [profit, setProfit]     = useState(0);
  const [rolling, setRolling]   = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [houseRevealed, setHouseRevealed] = useState(false);
  const [hitCount, setHitCount] = useState(0); // tracks newly added player die

  const playerTotal = playerDice.reduce((a,b) => a+b, 0);
  const houseTotal  = houseDice.reduce((a,b) => a+b, 0);
  const isBust      = playerTotal > 21;
  const playerPerfect = playerTotal === 21;
  const housePerfect  = houseTotal === 21;
  const houseBust     = houseTotal > 21;

  const startGame = () => {
    if (bet > balance) return;
    setBalance(b => parseFloat((b - bet).toFixed(2)));
    const d1 = rollDie(), d2 = rollDie();
    setPlayerDice([d1, d2]);
    setHouseDice([]);
    setOutcome(null);
    setHouseRevealed(false);
    setShowOverlay(false);
    setHitCount(0);
    setPhase('playing');
  };

  const hitDie = () => {
    if (rolling || isBust) return;
    const d = rollDie();
    const next = [...playerDice, d];
    setPlayerDice(next);
    setHitCount(c => c + 1);
    if (next.reduce((a,b) => a+b, 0) > 21) {
      triggerHouseReveal(next, []);
    }
  };

  const triggerHouseReveal = (pDice: number[], hDice: number[]) => {
    setRolling(true);
    setHouseRevealed(true);
    let hCurrent = [...hDice];
    const pSum = pDice.reduce((a,b) => a+b, 0);

    const houseRoll = () => {
      const hSum = hCurrent.reduce((a,b) => a+b, 0);
      if (hSum < 17) {
        hCurrent = [...hCurrent, rollDie()];
        setHouseDice([...hCurrent]);
        setTimeout(houseRoll, 550);
      } else {
        const hS = hCurrent.reduce((a,b) => a+b, 0);
        let result: Outcome;
        if (pSum > 21)           result = 'lose';
        else if (hS > 21 || pSum > hS) result = 'win';
        else if (pSum === hS)    result = 'push';
        else                     result = 'lose';

        if (result === 'win') {
          setBalance(b => parseFloat((b + bet * 2).toFixed(2)));
          setProfit(bet);
        } else if (result === 'push') {
          setBalance(b => parseFloat((b + bet).toFixed(2)));
          setProfit(0);
        } else {
          setProfit(-bet);
        }
        setOutcome(result);
        setPhase('result');
        setRolling(false);
        setTimeout(() => setShowOverlay(true), 500);
      }
    };

    if (hCurrent.length === 0) {
      hCurrent = [rollDie(), rollDie()];
      setHouseDice([...hCurrent]);
      setTimeout(houseRoll, 650);
    } else {
      houseRoll();
    }
  };

  const stand = () => {
    if (rolling) return;
    triggerHouseReveal(playerDice, []);
  };

  const reset = () => {
    setPlayerDice([]);
    setHouseDice([]);
    setOutcome(null);
    setShowOverlay(false);
    setHouseRevealed(false);
    setHitCount(0);
    setPhase('betting');
  };

  const outcomeColor = outcome === 'win' ? '#4ade80' : outcome === 'push' ? '#fbbf24' : '#f87171';
  const canBet = bet <= balance && phase === 'betting';

  return (
    <MainLayout>
      <div style={{ background: '#0d0d12', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

        {/* Ambient */}
        <div style={{ position:'absolute', top:-80, left:'50%', transform:'translateX(-50%)', width:800, height:500, background:'radial-gradient(ellipse, rgba(96,165,250,0.08) 0%, transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:300, right:'15%', width:350, height:350, background:'radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 65%)', pointerEvents:'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <span style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,0.3)', padding:'3px 10px', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20 }}>🎲 Card Game</span>
              </div>
              <h1 style={{ fontSize:42, fontWeight:900, letterSpacing:-1.5, margin:0, color:'#ffffff' }}>Dice 21</h1>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, margin:'4px 0 0' }}>Roll dice to beat the house — get closer to 21 without going over</p>
            </div>
            <div style={{ padding:'10px 20px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', textAlign:'right' }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:600, textTransform:'uppercase', letterSpacing:1, marginBottom:2 }}>Balance</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#fff' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'196px 1fr 196px', gap:16, alignItems:'start' }}>

            {/* Left panel */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

              {/* Chip selector */}
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Bet Amount</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5, marginBottom:10 }}>
                  {CHIP_VALUES.map(v => {
                    const active = bet === v;
                    return (
                      <button key={v} onClick={() => { if (phase==='betting') setBet(v); }} disabled={phase!=='betting'}
                        style={{
                          padding:'8px 0', borderRadius:8, fontSize:11, fontWeight:800, cursor:phase!=='betting'?'default':'pointer',
                          border:`2px solid ${active ? CHIP_COLORS[v] : 'rgba(255,255,255,0.08)'}`,
                          background: active ? `${CHIP_COLORS[v]}20` : 'rgba(255,255,255,0.03)',
                          color: active ? CHIP_COLORS[v] : 'rgba(255,255,255,0.35)',
                          transition:'all 0.15s', opacity:phase!=='betting'?0.5:1,
                          display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                        }}>
                        <div style={{ width:14, height:14, borderRadius:'50%', background:CHIP_COLORS[v], opacity:active?1:0.35, border:'2px dashed rgba(255,255,255,0.35)' }} />
                        ${v}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <button onClick={() => { if (phase==='betting') setBet(p => Math.max(1, Math.floor(p/2))); }} disabled={phase!=='betting'}
                    style={{ flex:1, padding:'6px 0', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, cursor:'pointer' }}>½</button>
                  <div style={{ flex:2, padding:'6px 0', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', fontSize:14, fontWeight:900, color:'#fff', textAlign:'center' }}>${bet}</div>
                  <button onClick={() => { if (phase==='betting') setBet(p => Math.min(balance, p*2)); }} disabled={phase!=='betting'}
                    style={{ flex:1, padding:'6px 0', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, cursor:'pointer' }}>2×</button>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {phase === 'betting' && (
                  <motion.button whileTap={canBet?{scale:0.97}:{}} onClick={startGame} disabled={!canBet}
                    style={{
                      width:'100%', padding:'15px 0', borderRadius:14, border:'none',
                      fontWeight:900, fontSize:16, letterSpacing:0.5, cursor:canBet?'pointer':'not-allowed',
                      background:canBet?'linear-gradient(135deg,#3b82f6,#6366f1)':'rgba(255,255,255,0.06)',
                      color:canBet?'#fff':'rgba(255,255,255,0.2)',
                      boxShadow:canBet?'0 4px 20px rgba(99,102,241,0.35)':'none', transition:'all 0.2s',
                    }}>🎲 DEAL — ${bet}</motion.button>
                )}
                {phase === 'playing' && (
                  <>
                    <motion.button whileTap={!rolling&&!isBust?{scale:0.97}:{}} onClick={hitDie} disabled={rolling||isBust}
                      style={{
                        width:'100%', padding:'15px 0', borderRadius:14, border:'none',
                        fontWeight:900, fontSize:16, cursor:rolling||isBust?'not-allowed':'pointer',
                        background:rolling||isBust?'rgba(255,255,255,0.06)':'linear-gradient(135deg,#3b82f6,#6366f1)',
                        color:rolling||isBust?'rgba(255,255,255,0.2)':'#fff',
                        boxShadow:!rolling&&!isBust?'0 4px 20px rgba(99,102,241,0.35)':'none', transition:'all 0.2s',
                      }}>
                      {rolling ? (
                        <motion.span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                          <motion.span animate={{rotate:360}} transition={{duration:0.6,repeat:Infinity,ease:'linear'}}>🎲</motion.span>
                          Rolling…
                        </motion.span>
                      ) : '🎲 HIT (+1 Die)'}
                    </motion.button>
                    <motion.button
                      whileTap={!rolling?{scale:0.97}:{}}
                      onClick={stand} disabled={rolling}
                      animate={!rolling?{boxShadow:['0 0 0px rgba(74,222,128,0)','0 0 14px rgba(74,222,128,0.35)','0 0 7px rgba(74,222,128,0.15)']}:{}}
                      transition={!rolling?{duration:1.4,repeat:Infinity}:{}}
                      style={{
                        width:'100%', padding:'15px 0', borderRadius:14,
                        border:'2px solid', fontWeight:900, fontSize:16,
                        borderColor:rolling?'rgba(255,255,255,0.1)':'rgba(74,222,128,0.5)',
                        background:rolling?'rgba(255,255,255,0.03)':'rgba(74,222,128,0.1)',
                        color:rolling?'rgba(255,255,255,0.2)':'#4ade80',
                        cursor:rolling?'not-allowed':'pointer', transition:'border-color 0.2s, background 0.2s, color 0.2s',
                      }}>STAND</motion.button>
                  </>
                )}
                {phase === 'result' && (
                  <motion.button initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}
                    whileTap={{scale:0.97}} onClick={reset}
                    style={{ width:'100%', padding:'15px 0', borderRadius:14, border:'none', fontWeight:900, fontSize:16, cursor:'pointer', background:'linear-gradient(135deg,#3b82f6,#6366f1)', color:'#fff', boxShadow:'0 4px 20px rgba(99,102,241,0.35)' }}>
                    NEW GAME
                  </motion.button>
                )}
              </div>

              {/* Payout */}
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Payouts</div>
                {[['Win', '2:1', '#4ade80'], ['Push', 'Returned', '#fbbf24'], ['Lose', '—', '#f87171']].map(([k,v,c]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6, paddingBottom:6, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color:'rgba(255,255,255,0.4)' }}>{k}</span>
                    <span style={{ color:c as string, fontWeight:800 }}>{v}</span>
                  </div>
                ))}
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.7, marginTop:4 }}>
                  House stands on <span style={{ color:'#fff', fontWeight:700 }}>17+</span>.<br />
                  Bust = instant lose.
                </div>
              </div>
            </div>

            {/* Center: game table */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* House area */}
              <div style={{
                borderRadius:20, overflow:'hidden', position:'relative',
                background:'linear-gradient(160deg, #0f1520 0%, #0a0e18 100%)',
                border:`1px solid ${phase==='result'&&houseBust?'rgba(239,68,68,0.35)':phase==='result'&&housePerfect?'rgba(245,158,11,0.35)':'rgba(255,255,255,0.08)'}`,
                padding:'22px 24px', transition:'border-color 0.4s',
              }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.012) 40px,rgba(255,255,255,0.012) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.012) 40px,rgba(255,255,255,0.012) 41px)', pointerEvents:'none' }} />

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, position:'relative', zIndex:1 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase' }}>House</div>
                  <AnimatePresence mode="wait">
                    {houseRevealed && houseDice.length > 0 && (
                      <motion.div key="house-score"
                        initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}}
                        transition={{type:'spring',stiffness:300,damping:20}}
                        style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                        <span style={{ fontSize:36, fontWeight:900, lineHeight:1, color:scoreColor(houseTotal), letterSpacing:-1 }}>{houseTotal}</span>
                        {houseBust && <span style={{ fontSize:12, fontWeight:700, color:'#f87171' }}>BUST</span>}
                        {housePerfect && <span style={{ fontSize:12, fontWeight:700, color:'#f59e0b' }}>21!</span>}
                      </motion.div>
                    )}
                    {!houseRevealed && phase==='playing' && (
                      <motion.div key="house-hidden" style={{ fontSize:12, color:'rgba(255,255,255,0.25)', fontStyle:'italic' }}>Hidden</motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div style={{ display:'flex', gap:10, flexWrap:'wrap', minHeight:80, alignItems:'center', position:'relative', zIndex:1 }}>
                  {phase === 'betting' ? (
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.2)', fontStyle:'italic' }}>Waiting for deal…</span>
                  ) : !houseRevealed ? (
                    // face-down placeholders
                    [0,1].map(i => <HiddenDie key={i} size={72} />)
                  ) : (
                    houseDice.map((d,i) => (
                      <Die key={`h-${i}`} value={d} isNew size={72}
                        bust={houseBust} perfect={housePerfect} />
                    ))
                  )}
                  {/* Rolling indicator */}
                  {rolling && houseRevealed && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}}
                      style={{ display:'flex', gap:5, alignItems:'center', marginLeft:4 }}>
                      {[0,1,2].map(i => (
                        <motion.div key={i} animate={{scale:[1,1.5,1],opacity:[0.3,1,0.3]}}
                          transition={{duration:0.5,repeat:Infinity,delay:i*0.15}}
                          style={{ width:7, height:7, borderRadius:'50%', background:'#60a5fa' }} />
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* VS divider */}
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
                <AnimatePresence mode="wait">
                  {phase==='result' && outcome ? (
                    <motion.div key="outcome-badge"
                      initial={{scale:0,rotate:-20}} animate={{scale:1,rotate:0}}
                      transition={{type:'spring',stiffness:300,damping:18}}
                      style={{
                        padding:'6px 18px', borderRadius:20, fontSize:13, fontWeight:900,
                        background:`${outcomeColor}18`, border:`1px solid ${outcomeColor}55`,
                        color:outcomeColor, letterSpacing:1, textTransform:'uppercase',
                      }}>
                      {outcome === 'win' ? '🎉 YOU WIN' : outcome === 'push' ? '🤝 PUSH' : isBust ? '💥 BUST' : '💀 HOUSE WINS'}
                    </motion.div>
                  ) : (
                    <div key="vs" style={{ fontSize:12, fontWeight:900, color:'rgba(255,255,255,0.15)', letterSpacing:2 }}>VS</div>
                  )}
                </AnimatePresence>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Player area */}
              <div style={{
                borderRadius:20, overflow:'hidden', position:'relative',
                background:'linear-gradient(160deg, #0f1520 0%, #0a0e18 100%)',
                border:`1px solid ${isBust?'rgba(239,68,68,0.4)':playerPerfect?'rgba(245,158,11,0.4)':phase==='playing'?'rgba(96,165,250,0.2)':'rgba(255,255,255,0.08)'}`,
                padding:'22px 24px', transition:'border-color 0.4s',
              }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.012) 40px,rgba(255,255,255,0.012) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.012) 40px,rgba(255,255,255,0.012) 41px)', pointerEvents:'none' }} />

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, position:'relative', zIndex:1 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase' }}>You</div>
                  {playerDice.length > 0 && (
                    <motion.div key={playerTotal}
                      initial={{scale:0.6,opacity:0}} animate={{scale:1,opacity:1}}
                      transition={{type:'spring',stiffness:320,damping:20}}
                      style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                      <span style={{ fontSize:36, fontWeight:900, lineHeight:1, color:scoreColor(playerTotal), letterSpacing:-1 }}>{playerTotal}</span>
                      {isBust     && <span style={{ fontSize:12, fontWeight:700, color:'#f87171' }}>BUST</span>}
                      {playerPerfect && <span style={{ fontSize:12, fontWeight:700, color:'#f59e0b' }}>21!</span>}
                    </motion.div>
                  )}
                </div>

                <div style={{ display:'flex', gap:10, flexWrap:'wrap', minHeight:80, alignItems:'center', position:'relative', zIndex:1 }}>
                  {phase === 'betting' ? (
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.2)', fontStyle:'italic' }}>Place your bet to begin…</span>
                  ) : (
                    playerDice.map((d,i) => (
                      <Die key={`p-${i}-${hitCount}`} value={d}
                        isNew={i === playerDice.length - 1 && (i > 1 || hitCount > 0)}
                        bust={isBust} perfect={playerPerfect} size={72} />
                    ))
                  )}
                </div>

                {/* Score progress bar */}
                {playerDice.length > 0 && (
                  <div style={{ marginTop:16, position:'relative', zIndex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>
                      <span>0</span><span style={{ color:'rgba(255,255,255,0.4)' }}>17</span><span style={{ color:scoreColor(playerTotal) }}>21</span>
                    </div>
                    <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.07)', overflow:'hidden', position:'relative' }}>
                      <motion.div
                        animate={{ width:`${Math.min((playerTotal/21)*100, 100)}%` }}
                        transition={{ duration:0.45, type:'spring', stiffness:120 }}
                        style={{
                          height:'100%', borderRadius:3,
                          background: isBust ? '#ef4444'
                            : playerPerfect ? 'linear-gradient(90deg,#f97316,#f59e0b)'
                            : playerTotal >= 18 ? 'linear-gradient(90deg,#f97316,#fbbf24)'
                            : playerTotal >= 15 ? 'linear-gradient(90deg,#3b82f6,#f97316)'
                            : 'linear-gradient(90deg,#3b82f6,#6366f1)',
                          boxShadow:`0 0 8px ${scoreColor(playerTotal)}`,
                        }} />
                      {/* 21 marker */}
                      <div style={{ position:'absolute', top:0, bottom:0, left:'100%', width:2, background:'rgba(245,158,11,0.5)', transform:'translateX(-1px)' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Score comparison after result */}
              <AnimatePresence>
                {phase === 'result' && (
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    style={{
                      borderRadius:14, padding:'14px 18px',
                      background:`${outcomeColor}10`, border:`1px solid ${outcomeColor}30`,
                      display:'flex', justifyContent:'space-around', alignItems:'center',
                    }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:3 }}>Your Total</div>
                      <div style={{ fontSize:28, fontWeight:900, color:scoreColor(playerTotal) }}>{playerTotal}</div>
                    </div>
                    <div style={{ fontSize:22, color:'rgba(255,255,255,0.15)', fontWeight:900 }}>vs</div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:3 }}>House Total</div>
                      <div style={{ fontSize:28, fontWeight:900, color:scoreColor(houseTotal) }}>{houseTotal}</div>
                    </div>
                    <div style={{ borderLeft:'1px solid rgba(255,255,255,0.08)', paddingLeft:16, textAlign:'center' }}>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:3 }}>Profit</div>
                      <div style={{ fontSize:22, fontWeight:900, color:outcomeColor }}>
                        {profit > 0 ? `+$${profit.toFixed(2)}` : profit < 0 ? `-$${Math.abs(profit).toFixed(2)}` : 'Push'}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right panel */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Score Guide</div>
                {[
                  ['21', 'Perfect!', '#f59e0b'],
                  ['18–20', 'Very strong', '#fbbf24'],
                  ['15–17', 'Risky', '#f97316'],
                  ['≤ 14', 'Roll more', '#60a5fa'],
                  ['22+', 'Bust', '#f87171'],
                ].map(([range, label, col]) => (
                  <div key={range} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7, paddingBottom:7, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize:13, fontWeight:900, color:col as string }}>{range}</span>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{label}</span>
                  </div>
                ))}
              </div>

              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>House Rules</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', lineHeight:1.8 }}>
                  House draws until <span style={{ color:'#fff', fontWeight:700 }}>17+</span>.<br />
                  Both bust = <span style={{ color:'#f87171', fontWeight:700 }}>house wins</span>.<br />
                  Ties = <span style={{ color:'#fbbf24', fontWeight:700 }}>push</span> (bet returned).
                </div>
              </div>

              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Strategy Tip</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', lineHeight:1.7 }}>
                  Stand at <span style={{ color:'#fbbf24', fontWeight:700 }}>17–20</span>.<br />
                  Hit below <span style={{ color:'#60a5fa', fontWeight:700 }}>15</span>.<br />
                  Never beat yourself — avoid the bust.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop:24 }}>
            <GameRules gameId="dice-21" />
          </div>
        </div>

        {/* Win/Loss/Push overlay */}
        <AnimatePresence>
          {showOverlay && phase==='result' && outcome && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', zIndex:100 }}>
              {outcome==='win' && [1,2,3].map(i => (
                <motion.div key={i}
                  initial={{scale:0,opacity:0.7}} animate={{scale:5+i*1.5,opacity:0}}
                  transition={{duration:1.1,delay:i*0.13,ease:'easeOut'}}
                  style={{ position:'absolute', width:100, height:100, borderRadius:'50%', border:`2px solid ${outcomeColor}` }} />
              ))}
              <motion.div
                initial={{scale:0.3,opacity:0,y:50}} animate={{scale:1,opacity:1,y:0}}
                exit={{scale:0.8,opacity:0,y:-30}}
                transition={{type:'spring',stiffness:340,damping:22}}
                style={{
                  borderRadius:24, padding:'28px 52px', textAlign:'center',
                  background: outcome==='win' ? 'rgba(5,46,22,0.96)' : outcome==='push' ? 'rgba(40,35,5,0.96)' : 'rgba(69,10,10,0.96)',
                  border:`2px solid ${outcomeColor}`,
                  boxShadow:`0 0 60px ${outcomeColor}44`,
                }}>
                <div style={{ fontSize:12, fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:outcomeColor, marginBottom:6 }}>
                  {outcome==='win' ? '🎉 YOU WIN' : outcome==='push' ? '🤝 PUSH' : isBust ? '💥 BUST' : '💀 HOUSE WINS'}
                </div>
                <div style={{ fontSize:52, fontWeight:900, color:outcomeColor, lineHeight:1, letterSpacing:-2 }}>
                  {profit > 0 ? `+$${profit.toFixed(2)}` : profit < 0 ? `-$${Math.abs(profit).toFixed(2)}` : 'Returned'}
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:8 }}>
                  Your {playerTotal} vs House {houseTotal}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
