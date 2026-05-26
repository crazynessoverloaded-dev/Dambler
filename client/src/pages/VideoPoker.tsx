import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

type Suit = '♠' | '♥' | '♦' | '♣';
interface Card { value: number; suit: Suit; label: string }
type Phase = 'betting' | 'dealt' | 'result';

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS)
    for (let v = 1; v <= 13; v++)
      deck.push({ value: v === 1 ? 14 : v, suit, label: LABELS[v] });
  return deck.sort(() => Math.random() - 0.5);
}

function isRed(suit: Suit) { return suit === '♥' || suit === '♦'; }

type HandRank = 'Royal Flush' | 'Straight Flush' | 'Four of a Kind' | 'Full House' | 'Flush' | 'Straight' | 'Three of a Kind' | 'Two Pair' | 'Jacks or Better' | 'Nothing';

const PAYOUTS: Record<HandRank, number> = {
  'Royal Flush': 800, 'Straight Flush': 50, 'Four of a Kind': 25,
  'Full House': 9, 'Flush': 6, 'Straight': 4, 'Three of a Kind': 3,
  'Two Pair': 2, 'Jacks or Better': 1, 'Nothing': 0,
};

function evaluateHand(cards: Card[]): HandRank {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const vals = sorted.map(c => c.value);
  const suits = sorted.map(c => c.suit);
  const counts: Record<number, number> = {};
  vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const groups = Object.values(counts).sort((a, b) => b - a);
  const isFlush = new Set(suits).size === 1;
  const isStraight = (vals[0] - vals[4] === 4 && new Set(vals).size === 5) ||
    (vals[0] === 14 && vals[1] === 5 && vals[2] === 4 && vals[3] === 3 && vals[4] === 2);
  const isRoyal = isFlush && isStraight && vals[0] === 14 && vals[1] === 13;

  if (isRoyal) return 'Royal Flush';
  if (isFlush && isStraight) return 'Straight Flush';
  if (groups[0] === 4) return 'Four of a Kind';
  if (groups[0] === 3 && groups[1] === 2) return 'Full House';
  if (isFlush) return 'Flush';
  if (isStraight) return 'Straight';
  if (groups[0] === 3) return 'Three of a Kind';
  if (groups[0] === 2 && groups[1] === 2) return 'Two Pair';
  if (groups[0] === 2) {
    const pair = Number(Object.keys(counts).find(k => counts[+k] === 2));
    if (pair >= 11 || pair === 14) return 'Jacks or Better';
  }
  return 'Nothing';
}

const PAYTABLE_ENTRIES = (Object.entries(PAYOUTS) as [HandRank, number][]).filter(([, v]) => v > 0);

