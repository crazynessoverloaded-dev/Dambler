import { useState } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

// ── Types & logic ──────────────────────────────────────────────────────────────
const CHIPS = [1, 5, 10, 25, 50, 100];
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
type Card = { rank: string; suit: string };
const isRed = (c: Card) => c.suit === '♥' || c.suit === '♦';
const makeDeck = (): Card[] => SUITS.flatMap(s => RANKS.map(r => ({ suit: s, rank: r })));
const shuffle = <T,>(a: T[]): T[] => {
  const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b;
};

function cv(r: string): number { return ({ A: 14, K: 13, Q: 12, J: 11 } as any)[r] ?? parseInt(r); }
function rateHand(cards: Card[]): number {
  const v = cards.map(c => cv(c.rank)).sort((a, b) => b - a);
  const fl = new Set(cards.map(c => c.suit)).size === 1;
  const cnt: Record<number, number> = {};
  v.forEach(n => (cnt[n] = (cnt[n] || 0) + 1));
  const c = Object.values(cnt).sort((a, b) => b - a);
  const u = [...new Set(v)].sort((a, b) => b - a);
  const str = u.length === 5 && u[0] - u[4] === 4;
  const lowStr = u.toString() === '14,5,4,3,2';
  if (fl && (str || lowStr)) return 8; if (c[0] === 4) return 7; if (c[0] === 3 && c[1] === 2) return 6;
  if (fl) return 5; if (str || lowStr) return 4; if (c[0] === 3) return 3;
  if (c[0] === 2 && c[1] === 2) return 2; if (c[0] === 2) return 1; return 0;
}
const HAND_NAMES = ['High Card', 'Pair', 'Two Pair', 'Trips', 'Straight', 'Flush', 'Full House', 'Quads', 'Str. Flush'];
function bestFrom7(cards: Card[]): { rank: number; name: string } {
  let best = -1;
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 4; b++) for (let c2 = b + 1; c2 < 5; c2++)
    for (let d = c2 + 1; d < 6; d++) for (let e = d + 1; e < 7; e++) {
      const r = rateHand([cards[a], cards[b], cards[c2], cards[d], cards[e]]);
      if (r > best) best = r;
    }
  return { rank: best, name: HAND_NAMES[best] };
}
const CALL_PAYS = [1, 1, 2, 3, 4, 5, 7, 20, 50];
const CALL_PAY_LABELS = ['Pair: 1:1', 'Two Pair: 2:1', 'Trips: 3:1', 'Straight: 4:1', 'Flush: 5:1', 'Full House: 7:1', 'Quads: 20:1', 'Str.Flush: 50:1'];

type Phase = 'betting' | 'preflop' | 'result';

