import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

// ── Types & logic ──────────────────────────────────────────────────────────────
type Suit = '♠' | '♥' | '♦' | '♣';
interface Card { value: number; suit: Suit; label: string }
type BetType = 'player' | 'banker' | 'tie' | null;
type Phase = 'betting' | 'dealing' | 'result';

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function makeCard(value: number): Card { return { value, suit: SUITS[Math.floor(Math.random() * 4)], label: LABELS[value] }; }
function randomCard(): Card { return makeCard(Math.ceil(Math.random() * 13)); }
function cardPoint(c: Card): number { return c.value >= 10 ? 0 : c.value; }
function handTotal(cards: Card[]): number { return cards.reduce((s, c) => (s + cardPoint(c)) % 10, 0); }
function isRed(s: Suit) { return s === '♥' || s === '♦'; }

function shouldPlayerDraw(t: number) { return t <= 5; }
function shouldBankerDraw(bt: number, p3: Card | null): boolean {
  if (bt >= 7) return false; if (bt <= 2) return true;
  if (!p3) return bt <= 5;
  const pt = cardPoint(p3);
  if (bt === 3) return pt !== 8; if (bt === 4) return pt >= 2 && pt <= 7;
  if (bt === 5) return pt >= 4 && pt <= 7; if (bt === 6) return pt === 6 || pt === 7;
  return false;
}

interface HistoryEntry { winner: 'player' | 'banker' | 'tie'; playerTotal: number; bankerTotal: number; profit: number }