function PokerCard({ card, held, onClick }: { card: Card | null; held: boolean; onClick: () => void }) {
  const red = card ? isRed(card.suit) : false;
  const color = red ? '#ef4444' : '#0f172a';
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        onClick={onClick}
        whileHover={{ y: -6 }}
        initial={{ rotateY: 90 }} animate={{ rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="cursor-pointer relative"
        style={{
          width: 76, height: 108, borderRadius: 10, background: card ? '#fff' : 'rgba(255,255,255,0.04)',
          border: `2.5px solid ${held ? '#22c55e' : card ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'}`,
          boxShadow: held ? '0 0 20px rgba(34,197,94,0.5), 0 4px 16px rgba(0,0,0,0.6)'
            : card ? '0 4px 16px rgba(0,0,0,0.6)' : 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
          padding: 6, userSelect: 'none'
        }}>
        {card ? (
          <>
            <span className="text-xs font-black leading-none self-start" style={{ color }}>{card.label}</span>
            <span className="text-2xl leading-none" style={{ color }}>{card.suit}</span>
            <span className="text-xs font-black leading-none self-end rotate-180" style={{ color }}>{card.label}</span>
          </>
        ) : (
          <div className="w-full h-full rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.0)' }}>
            <span style={{ color: 'rgba(255,255,255,0.0)', fontSize: 28 }}>♦</span>
          </div>
        )}
      </motion.div>
      <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: held ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
        {card ? (held ? 'HELD' : 'hold?') : ''}
      </span>
    </div>
  );
}

const CHIPS = [1, 5, 25, 100];

export default function VideoPoker() {
  const { balance, balanceRef, setBalance } = useGameWallet('VideoPoker');
  const [betAmount, setBetAmount] = useState(5);
  const [phase, setPhase] = useState<Phase>('betting');
  const [deck, setDeck] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [handRank, setHandRank] = useState<HandRank | null>(null);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [history, setHistory] = useState<{ rank: HandRank; profit: number }[]>([]);
  const [dealId, setDealId] = useState(0);

  const deal = useCallback(() => {
    if (balance < betAmount) return;
    setBalance(b => parseFloat((b - betAmount).toFixed(2)));
    const d = buildDeck();
    setDeck(d.slice(5));
    setHand(d.slice(0, 5));
    setHeld([false, false, false, false, false]);
    setHandRank(null);
    setLastProfit(null);
    setDealId(n => n + 1);
    setPhase('dealt');
  }, [balance, betAmount]);

  const draw = useCallback(() => {
    setDeck(d => {
      const remaining = [...d];
      const newHand = hand.map((card, i) => held[i] ? card : remaining.shift()!);
      const rank = evaluateHand(newHand);
      const payout = PAYOUTS[rank];
      const win = parseFloat((betAmount * payout).toFixed(2));
      const profit = parseFloat((win - betAmount).toFixed(2));
      if (win > 0) setBalance(b => parseFloat((b + win).toFixed(2)));
      setLastProfit(profit);
      setHandRank(rank);
      setHistory(h => [{ rank, profit }, ...h.slice(0, 9)]);
      setHand(newHand);
      setPhase('result');
      return remaining;
    });
  }, [hand, held, betAmount]);

  const toggleHold = (i: number) => {
    if (phase !== 'dealt') return;
    setHeld(h => h.map((v, idx) => idx === i ? !v : v));
  };

  const accentColor = '#4ade80';

  return (
    <MainLayout>
      <div className="min-h-screen py-8 pb-16 relative" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.0) 0%, transparent 60%), var(--background)'
      }}>
        <div className="max-w-5xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 text-xs font-bold tracking-widest uppercase" style={{ borderColor: 'rgba(255,255,255,0.0)', background: 'rgba(255,255,255,0.0)', color: accentColor }}>
                <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}>♠</motion.span>
                VIDEO POKER
                <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.9 }}>♦</motion.span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1" style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #ec4899 45%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Video Poker</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Jacks or Better — hold your best cards and draw to improve.</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">

            {/* Controls */}
            <div className="rounded-2xl border p-5 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>

              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Bet Per Hand</p>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {CHIPS.map(a => (
                    <button key={a} onClick={() => setBetAmount(a)} disabled={phase === 'dealt'}
                      className="py-2 rounded-lg text-xs font-black transition-all disabled:opacity-40"
                      style={{
                        border: `1.5px solid ${betAmount === a ? accentColor : 'rgba(255,255,255,0.1)'}`,
                        background: betAmount === a ? `${accentColor}22` : 'transparent',
                        color: betAmount === a ? accentColor : 'var(--muted-foreground)'
                      }}>
                      ${a}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setBetAmount(p => Math.max(1, Math.floor(p / 2)))} disabled={phase === 'dealt'}
                    className="px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                    style={{ border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }}>½</button>
                  <div className="flex-1 rounded-lg px-3 py-2 text-sm font-black text-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--foreground)' }}>
                    ${betAmount}
                  </div>
                  <button onClick={() => setBetAmount(p => Math.min(balance, p * 2))} disabled={phase === 'dealt'}
                    className="px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                    style={{ border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }}>2×</button>
                </div>
              </div>

              {/* Result */}
              <AnimatePresence>
                {lastProfit !== null && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: lastProfit >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1.5px solid ${lastProfit >= 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`
                    }}>
                    {handRank && <p className="text-xs font-bold mb-1" style={{ color: 'var(--muted-foreground)' }}>{handRank}</p>}
                    <p className="text-lg font-black" style={{ color: lastProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                      {lastProfit >= 0 ? '+' : ''}${lastProfit.toFixed(2)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* History */}
              {history.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>History</p>
                  <div className="space-y-1">
                    {history.slice(0, 6).map((h, i) => (
                      <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs"
                        style={{ background: h.profit >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
                        <span style={{ color: 'var(--muted-foreground)' }}>{h.rank}</span>
                        <span className="font-black" style={{ color: h.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                          {h.profit >= 0 ? '+' : ''}${h.profit.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="space-y-4">
              {/* Pay table strip */}
              <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.0)', borderColor: 'rgba(255,255,255,0.0)' }}>
                <div className="flex overflow-x-auto scrollbar-hide p-2 gap-2">
                  {PAYTABLE_ENTRIES.map(([rank, mult]) => {
                    const active = handRank === rank;
                    return (
                      <div key={rank} className="flex-shrink-0 text-center px-3 py-2 rounded-xl transition-all"
                        style={{
                          background: active ? `${accentColor}22` : 'transparent',
                          border: `1.5px solid ${active ? accentColor : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: active ? `0 0 14px ${accentColor}44` : 'none'
                        }}>
                        <p className="text-sm font-black" style={{ color: active ? accentColor : 'var(--foreground)' }}>{mult}×</p>
                        <p className="text-[10px] leading-tight whitespace-nowrap" style={{ color: active ? accentColor : 'var(--muted-foreground)' }}>{rank}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card area */}
              <div className="rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(170deg, #0a0612 0%, #050309 100%)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="p-8">
                  {/* Hand rank display */}
                  <AnimatePresence>
                    {handRank && handRank !== 'Nothing' && phase === 'result' && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="text-center mb-6">
                        <p className="text-2xl font-black" style={{ color: accentColor }}>{handRank}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Cards */}
                  <div className="flex justify-center gap-4 mb-8">
                    {(phase === 'betting' ? Array(5).fill(null) : hand).map((card, i) => (
                      <PokerCard key={card ? `d${dealId}-${card.value}${card.suit}` : `e${i}`} card={card} held={held[i]} onClick={() => toggleHold(i)} />
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-center gap-4">
                    {phase === 'betting' && (
                      <button onClick={deal} disabled={balance < betAmount}
                        className="px-14 py-3.5 rounded-xl font-black text-base transition-all disabled:opacity-40"
                        style={{
                          background: 'linear-gradient(135deg, #ca8a04, #b45309)',
                          color: '#000',
                          boxShadow: '0 0 24px rgba(202,138,4,0.45)'
                        }}>
                        DEAL — ${betAmount}
                      </button>
                    )}
                    {phase === 'dealt' && (
                      <button onClick={draw}
                        className="px-14 py-3.5 rounded-xl font-black text-base transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #16a34a, #15803d)',
                          color: '#fff',
                          boxShadow: '0 0 24px rgba(22,163,74,0.4)'
                        }}>
                        DRAW
                      </button>
                    )}
                    {phase === 'result' && (
                      <button onClick={deal} disabled={balance < betAmount}
                        className="px-14 py-3.5 rounded-xl font-black text-base transition-all disabled:opacity-40"
                        style={{
                          background: 'linear-gradient(135deg, #ca8a04, #b45309)',
                          color: '#000',
                          boxShadow: '0 0 24px rgba(202,138,4,0.45)'
                        }}>
                        DEAL AGAIN — ${betAmount}
                      </button>
                    )}
                  </div>

                  {phase === 'dealt' && (
                    <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Click cards to hold them, then draw</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 lg:px-6 mt-6">
          <GameRules gameId="video-poker" />
        </div>
      </div>
    </MainLayout>
  );
}