// ── Card component ─────────────────────────────────────────────────────────────
function CardFace({ card, hidden, delay = 0 }: { card?: Card; hidden?: boolean; delay?: number }) {
  if (hidden || !card) return (
    <div className="rounded-xl flex items-center justify-center shadow-lg select-none"
      style={{ width: 68, height: 96, background: 'linear-gradient(145deg, #0a1e12 0%, #061409 100%)', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 14px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
      <div style={{ width: 44, height: 60, borderRadius: 5, background: 'repeating-linear-gradient(45deg, rgba(21,128,61,0.1) 0px, rgba(21,128,61,0.1) 2px, transparent 2px, transparent 7px)', border: '1px solid rgba(21,128,61,0.15)' }} />
    </div>
  );
  const red = isRed(card);
  const clr = red ? '#dc2626' : '#111827';
  return (
    <motion.div initial={{ rotateY: 90, scale: 0.85 }} animate={{ rotateY: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 22, delay }}
      className="rounded-xl bg-white select-none"
      style={{ width: 68, height: 96, border: `2px solid ${red ? '#fca5a5' : '#e5e7eb'}`, boxShadow: '0 5px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '6px 7px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, rgba(255,255,255,0.55) 0%, transparent 55%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: clr }}>{card.rank}</span>
        <span style={{ fontSize: 11, color: clr }}>{card.suit}</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: 28, lineHeight: 1, color: clr }}>{card.suit}</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.1, transform: 'rotate(180deg)' }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: clr }}>{card.rank}</span>
        <span style={{ fontSize: 11, color: clr }}>{card.suit}</span>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CasinoHoldem() {
  const { balance, setBalance } = useGameWallet('CasinoHoldem');
  const [ante, setAnte] = useState(10);
  const [deck, setDeck] = useState<Card[]>([]);
  const [pHole, setPHole] = useState<Card[]>([]);
  const [dHole, setDHole] = useState<Card[]>([]);
  const [community, setCommunity] = useState<Card[]>([]);
  const [phase, setPhase] = useState<Phase>('betting');
  const [message, setMessage] = useState('');
  const [profit, setProfit] = useState(0);

  const deal = () => {
    if (ante > balance) return;
    const d = shuffle(makeDeck());
    setPHole([d[0], d[1]]); setDHole([d[2], d[3]]); setCommunity([d[4], d[5], d[6]]);
    setDeck(d.slice(7)); setBalance(prev => +(prev - ante).toFixed(2));
    setPhase('preflop'); setMessage('');
  };

  const fold = () => { setMessage('You folded. Ante lost.'); setProfit(-ante); setPhase('result'); };

  const call = () => {
    if (ante * 2 > balance) return;
    setBalance(prev => +(prev - ante * 2).toFixed(2));
    const turnRiver = [deck[0], deck[1]];
    const fullCom = [...community, ...turnRiver];
    setCommunity(fullCom); setDeck(d => d.slice(2));
    const pBest = bestFrom7([...pHole, ...fullCom]);
    const dBest = bestFrom7([...dHole, ...fullCom]);
    const dQual = dBest.rank >= 1;
    let pay = 0, msg = '';
    if (!dQual) {
      pay = ante; setBalance(prev => +(prev + ante * 2 + ante).toFixed(2));
      msg = `Dealer doesn't qualify. Ante pays 1:1.`;
    } else if (pBest.rank > dBest.rank) {
      pay = ante + ante * 2 * CALL_PAYS[pBest.rank];
      setBalance(prev => +(prev + ante * 3 + ante * 2 * CALL_PAYS[pBest.rank]).toFixed(2));
      msg = `You win! ${pBest.name} beats ${dBest.name}.`;
    } else if (pBest.rank === dBest.rank) {
      pay = 0; setBalance(prev => +(prev + ante * 3).toFixed(2)); msg = `Tie! All bets returned.`;
    } else {
      pay = -(ante * 3); msg = `Dealer wins — ${dBest.name} beats ${pBest.name}.`;
    }
    setProfit(pay); setMessage(msg); setPhase('result');
  };

  const reset = () => { setPhase('betting'); setPHole([]); setDHole([]); setCommunity([]); setMessage(''); };
  const pBest = pHole.length && community.length >= 5 ? bestFrom7([...pHole, ...community]) : null;

  const resultPositive = profit > 0;
  const resultNeutral = profit === 0;

  return (
    <MainLayout>
      <section className="py-6 pb-16 min-h-screen relative"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(21,128,61,0.28) 0%, transparent 60%)' }}>
        <div className="max-w-5xl mx-auto px-4 lg:px-6">

          {/* Title */}
          <div className="mb-7 flex items-end justify-between">
            <div>
              <div className="inline-block px-4 py-1 rounded-full text-[10px] font-bold tracking-widest mb-3"
                style={{ background: 'rgba(21,128,61,0.12)', border: '1px solid rgba(21,128,61,0.28)', color: '#86efac' }}>
                ♠ CASINO HOLD'EM ♠
              </div>
              <h1 className="text-5xl font-black tracking-tight"
                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #86efac 40%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                CASINO HOLD'EM
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Texas Hold'em against the house · Dealer qualifies with pair of 4s or better</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-5">

            {/* ── Left: Controls ── */}
            <div className="space-y-3">

              {phase === 'betting' && (
                <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Ante Bet</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CHIPS.map(c => (
                      <button key={c} onClick={() => setAnte(c)}
                        className="py-2 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: ante === c ? 'rgba(21,128,61,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${ante === c ? 'rgba(21,128,61,0.5)' : 'rgba(255,255,255,0.07)'}`,
                          color: ante === c ? '#86efac' : 'rgba(255,255,255,0.5)',
                        }}>
                        ${c}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => setAnte(p => Math.max(1, Math.floor(p / 2)))}
                      className="w-10 h-9 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>½</button>
                    <div className="flex-1 text-center py-2 rounded-lg text-sm font-black"
                      style={{ background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.2)', color: '#86efac' }}>
                      ${ante}
                    </div>
                    <button onClick={() => setAnte(p => Math.min(balance, p * 2))}
                      className="w-10 h-9 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>2×</button>
                  </div>
                  <button onClick={deal} disabled={ante > balance}
                    className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', boxShadow: '0 0 24px rgba(21,128,61,0.35)' }}>
                    DEAL
                  </button>
                </div>
              )}

              {phase === 'preflop' && (
                <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {pBest && (
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(21,128,61,0.1)', border: '1px solid rgba(21,128,61,0.2)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Your best hand</p>
                      <p className="text-sm font-black text-accent">{pBest.name}</p>
                    </div>
                  )}
                  <button onClick={call} disabled={ante * 2 > balance}
                    className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', boxShadow: '0 0 20px rgba(21,128,61,0.3)' }}>
                    CALL (${ante * 2})
                  </button>
                  <button onClick={fold}
                    className="w-full py-3 rounded-2xl font-black text-sm transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.35)', color: '#f87171' }}>
                    FOLD (lose ${ante})
                  </button>
                </div>
              )}

              {phase === 'result' && (
                <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-center p-4 rounded-xl"
                    style={{
                      background: resultPositive ? 'rgba(34,197,94,0.08)' : resultNeutral ? 'rgba(255,255,255,0.04)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${resultPositive ? 'rgba(34,197,94,0.3)' : resultNeutral ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.25)'}`,
                    }}>
                    <p className="text-xs mb-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{message}</p>
                    <p className={`text-3xl font-black ${resultPositive ? 'text-green-400' : resultNeutral ? 'text-white' : 'text-red-400'}`}>
                      {resultPositive ? `+$${profit}` : profit < 0 ? `-$${Math.abs(profit)}` : 'Push'}
                    </p>
                  </div>
                  <button onClick={reset}
                    className="w-full py-4 rounded-2xl font-black text-base transition-all"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff' }}>
                    NEW HAND
                  </button>
                </div>
              )}

              {/* Pay table */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Call Pays</p>
                <div className="space-y-1">
                  {CALL_PAY_LABELS.map(t => (
                    <div key={t} className="flex justify-between text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <span>{t.split(':')[0]}</span>
                      <span style={{ color: 'rgba(255,255,255,0.55)' }}>{t.split(':')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Poker table ── */}
            <div className="rounded-3xl overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.07)' }}>
              <div className="p-6 space-y-5 min-h-[520px]" style={{ background: 'linear-gradient(170deg, #0c2010 0%, #071509 100%)', perspective: '1200px' }}>

                {/* Dealer hole cards */}
                <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Dealer Hole Cards</p>
                  <div className="flex gap-2 flex-wrap">
                    {phase === 'betting' ? (
                      <><CardFace hidden /><CardFace hidden /></>
                    ) : (
                      dHole.map((c, i) => (
                        <CardFace key={i} card={c} hidden={phase !== 'result'} delay={i * 0.22} />
                      ))
                    )}
                  </div>
                </div>

                {/* Community cards */}
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Community Cards{community.length ? (phase === 'result' ? ' (all 5)' : ' (flop)') : ''}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {phase === 'betting' && [0,1,2,3,4].map(i => <CardFace key={i} hidden />)}
                    {(phase === 'preflop' || phase === 'result') && community.map((c, i) => (
                      <CardFace key={i} card={c} delay={i * 0.22} />
                    ))}
                    {phase === 'preflop' && <><CardFace hidden /><CardFace hidden /></>}
                  </div>
                </div>

                {/* Player hole cards */}
                <div className="rounded-2xl p-4" style={{ background: 'rgba(21,128,61,0.06)', border: '1px solid rgba(21,128,61,0.15)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(134,239,172,0.6)' }}>Your Hole Cards</p>
                  <div className="flex gap-2 flex-wrap items-center">
                    {phase === 'betting' ? (
                      <><CardFace hidden /><CardFace hidden /></>
                    ) : (
                      pHole.map((c, i) => (
                        <CardFace key={i} card={c} delay={i * 0.22} />
                      ))
                    )}
                    {phase === 'result' && pBest && (
                      <div className="ml-4 px-3 py-1.5 rounded-lg text-xs font-black"
                        style={{ background: 'rgba(21,128,61,0.2)', border: '1px solid rgba(21,128,61,0.4)', color: '#86efac' }}>
                        {pBest.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bet info */}
                {phase !== 'betting' && (
                  <div className="flex gap-3">
                    <div className="flex-1 text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Ante</p>
                      <p className="text-lg font-black text-accent">${ante}</p>
                    </div>
                    {phase === 'result' && (
                      <div className="flex-1 text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Call</p>
                        <p className="text-lg font-black text-accent">${ante * 2}</p>
                      </div>
                    )}
                    <div className="flex-1 text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Total at risk</p>
                      <p className="text-lg font-black" style={{ color: '#fbbf24' }}>
                        ${phase === 'result' ? ante * 3 : ante}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <GameRules gameId="casino-holdem" />
      </section>
    </MainLayout>
  );
}
