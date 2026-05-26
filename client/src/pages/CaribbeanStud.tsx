import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

const CHIPS = [1, 5, 10, 25, 50, 100];
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
type Card = { rank: string; suit: string };
const isRed = (c: Card) => c.suit === '♥' || c.suit === '♦';
const makeDeck = (): Card[] => SUITS.flatMap(s => RANKS.map(r => ({ suit: s, rank: r })));
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

function cv(r: string): number { return ({ A: 14, K: 13, Q: 12, J: 11 } as Record<string, number>)[r] ?? parseInt(r); }

function rateHand(cards: Card[]): number {
  const v = cards.map(c => cv(c.rank)).sort((a, b) => b - a);
  const s = cards.map(c => c.suit);
  const flush = new Set(s).size === 1;
  const cnt: Record<number, number> = {};
  v.forEach(n => (cnt[n] = (cnt[n] || 0) + 1));
  const c = Object.values(cnt).sort((a, b) => b - a);
  const u = [...new Set(v)].sort((a, b) => b - a);
  const str = u.length === 5 && u[0] - u[4] === 4;
  const lowStr = u.toString() === '14,5,4,3,2';
  if (flush && (str || lowStr)) return 8;
  if (c[0] === 4) return 7;
  if (c[0] === 3 && c[1] === 2) return 6;
  if (flush) return 5;
  if (str || lowStr) return 4;
  if (c[0] === 3) return 3;
  if (c[0] === 2 && c[1] === 2) return 2;
  if (c[0] === 2) return 1;
  return 0;
}

const HAND_NAMES = ['High Card', 'One Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush'];
const CALL_PAYS = [1, 1, 2, 3, 4, 5, 7, 20, 50];

function dealerQualifies(cards: Card[]): boolean {
  const rank = rateHand(cards);
  if (rank > 0) return true;
  const vals = cards.map(c => cv(c.rank)).sort((a, b) => b - a);
  return vals[0] === 14 && vals[1] === 13;
}