// ── Card component ─────────────────────────────────────────────────────────────
function CardFace({ card, hidden, delay = 0 }: { card: Card; hidden?: boolean; delay?: number }) {
  if (hidden) return (
    <div className="rounded-xl flex items-center justify-center shadow-lg select-none"
      style={{ width: 82, height: 116, background: 'linear-gradient(145deg, #3b0a0a 0%, #1a0505 100%)', border: '2px solid rgba(255,255,255,0.12)', boxShadow: '0 6px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      <div style={{ width: 52, height: 72, borderRadius: 6, background: 'repeating-linear-gradient(45deg, rgba(220,38,38,0.08) 0px, rgba(220,38,38,0.08) 2px, transparent 2px, transparent 8px)', border: '1px solid rgba(220,38,38,0.15)' }} />
    </div>
  );
  const red = isRed(card.suit);
  const clr = red ? '#dc2626' : '#111827';
  return (
    <motion.div initial={{ rotateY: 90, scale: 0.85 }} animate={{ rotateY: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 22, delay }}
      className="rounded-xl bg-white select-none"
      style={{ width: 82, height: 116, border: `2px solid ${red ? '#fca5a5' : '#e5e7eb'}`, boxShadow: '0 6px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '7px 8px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, rgba(255,255,255,0.6) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: clr }}>{card.label}</span>
        <span style={{ fontSize: 13, color: clr }}>{card.suit}</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: 36, lineHeight: 1, color: clr }}>{card.suit}</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.1, transform: 'rotate(180deg)' }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: clr }}>{card.label}</span>
        <span style={{ fontSize: 13, color: clr }}>{card.suit}</span>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Baccarat() {
  const { balance, balanceRef, setBalance } = useGameWallet('Baccarat');
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBet, setSelectedBet] = useState<BetType>(null);
  const [phase, setPhase] = useState<Phase>('betting');
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  const [winner, setWinner] = useState<'player' | 'banker' | 'tie' | null>(null);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const deal = useCallback(async () => {
    if (!selectedBet || balance < betAmount) return;
    setBalance(b => parseFloat((b - betAmount).toFixed(2)));
    setPhase('dealing'); setWinner(null); setLastProfit(null);
    const p1 = randomCard(), b1 = randomCard(), p2 = randomCard(), b2 = randomCard();
    let pHand = [p1, p2], bHand = [b1, b2];
    let pTotal = handTotal(pHand), bTotal = handTotal(bHand);
    let playerThird: Card | null = null;
    setPlayerCards([p1, p2]); setBankerCards([b1, b2]);
    await new Promise(r => setTimeout(r, 800));
    const isNatural = pTotal >= 8 || bTotal >= 8;
    if (!isNatural) {
      if (shouldPlayerDraw(pTotal)) {
        playerThird = randomCard(); pHand = [...pHand, playerThird]; pTotal = handTotal(pHand);
        setPlayerCards(pHand); await new Promise(r => setTimeout(r, 600));
      }
      if (shouldBankerDraw(bTotal, playerThird)) {
        const bt = randomCard(); bHand = [...bHand, bt]; bTotal = handTotal(bHand);
        setBankerCards(bHand); await new Promise(r => setTimeout(r, 600));
      }
    }
    const result: 'player' | 'banker' | 'tie' = pTotal > bTotal ? 'player' : bTotal > pTotal ? 'banker' : 'tie';
    setWinner(result);
    let profit = -betAmount;
    if (selectedBet === result) {
      const mult = result === 'tie' ? 8 : result === 'banker' ? 0.95 : 1;
      const win = parseFloat((betAmount * mult).toFixed(2));
      profit = win; setBalance(b => parseFloat((b + betAmount + win).toFixed(2)));
    }
    setLastProfit(profit);
    setHistory(h => [{ winner: result, playerTotal: pTotal, bankerTotal: bTotal, profit }, ...h.slice(0, 29)]);
    setPhase('result');
  }, [selectedBet, balance, betAmount]);

  const reset = () => { setPhase('betting'); setPlayerCards([]); setBankerCards([]); setWinner(null); setLastProfit(null); };

  const BET_OPTIONS = [
    { type: 'player' as BetType, label: 'PLAYER', odds: '1:1', active: '#3b82f6', glow: 'rgba(59,130,246,0.3)', border: 'rgba(59,130,246,0.5)', bg: 'rgba(59,130,246,0.1)' },
    { type: 'tie'    as BetType, label: 'TIE',    odds: '8:1', active: '#22c55e', glow: 'rgba(34,197,94,0.3)',  border: 'rgba(34,197,94,0.5)',  bg: 'rgba(34,197,94,0.1)'  },
    { type: 'banker' as BetType, label: 'BANKER',  odds: '0.95:1', active: '#ef4444', glow: 'rgba(239,68,68,0.3)', border: 'rgba(239,68,68,0.5)',  bg: 'rgba(239,68,68,0.1)'  },
  ];

  const HISTORY_COLORS = { player: '#3b82f6', banker: '#ef4444', tie: '#22c55e' };
  const HISTORY_LABELS = { player: 'P', banker: 'B', tie: 'T' };

  return (
    <MainLayout>
      <section className="py-6 pb-16 min-h-screen relative"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(127,29,29,0.35) 0%, transparent 60%)' }}>
        <div className="max-w-5xl mx-auto px-4 lg:px-6">

          {/* Title */}
          <div className="mb-7 flex items-end justify-between">
            <div>
              <div className="inline-block px-4 py-1 rounded-full text-[10px] font-bold tracking-widest mb-3"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)', color: '#fca5a5' }}>
                ♦ BACCARAT ♦
              </div>
              <h1 className="text-5xl font-black tracking-tight"
                style={{ background: 'linear-gradient(135deg, #dc2626 0%, #f87171 40%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                BACCARAT
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Player vs Banker — closest to 9 wins</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">

            {/* ── Left: Controls ── */}
            <div className="space-y-3">

              <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Bet Amount</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[5, 25, 100, 250, 500, 1000].map(a => (
                    <button key={a} onClick={() => setBetAmount(a)} disabled={phase === 'dealing'}
                      className="py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
                      style={{
                        background: betAmount === a ? 'rgba(220,38,38,0.18)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${betAmount === a ? 'rgba(220,38,38,0.45)' : 'rgba(255,255,255,0.07)'}`,
                        color: betAmount === a ? '#fca5a5' : 'rgba(255,255,255,0.5)',
                      }}>
                      ${a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => setBetAmount(b => Math.max(1, Math.floor(b / 2)))} disabled={phase === 'dealing'}
                    className="w-10 h-9 rounded-lg text-xs font-bold disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>½</button>
                  <div className="flex-1 text-center py-2 rounded-lg text-sm font-black"
                    style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)', color: '#fca5a5' }}>
                    ${betAmount}
                  </div>
                  <button onClick={() => setBetAmount(b => Math.min(balance, b * 2))} disabled={phase === 'dealing'}
                    className="w-10 h-9 rounded-lg text-xs font-bold disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>2×</button>
                </div>
              </div>

              {/* Last profit */}
              <AnimatePresence>
                {lastProfit !== null && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="rounded-2xl p-4 text-center font-black text-lg"
                    style={{
                      background: lastProfit >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${lastProfit >= 0 ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.3)'}`,
                      color: lastProfit >= 0 ? '#4ade80' : '#f87171',
                    }}>
                    {lastProfit >= 0 ? '+' : ''}${lastProfit.toFixed(2)}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bead road history */}
              {history.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Road Map</p>
                  <div className="flex flex-wrap gap-1.5">
                    {history.slice(0, 20).map((h, i) => (
                      <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md"
                        style={{ background: HISTORY_COLORS[h.winner], boxShadow: `0 0 8px ${HISTORY_COLORS[h.winner]}50` }}>
                        {HISTORY_LABELS[h.winner]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Game area ── */}
            <div className="space-y-4">

              {/* Banker zone */}
              <div className="rounded-2xl p-5 relative" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(239,68,68,0.18)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(239,68,68,0.7)' }}>Banker</p>
                    {bankerCards.length > 0 && (
                      <p className="text-4xl font-black" style={{ color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.5)' }}>
                        {handTotal(bankerCards)}
                      </p>
                    )}
                  </div>
                  {winner === 'banker' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="px-4 py-2 rounded-full text-xs font-black"
                      style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#f87171', boxShadow: '0 0 16px rgba(239,68,68,0.3)' }}>
                      WINNER
                    </motion.div>
                  )}
                </div>
                <div className="flex gap-2" style={{ perspective: '900px' }}>
                  {bankerCards.map((c, i) => <CardFace key={i} card={c} delay={i * 0.2} />)}
                  {bankerCards.length === 0 && [0, 1].map(i => (
                    <div key={i} style={{ width: 82, height: 116, borderRadius: 12, background: 'rgba(239,68,68,0.04)', border: '1px dashed rgba(239,68,68,0.18)' }} />
                  ))}
                </div>
              </div>

              {/* Player zone */}
              <div className="rounded-2xl p-5 relative" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(59,130,246,0.18)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(59,130,246,0.7)' }}>Player</p>
                    {playerCards.length > 0 && (
                      <p className="text-4xl font-black" style={{ color: '#3b82f6', textShadow: '0 0 20px rgba(59,130,246,0.5)' }}>
                        {handTotal(playerCards)}
                      </p>
                    )}
                  </div>
                  {winner === 'player' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="px-4 py-2 rounded-full text-xs font-black"
                      style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.5)', color: '#93c5fd', boxShadow: '0 0 16px rgba(59,130,246,0.3)' }}>
                      WINNER
                    </motion.div>
                  )}
                  {winner === 'tie' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="px-4 py-2 rounded-full text-xs font-black"
                      style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.5)', color: '#86efac', boxShadow: '0 0 16px rgba(34,197,94,0.3)' }}>
                      TIE
                    </motion.div>
                  )}
                </div>
                <div className="flex gap-2" style={{ perspective: '900px' }}>
                  {playerCards.map((c, i) => <CardFace key={i} card={c} delay={i * 0.2} />)}
                  {playerCards.length === 0 && [0, 1].map(i => (
                    <div key={i} style={{ width: 82, height: 116, borderRadius: 12, background: 'rgba(59,130,246,0.04)', border: '1px dashed rgba(59,130,246,0.18)' }} />
                  ))}
                </div>
                {phase === 'betting' && !selectedBet && (
                  <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Select a bet below to start</p>
                )}
              </div>

              {/* Bet buttons */}
              <div className="grid grid-cols-3 gap-3">
                {BET_OPTIONS.map(b => {
                  const isSelected = selectedBet === b.type;
                  return (
                    <button key={b.type!} onClick={() => { if (phase === 'betting') setSelectedBet(b.type); }}
                      disabled={phase === 'dealing'}
                      className="py-5 rounded-2xl font-black text-sm transition-all disabled:opacity-40 text-white"
                      style={{
                        background: isSelected ? `${b.active}30` : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${isSelected ? b.active : 'rgba(255,255,255,0.1)'}`,
                        color: isSelected ? b.active : 'rgba(255,255,255,0.55)',
                        boxShadow: isSelected ? `0 0 20px ${b.glow}` : 'none',
                      }}>
                      <p className="text-base">{b.label}</p>
                      <p className="text-xs opacity-60 mt-1">{b.odds}</p>
                    </button>
                  );
                })}
              </div>

              {/* Action button */}
              {phase === 'betting' && (
                <button onClick={deal} disabled={!selectedBet || balance < betAmount}
                  className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', boxShadow: '0 0 24px rgba(220,38,38,0.35)' }}>
                  DEAL — ${betAmount}
                </button>
              )}
              {phase === 'dealing' && (
                <div className="w-full py-4 rounded-2xl font-black text-base text-center"
                  style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#fca5a5' }}>
                  Dealing...
                </div>
              )}
              {phase === 'result' && (
                <button onClick={reset}
                  className="w-full py-4 rounded-2xl font-black text-base transition-all"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff' }}>
                  NEW ROUND
                </button>
              )}
            </div>
          </div>
        </div>
        <GameRules gameId="baccarat" />
      </section>
    </MainLayout>
  );
}
