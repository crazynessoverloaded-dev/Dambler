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

function handTotal(cards: Card[]): number {
  let total = 0, aces = 0;
  for (const c of cards) {
    if (c.rank === 'A') { total += 11; aces++; }
    else if (['J', 'Q', 'K'].includes(c.rank)) total += 10;
    else total += parseInt(c.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}
function isPontoon(cards: Card[]): boolean {
  return cards.length === 2 && cards.some(c => c.rank === 'A') && cards.some(c => ['10', 'J', 'Q', 'K'].includes(c.rank));
}

function CardFace({ card, hidden, size = 'md' }: { card?: Card; hidden?: boolean; size?: 'sm' | 'md' }) {
  if (hidden || !card) {
    return (
      <div style={{ width: size === 'sm' ? 52 : 62, height: size === 'sm' ? 74 : 88, borderRadius: 8, background: 'linear-gradient(135deg, #1e1b4b, #312e81)', border: '2px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>
        <span style={{ color: 'rgba(99,102,241,0.5)', fontSize: 20 }}>♦</span>
      </div>
    );
  }
  const red = isRed(card);
  const color = red ? '#ef4444' : '#0f172a';
  const w = size === 'sm' ? 52 : 62;
  const h = size === 'sm' ? 74 : 88;
  const rankSz = size === 'sm' ? 10 : 12;
  const suitSz = size === 'sm' ? 18 : 22;
  return (
    <div style={{ width: w, height: h, borderRadius: 8, background: '#fff', border: '2px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 5, userSelect: 'none', boxShadow: '0 3px 12px rgba(0,0,0,0.55)' }}>
      <span style={{ fontSize: rankSz, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-start', color }}>{card.rank}</span>
      <span style={{ fontSize: suitSz, lineHeight: 1, color }}>{card.suit}</span>
      <span style={{ fontSize: rankSz, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)', color }}>{card.rank}</span>
    </div>
  );
}

type Phase = 'betting' | 'playing' | 'dealer' | 'result';

export default function Pontoon() {
  const { balance, balanceRef, setBalance } = useGameWallet('Pontoon');
  const [bet, setBet] = useState(10);
  const [bought, setBought] = useState(0);
  const [deck, setDeck] = useState<Card[]>([]);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [phase, setPhase] = useState<Phase>('betting');
  const [message, setMessage] = useState('');
  const [profit, setProfit] = useState(0);

  const deal = () => {
    if (bet > balance) return;
    const d = shuffle(makeDeck());
    const p = [d[0], d[2]];
    const deal_ = [d[1], d[3]];
    setDeck(d.slice(4));
    setPlayer(p);
    setDealer(deal_);
    setBought(0);
    setBalance(prev => +(prev - bet).toFixed(2));
    setPhase('playing');
    setMessage('');
  };

  const twist = () => {
    if (phase !== 'playing') return;
    const card = deck[0];
    const newPlayer = [...player, card];
    setPlayer(newPlayer);
    setDeck(deck.slice(1));
    const total = handTotal(newPlayer);
    if (total > 21) { setMessage('Bust! You lose.'); setProfit(-(bet + bought)); setPhase('result'); }
  };

  const buy = () => {
    if (phase !== 'playing' || player.length >= 4 || bought >= bet * 3) return;
    const extra = bet;
    if (extra > balance) return;
    setBalance(prev => +(prev - extra).toFixed(2));
    setBought(prev => prev + extra);
    const card = deck[0];
    const newPlayer = [...player, card];
    setPlayer(newPlayer);
    setDeck(deck.slice(1));
    const total = handTotal(newPlayer);
    if (total > 21) { setMessage('Bust! You lose.'); setProfit(-(bet + bought + extra)); setPhase('result'); }
  };

  const stick = () => {
    if (phase !== 'playing') return;
    const total = handTotal(player);
    if (total < 15 && player.length < 5) { setMessage('Must have at least 15 to stick (or 5 cards).'); return; }
    setPhase('dealer');
    let dCards = [...dealer];
    let dDeck = [...deck];
    while (handTotal(dCards) < 17 && dCards.length < 5) { dCards = [...dCards, dDeck[0]]; dDeck = dDeck.slice(1); }
    setDealer(dCards);
    setDeck(dDeck);

    const pTotal = handTotal(player);
    const dTotal = handTotal(dCards);
    const pPontoon = isPontoon(player);
    const dPontoon = isPontoon(dCards);
    const p5ct = !pPontoon && player.length === 5 && pTotal <= 21;
    const d5ct = !dPontoon && dCards.length === 5 && dTotal <= 21;
    const totalBet = bet + bought;

    let outcome = '';
    let pay = 0;
    if (dPontoon && !pPontoon) { outcome = 'Dealer Pontoon! You lose.'; pay = -totalBet; }
    else if (pPontoon) { outcome = 'Pontoon! You win 2:1!'; pay = totalBet * 2; }
    else if (p5ct && !d5ct) { outcome = '5-Card Trick! You win 2:1!'; pay = totalBet * 2; }
    else if (dTotal > 21) { outcome = 'Dealer busts! You win!'; pay = totalBet; }
    else if (pTotal > dTotal) { outcome = 'You win!'; pay = totalBet; }
    else if (pTotal === dTotal) { outcome = 'Push — bet returned.'; pay = 0; setBalance(prev => +(prev + totalBet).toFixed(2)); }
    else { outcome = 'Dealer wins.'; pay = -totalBet; }

    if (pay > 0) setBalance(prev => +(prev + totalBet + pay).toFixed(2));
    setProfit(pay);
    setMessage(outcome);
    setPhase('result');
  };

  const reset = () => { setPhase('betting'); setPlayer([]); setDealer([]); setMessage(''); setBought(0); };

  const pTotal = handTotal(player);
  const canStick = pTotal >= 15 || player.length >= 5;
  const accentColor = '#3b82f6';
  const showDealer = phase === 'result' || phase === 'dealer';

  return (
    <MainLayout>
      <div className="min-h-screen py-8 pb-16 relative" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(29,78,216,0.25) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(245,158,11,0.08) 0%, transparent 40%), var(--background)'
      }}>
        <div className="max-w-5xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 text-xs font-bold tracking-widest uppercase" style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', color: accentColor }}>
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }}>♚</motion.span>
                PONTOON · BRITISH BLACKJACK
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }}>♚</motion.span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1" style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #93c5fd 45%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Pontoon</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>British Blackjack — dealer all face down. Pontoon & 5-Card Trick pay 2:1.</p>
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
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Bet Amount</p>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {CHIPS.map(c => (
                        <button key={c} onClick={() => setBet(c)}
                          className="py-1.5 rounded-lg text-xs font-black transition-all"
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
                      <button onClick={() => setBet(p => Math.max(1, Math.floor(p / 2)))}
                        className="px-3 py-2 rounded-lg text-xs font-bold"
                        style={{ border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }}>½</button>
                      <div className="flex-1 rounded-lg px-3 py-2 text-sm font-black text-center"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--foreground)' }}>
                        ${bet}
                      </div>
                      <button onClick={() => setBet(p => Math.min(balance, p * 2))}
                        className="px-3 py-2 rounded-lg text-xs font-bold"
                        style={{ border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }}>2×</button>
                    </div>
                  </div>
                  <button onClick={deal} disabled={bet > balance}
                    className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, #1d4ed8)`, color: '#fff', boxShadow: `0 0 20px ${accentColor}44` }}>
                    Deal
                  </button>
                </>
              )}

              {phase === 'playing' && (
                <div className="space-y-3">
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Your total</p>
                    <p className="text-3xl font-black" style={{ color: pTotal > 21 ? '#ef4444' : pTotal >= 18 ? '#22c55e' : 'var(--foreground)' }}>{pTotal}</p>
                    {bought > 0 && <p className="text-xs mt-1" style={{ color: accentColor }}>Extra bet: ${bought}</p>}
                  </div>
                  <button onClick={twist}
                    className="w-full py-3 rounded-xl font-black text-sm transition-all"
                    style={{ background: 'rgba(59,130,246,0.15)', border: `2px solid ${accentColor}`, color: accentColor }}>
                    Twist (Hit)
                  </button>
                  <button onClick={stick} disabled={!canStick}
                    className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #ca8a04, #b45309)', color: '#000', boxShadow: '0 0 18px rgba(202,138,4,0.4)' }}>
                    Stick (Stand)
                  </button>
                  <button onClick={buy} disabled={player.length >= 4 || bought >= bet * 3 || bet > balance}
                    className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40"
                    style={{ background: 'rgba(255,255,255,0.0)', border: '2px solid rgba(22,163,74,0.5)', color: '#4ade80' }}>
                    Buy (+${bet})
                  </button>
                  {message && <p className="text-xs text-center" style={{ color: '#fbbf24' }}>{message}</p>}
                </div>
              )}

              {phase === 'result' && (
                <div className="space-y-3">
                  <div className="rounded-xl p-3 text-center"
                    style={{
                      background: profit > 0 ? 'rgba(34,197,94,0.1)' : profit < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${profit > 0 ? 'rgba(34,197,94,0.4)' : profit < 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`
                    }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>{message}</p>
                    <p className="text-2xl font-black" style={{ color: profit > 0 ? '#22c55e' : profit < 0 ? '#ef4444' : 'var(--foreground)' }}>
                      {profit > 0 ? `+$${profit}` : profit < 0 ? `-$${Math.abs(profit)}` : 'Push'}
                    </p>
                  </div>
                  <button onClick={reset}
                    className="w-full py-3 rounded-xl font-black text-sm transition-all"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, #1d4ed8)`, color: '#fff', boxShadow: `0 0 20px ${accentColor}44` }}>
                    New Hand
                  </button>
                </div>
              )}

              {/* Rules */}
              <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-black mb-2" style={{ color: 'var(--foreground)' }}>Rules</p>
                {['Pontoon (A + face) = 2:1', '5-Card Trick ≤21 = 2:1', 'Must have 15+ to stick', 'Dealer cards all face-down'].map(t => (
                  <p key={t} className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>• {t}</p>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(170deg, #071510 0%, #040e0a 100%)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="p-6 space-y-6">

                {/* Dealer zone */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Dealer</p>
                    {showDealer && dealer.length > 0 && (
                      <span className="text-xs font-black px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: accentColor }}>
                        {handTotal(dealer)}
                        {isPontoon(dealer) ? ' · PONTOON!' : dealer.length === 5 && handTotal(dealer) <= 21 ? ' · 5-CARD!' : ''}
                      </span>
                    )}
                    {!showDealer && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>All cards face down</span>}
                  </div>
                  <div className="flex flex-wrap gap-2" style={{ perspective: '900px' }}>
                    {(phase === 'betting' ? [null, null] : dealer).map((card, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: -10, rotateY: 90 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 20, delay: i * 0.15 }}>
                        <CardFace card={card ?? undefined} hidden={phase === 'playing' || phase === 'betting'} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)' }} />

                {/* Player zone */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(59,130,246,0.05)', border: '1.5px solid rgba(59,130,246,0.1)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>You</p>
                    {phase !== 'betting' && player.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full"
                          style={{
                            background: pTotal > 21 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                            border: `1px solid ${pTotal > 21 ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
                            color: pTotal > 21 ? '#ef4444' : '#22c55e'
                          }}>
                          {pTotal}
                        </span>
                        {isPontoon(player) && (
                          <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.5)', color: '#f59e0b' }}>PONTOON!</span>
                        )}
                        {!isPontoon(player) && player.length === 5 && pTotal <= 21 && (
                          <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.5)', color: '#4ade80' }}>5-CARD!</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2" style={{ perspective: '900px' }}>
                    {(phase === 'betting' ? [null, null] : player).map((card, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10, rotateY: 90 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 20, delay: i * 0.15 }}>
                        <CardFace card={card ?? undefined} />
                      </motion.div>
                    ))}
                  </div>
                </div>

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
                      <p className="text-3xl font-black" style={{ color: profit > 0 ? '#22c55e' : profit < 0 ? '#ef4444' : 'var(--foreground)' }}>
                        {profit > 0 ? `+$${profit}` : profit < 0 ? `-$${Math.abs(profit)}` : 'Push'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {phase === 'betting' && (
                  <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Set your bet and deal to begin</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 lg:px-6 mt-6">
          <GameRules gameId="pontoon" />
        </div>
      </div>
    </MainLayout>
  );
}

