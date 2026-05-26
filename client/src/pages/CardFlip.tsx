import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [5, 10, 25, 50, 100];

function PlayingCard({ revealed, isAce, flipped, onClick, index }: {
  revealed: boolean; isAce: boolean; flipped: boolean; onClick: () => void; index: number;
}) {
  const accentColor = '#6366f1';
  return (
    <motion.div
      className="cursor-pointer"
      onClick={onClick}
      whileHover={!flipped ? { y: -14, scale: 1.05 } : {}}
      style={{ perspective: 800 }}>
      <motion.div
        style={{ transformStyle: 'preserve-3d', position: 'relative', width: 110, height: 154 }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>

        {/* Back face */}
        <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: 'absolute', inset: 0, borderRadius: 14 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 14, background: `linear-gradient(135deg, #1e1b3a, #2d2060, #1a174f)`, border: `2.5px solid ${accentColor}55`, boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px ${accentColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 64, height: 90, borderRadius: 8, border: `2px solid ${accentColor}33`, background: `${accentColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: `${accentColor}66`, fontSize: 28 }}>?</span>
            </div>
          </div>
        </div>

        {/* Front face */}
        <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0, borderRadius: 14 }}>
          {isAce ? (
            <div style={{ width: '100%', height: '100%', borderRadius: 14, background: '#fff', border: '2.5px solid rgba(0,0,0,0.08)', boxShadow: '0 0 40px rgba(245,158,11,0.6), 0 8px 32px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-start', color: '#0f172a' }}>A</span>
              <span style={{ fontSize: 56, lineHeight: 1 }}>♠</span>
              <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)', color: '#0f172a' }}>A</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', borderRadius: 14, background: revealed ? '#fff' : '#f8fafc', border: '2.5px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 32, opacity: 0.25 }}>🂠</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#94a3b8' }}>—</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Card label */}
      <p className="text-center text-xs font-black mt-3 uppercase tracking-wider" style={{ color: flipped ? (isAce ? '#f59e0b' : 'rgba(255,255,255,0.25)') : `${accentColor}bb` }}>
        {!flipped ? `Card ${index + 1}` : isAce ? 'ACE!' : 'Not Ace'}
      </p>
    </motion.div>
  );
}

type Phase = 'betting' | 'picking' | 'result';

export default function CardFlip() {
  const { balance, balanceRef, setBalance } = useGameWallet('CardFlip');
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState<Phase>('betting');
  const [acePos, setAcePos] = useState(0);
  const [flipped, setFlipped] = useState([false, false, false]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [profit, setProfit] = useState(0);

  const deal = () => {
    if (bet > balance) return;
    setBalance(b => +(b - bet).toFixed(2));
    setAcePos(Math.floor(Math.random() * 3));
    setFlipped([false, false, false]);
    setChosen(null);
    setWon(false);
    setPhase('picking');
  };

  const pick = (idx: number) => {
    if (phase !== 'picking' || flipped[idx]) return;
    setChosen(idx);
    setFlipped(prev => { const n = [...prev]; n[idx] = true; return n; });
    setTimeout(() => {
      setFlipped([true, true, true]);
      const isWin = idx === acePos;
      setWon(isWin);
      if (isWin) {
        const pay = +(bet * 2.7).toFixed(2);
        setBalance(b => +(b + pay).toFixed(2));
        setProfit(+(pay - bet).toFixed(2));
      } else {
        setProfit(-bet);
      }
      setPhase('result');
    }, 600);
  };

  const reset = () => { setPhase('betting'); setFlipped([false, false, false]); };

  const accentColor = '#6366f1';

  return (
    <MainLayout>
      <div className="min-h-screen py-8 pb-16 relative" style={{
        background: 'radial-gradient(ellipse at 50% 15%, rgba(99,102,241,0.3) 0%, transparent 60%), var(--background)'
      }}>
        <div className="max-w-4xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 text-xs font-bold tracking-widest uppercase" style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', color: accentColor }}>
                <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>🃏</motion.span>
                CARD FLIP
                <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.8 }}>🃏</motion.span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1" style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4ade80 45%, #ec4899 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Card Flip</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>One of the 3 cards is the Ace — find it and win 2.7×</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">

            {/* Controls */}
            <div className="rounded-2xl border p-5 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>

              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Bet Amount</p>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {CHIPS.map(c => (
                    <button key={c} onClick={() => setBet(c)} disabled={phase !== 'betting'}
                      className="py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-40"
                      style={{
                        border: `1.5px solid ${bet === c ? accentColor : 'rgba(255,255,255,0.1)'}`,
                        background: bet === c ? `${accentColor}22` : 'transparent',
                        color: bet === c ? accentColor : 'var(--muted-foreground)'
                      }}>
                      ${c}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setBet(p => Math.max(1, Math.floor(p / 2)))} disabled={phase !== 'betting'}
                    className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-40"
                    style={{ border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }}>½</button>
                  <div className="flex-1 rounded-lg px-3 py-2 text-sm font-black text-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--foreground)' }}>
                    ${bet}
                  </div>
                  <button onClick={() => setBet(p => Math.min(balance, p * 2))} disabled={phase !== 'betting'}
                    className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-40"
                    style={{ border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }}>2×</button>
                </div>
              </div>

              {/* Payout info */}
              <div className="rounded-xl p-3" style={{ background: `${accentColor}0d`, border: `1.5px solid ${accentColor}22` }}>
                <p className="text-xs font-black mb-2" style={{ color: accentColor }}>Payout</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: 'var(--muted-foreground)' }}>Find the Ace</span>
                    <span className="font-black" style={{ color: '#22c55e' }}>2.7× bet</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: 'var(--muted-foreground)' }}>Wrong card</span>
                    <span className="font-black" style={{ color: '#ef4444' }}>lose bet</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: 'var(--muted-foreground)' }}>Odds</span>
                    <span className="font-black" style={{ color: 'var(--foreground)' }}>1 in 3</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <AnimatePresence>
                {phase === 'result' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: won ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1.5px solid ${won ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                      boxShadow: won ? '0 0 20px rgba(34,197,94,0.25)' : '0 0 20px rgba(239,68,68,0.25)'
                    }}>
                    <p className="text-2xl font-black" style={{ color: won ? '#22c55e' : '#ef4444' }}>
                      {won ? `+$${profit.toFixed(2)}` : `-$${bet.toFixed(2)}`}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {won ? 'You found the Ace!' : 'Wrong card'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {phase === 'betting' && (
                <button onClick={deal} disabled={bet > balance}
                  className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, #4f46e5)`, color: '#fff', boxShadow: `0 0 22px ${accentColor}44` }}>
                  DEAL — ${bet}
                </button>
              )}
              {phase === 'result' && (
                <button onClick={reset}
                  className="w-full py-3 rounded-xl font-black text-sm transition-all"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, #4f46e5)`, color: '#fff', boxShadow: `0 0 22px ${accentColor}44` }}>
                  DEAL AGAIN
                </button>
              )}
            </div>

            {/* Card stage */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(170deg, #060412 0%, #030208 100%)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex flex-col items-center justify-center min-h-[480px] p-8 gap-8">

                {phase === 'betting' ? (
                  <div className="text-center space-y-5">
                    <motion.div animate={{ rotateY: [0, 360] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                      style={{ display: 'inline-block', fontSize: 72 }}>🃏</motion.div>
                    <div>
                      <p className="text-xl font-black mb-2" style={{ color: 'var(--foreground)' }}>Find the Ace</p>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>3 cards — one is the Ace of Spades. Pick correctly to win 2.7×.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <AnimatePresence>
                      {phase === 'picking' && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-sm font-black uppercase tracking-widest"
                          style={{ color: `${accentColor}aa` }}>
                          Pick a card
                        </motion.p>
                      )}
                      {phase === 'result' && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          className="rounded-xl px-8 py-3 text-xl font-black"
                          style={{
                            background: won ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                            border: `2px solid ${won ? 'rgba(245,158,11,0.5)' : 'rgba(100,116,139,0.3)'}`,
                            color: won ? '#f59e0b' : '#64748b',
                            boxShadow: won ? '0 0 32px rgba(245,158,11,0.3)' : 'none'
                          }}>
                          {won ? '🃏 ACE FOUND!' : '🂠 Not the Ace'}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-8 justify-center">
                      {[0, 1, 2].map(i => (
                        <PlayingCard
                          key={i}
                          index={i}
                          revealed={phase === 'result'}
                          isAce={i === acePos}
                          flipped={flipped[i]}
                          onClick={() => pick(i)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 lg:px-6 mt-6">
          <GameRules gameId="card-flip" />
        </div>
      </div>
    </MainLayout>
  );
}