function CardFace({ card, hidden, size = 'md' }: { card: Card; hidden?: boolean; size?: 'sm' | 'md' }) {
  if (hidden) {
    return (
      <div style={{ width: size === 'sm' ? 48 : 62, height: size === 'sm' ? 68 : 88, borderRadius: 8, background: 'linear-gradient(135deg, #0f2920, #0a1f18)', border: '2px solid rgba(20,184,166,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>
        <span style={{ color: 'rgba(20,184,166,0.4)', fontSize: 18 }}>♦</span>
      </div>
    );
  }
  const red = isRed(card);
  const color = red ? '#ef4444' : '#0f172a';
  const w = size === 'sm' ? 48 : 62;
  const h = size === 'sm' ? 68 : 88;
  return (
    <div style={{ width: w, height: h, borderRadius: 8, background: '#fff', border: '2px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 5, userSelect: 'none', boxShadow: '0 3px 12px rgba(0,0,0,0.55)' }}>
      <span style={{ fontSize: size === 'sm' ? 10 : 12, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-start', color }}>{card.rank}</span>
      <span style={{ fontSize: size === 'sm' ? 16 : 20, lineHeight: 1, color }}>{card.suit}</span>
      <span style={{ fontSize: size === 'sm' ? 10 : 12, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)', color }}>{card.rank}</span>
    </div>
  );
}

type Phase = 'betting' | 'decision' | 'result';

export default function CaribbeanStud() {
  const { balance, balanceRef, setBalance } = useGameWallet('CaribbeanStud');
  const [ante, setAnte] = useState(10);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [phase, setPhase] = useState<Phase>('betting');
  const [message, setMessage] = useState('');
  const [profit, setProfit] = useState(0);

  const deal = () => {
    if (ante > balance) return;
    const d = shuffle(makeDeck());
    setPlayer(d.slice(0, 5));
    setDealer(d.slice(5, 10));
    setBalance(prev => +(prev - ante).toFixed(2));
    setPhase('decision');
    setMessage('');
  };

  const fold = () => { setMessage('You folded. Ante lost.'); setProfit(-ante); setPhase('result'); };

  const call = () => {
    if (ante * 2 > balance) return;
    setBalance(prev => +(prev - ante * 2).toFixed(2));
    const dQual = dealerQualifies(dealer);
    const pRank = rateHand(player);
    const dRank = rateHand(dealer);
    let pay = 0;
    let msg = '';

    if (!dQual) {
      pay = ante;
      setBalance(prev => +(prev + ante * 3).toFixed(2));
      msg = `Dealer doesn't qualify (${HAND_NAMES[dRank]}). Ante wins, call pushes.`;
    } else if (pRank > dRank || (pRank === dRank && Math.max(...player.map(c => cv(c.rank))) > Math.max(...dealer.map(c => cv(c.rank))))) {
      const callPay = ante * 2 * CALL_PAYS[pRank];
      pay = ante + callPay;
      setBalance(prev => +(prev + ante * 3 + ante * 2 * CALL_PAYS[pRank]).toFixed(2));
      msg = `You win! ${HAND_NAMES[pRank]}. Ante 1:1, call ${CALL_PAYS[pRank]}:1`;
    } else {
      pay = -(ante * 3);
      msg = `Dealer wins with ${HAND_NAMES[dRank]}.`;
    }
    setProfit(pay);
    setMessage(msg);
    setPhase('result');
  };

  const reset = () => { setPhase('betting'); setPlayer([]); setDealer([]); setMessage(''); };

  const accentColor = '#14b8a6';
  const showDealer = phase === 'result';

  return (
    <MainLayout>
      <div className="min-h-screen py-8 pb-16 relative" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(13,148,136,0.28) 0%, transparent 58%), radial-gradient(ellipse at 90% 80%, rgba(249,115,22,0.08) 0%, transparent 40%), var(--background)'
      }}>
        <div className="max-w-5xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 text-xs font-bold tracking-widest uppercase" style={{ borderColor: 'rgba(20,184,166,0.3)', background: 'rgba(20,184,166,0.08)', color: accentColor }}>
                <motion.span animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}>♦</motion.span>
                CARIBBEAN STUD POKER
                <motion.span animate={{ rotate: [0, -360] }} transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}>♦</motion.span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1" style={{
                background: 'linear-gradient(135deg, #14b8a6 0%, #67e8f9 40%, #f97316 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Caribbean Stud</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>5-card stud vs the dealer. Fold or call (2× ante). Dealer needs A-K to qualify.</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">

            {/* Controls */}
            <div className="rounded-2xl border p-5 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>

              {phase === 'betting' && (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Ante Bet</p>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {CHIPS.map(c => (
                        <button key={c} onClick={() => setAnte(c)}
                          className="py-1.5 rounded-lg text-xs font-black transition-all"
                          style={{
                            border: `1.5px solid ${ante === c ? accentColor : 'rgba(255,255,255,0.1)'}`,
                            background: ante === c ? `${accentColor}22` : 'transparent',
                            color: ante === c ? accentColor : 'var(--muted-foreground)'
                          }}>
                          ${c}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setAnte(p => Math.max(1, Math.floor(p / 2)))}
                        className="px-3 py-2 rounded-lg text-xs font-bold"
                        style={{ border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }}>½</button>
                      <div className="flex-1 rounded-lg px-3 py-2 text-sm font-black text-center"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--foreground)' }}>
                        ${ante}
                      </div>
                      <button onClick={() => setAnte(p => Math.min(balance, p * 2))}
                        className="px-3 py-2 rounded-lg text-xs font-bold"
                        style={{ border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }}>2×</button>
                    </div>
                  </div>
                  <button onClick={deal} disabled={ante > balance}
                    className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, #0d9488)`, color: '#000', boxShadow: `0 0 20px ${accentColor}44` }}>
                    Deal
                  </button>
                </>
              )}

              {phase === 'decision' && (
                <div className="space-y-3">
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Your hand</p>
                    <p className="text-base font-black" style={{ color: accentColor }}>{HAND_NAMES[rateHand(player)]}</p>
                  </div>
                  <button onClick={call} disabled={ante * 2 > balance}
                    className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, #0d9488)`, color: '#000', boxShadow: `0 0 20px ${accentColor}44` }}>
                    Call (${ante * 2})
                  </button>
                  <button onClick={fold}
                    className="w-full py-3 rounded-xl font-black text-sm transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.4)', color: '#ef4444' }}>
                    Fold (lose ${ante})
                  </button>
                </div>
              )}

              {phase === 'result' && (
                <div className="space-y-3">
                  <div className="rounded-xl p-3 text-center"
                    style={{
                      background: profit > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1.5px solid ${profit > 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`
                    }}>
                    <p className="text-xs mb-1 leading-snug" style={{ color: 'var(--muted-foreground)' }}>{message}</p>
                    <p className="text-2xl font-black" style={{ color: profit > 0 ? '#22c55e' : '#ef4444' }}>
                      {profit > 0 ? `+$${profit}` : `-$${Math.abs(profit)}`}
                    </p>
                  </div>
                  <button onClick={reset}
                    className="w-full py-3 rounded-xl font-black text-sm transition-all"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, #0d9488)`, color: '#000', boxShadow: `0 0 20px ${accentColor}44` }}>
                    New Hand
                  </button>
                </div>
              )}

              {/* Call pays */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(20,184,166,0.06)', border: '1.5px solid rgba(20,184,166,0.12)' }}>
                <p className="text-xs font-black mb-2" style={{ color: accentColor }}>Call Bet Pays</p>
                <div className="space-y-1">
                  {[['Pair / High', '1:1'], ['Two Pair', '2:1'], ['Trips', '3:1'], ['Straight', '4:1'], ['Flush', '5:1'], ['Full House', '7:1'], ['Quads', '20:1'], ['Str. Flush', '50:1']].map(([hand, pay]) => (
                    <div key={hand} className="flex justify-between text-[11px]">
                      <span style={{ color: 'var(--muted-foreground)' }}>{hand}</span>
                      <span className="font-black" style={{ color: 'var(--foreground)' }}>{pay}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(170deg, #040f0c 0%, #020a07 100%)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="p-6 space-y-6">

                {/* Dealer zone */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.35)', border: '1.5px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Dealer</p>
                    {showDealer && dealer.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full"
                          style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}44`, color: accentColor }}>
                          {HAND_NAMES[rateHand(dealer)]}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: dealerQualifies(dealer) ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${dealerQualifies(dealer) ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, color: dealerQualifies(dealer) ? '#22c55e' : '#ef4444' }}>
                          {dealerQualifies(dealer) ? 'Qualifies' : 'No Qualify'}
                        </span>
                      </div>
                    )}
                    {!showDealer && phase !== 'betting' && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>1 card shown · 4 hidden</span>}
                  </div>
                  <div className="flex flex-wrap gap-2" style={{ perspective: '900px' }}>
                    {(phase === 'betting' ? Array(5).fill(null) : dealer).map((card, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: -10, rotateY: 90 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 20, delay: i * 0.12 }}>
                        <CardFace card={card ?? { rank: '?', suit: '♦' }} hidden={phase !== 'result' && i !== 0} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}33, transparent)` }} />

                {/* Player zone */}
                <div className="rounded-xl p-4" style={{ background: `rgba(20,184,166,0.05)`, border: `1.5px solid ${accentColor}18` }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>You</p>
                    {phase !== 'betting' && player.length > 0 && (
                      <span className="text-xs font-black px-2.5 py-1 rounded-full"
                        style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}44`, color: accentColor }}>
                        {HAND_NAMES[rateHand(player)]}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2" style={{ perspective: '900px' }}>
                    {(phase === 'betting' ? Array(5).fill(null) : player).map((card, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10, rotateY: 90 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 20, delay: i * 0.15 }}>
                        <CardFace card={card ?? { rank: '?', suit: '♦' }} hidden={!card} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Bet strip */}
                {phase !== 'betting' && (
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-center flex-1">
                      <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Ante</p>
                      <p className="text-sm font-black" style={{ color: accentColor }}>${ante}</p>
                    </div>
                    {phase === 'result' && (
                      <>
                        <div className="text-center flex-1">
                          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Call</p>
                          <p className="text-sm font-black" style={{ color: 'var(--foreground)' }}>${ante * 2}</p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Total</p>
                          <p className="text-sm font-black" style={{ color: 'var(--foreground)' }}>${ante * 3}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Result banner */}
                <AnimatePresence>
                  {phase === 'result' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="rounded-xl p-4 text-center"
                      style={{
                        background: profit > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1.5px solid ${profit > 0 ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
                        boxShadow: profit > 0 ? '0 0 24px rgba(34,197,94,0.2)' : '0 0 24px rgba(239,68,68,0.2)'
                      }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>{message}</p>
                      <p className="text-3xl font-black" style={{ color: profit > 0 ? '#22c55e' : '#ef4444' }}>
                        {profit > 0 ? `+$${profit}` : `-$${Math.abs(profit)}`}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {phase === 'betting' && (
                  <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Place your ante and deal to begin</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 lg:px-6 mt-6">
          <GameRules gameId="caribbean-stud" />
        </div>
      </div>
    </MainLayout>
  );
}
