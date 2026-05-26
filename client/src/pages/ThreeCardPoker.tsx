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
  const d: Card[] = [];
  for (const s of SUITS) for (let v = 1; v <= 13; v++) d.push({ value: v === 1 ? 14 : v, suit: s, label: LABELS[v] });
  return d.sort(() => Math.random() - 0.5);
}
function isRed(s: Suit) { return s === '♥' || s === '♦'; }

type HandRank = 'Straight Flush' | 'Three of a Kind' | 'Straight' | 'Flush' | 'Pair' | 'High Card';
const PAIR_PLUS: Record<HandRank, number> = {
  'Straight Flush': 40, 'Three of a Kind': 30, 'Straight': 6, 'Flush': 3, 'Pair': 1, 'High Card': 0,
};

function evaluate3Card(cards: Card[]): HandRank {
  const vals = cards.map(c => c.value).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = new Set(suits).size === 1;
  const isStr = (vals[0] - vals[2] === 2 && new Set(vals).size === 3) || (vals[0] === 14 && vals[1] === 3 && vals[2] === 2);
  const counts: Record<number, number> = {};
  vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const groups = Object.values(counts).sort((a, b) => b - a);
  if (isFlush && isStr) return 'Straight Flush';
  if (groups[0] === 3) return 'Three of a Kind';
  if (isStr) return 'Straight';
  if (isFlush) return 'Flush';
  if (groups[0] === 2) return 'Pair';
  return 'High Card';
}

function compareHands(p: Card[], d: Card[]): 'player' | 'dealer' | 'tie' {
  const rankOrder: HandRank[] = ['Straight Flush', 'Three of a Kind', 'Straight', 'Flush', 'Pair', 'High Card'];
  const pr = evaluate3Card(p), dr = evaluate3Card(d);
  const pi = rankOrder.indexOf(pr), di = rankOrder.indexOf(dr);
  if (pi < di) return 'player';
  if (di < pi) return 'dealer';
  const pv = p.map(c => c.value).sort((a, b) => b - a);
  const dv = d.map(c => c.value).sort((a, b) => b - a);
  for (let i = 0; i < 3; i++) {
    if (pv[i] > dv[i]) return 'player';
    if (dv[i] > pv[i]) return 'dealer';
  }
  return 'tie';
}

function dealerQualifies(d: Card[]): boolean {
  const vals = d.map(c => c.value).sort((a, b) => b - a);
  const rank = evaluate3Card(d);
  if (rank !== 'High Card') return true;
  return vals[0] >= 12;
}

function CardFace({ card, hidden }: { card?: Card; hidden?: boolean }) {
  if (hidden || !card) {
    return (
      <div style={{ width: 62, height: 88, borderRadius: 8, background: 'linear-gradient(135deg, #1c1400, #2d1f00)', border: '2px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>
        <span style={{ color: 'rgba(245,158,11,0.35)', fontSize: 20 }}>♦</span>
      </div>
    );
  }
  const red = isRed(card.suit);
  const color = red ? '#ef4444' : '#0f172a';
  return (
    <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ type: 'spring', stiffness: 200 }}
      style={{ width: 62, height: 88, borderRadius: 8, background: '#fff', border: '2px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 6, userSelect: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.6)' }}>
      <span style={{ fontSize: 12, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-start', color }}>{card.label}</span>
      <span style={{ fontSize: 22, lineHeight: 1, color }}>{card.suit}</span>
      <span style={{ fontSize: 12, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)', color }}>{card.label}</span>
    </motion.div>
  );
}

const ANTE_CHIPS = [5, 10, 25, 50];
const PP_OPTIONS = [0, 5, 10, 25];

export default function ThreeCardPoker() {
  const { balance, balanceRef, setBalance } = useGameWallet('ThreeCardPoker');
  const [anteBet, setAnteBet] = useState(10);
  const [pairPlusBet, setPairPlusBet] = useState(0);
  const [phase, setPhase] = useState<Phase>('betting');
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [dealerRevealed, setDealerRevealed] = useState(false);
  const [result, setResult] = useState<string>('');
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [history, setHistory] = useState<{ profit: number; result: string }[]>([]);

  const totalBet = anteBet + pairPlusBet;

  const deal = useCallback(() => {
    if (balance < totalBet) return;
    setBalance(b => parseFloat((b - totalBet).toFixed(2)));
    const d = buildDeck();
    setPlayerCards(d.slice(0, 3));
    setDealerCards(d.slice(3, 6));
    setDealerRevealed(false);
    setResult('');
    setLastProfit(null);
    setPhase('dealt');
  }, [balance, totalBet]);

  const fold = useCallback(() => {
    setDealerRevealed(true);
    const profit = -totalBet;
    setLastProfit(profit);
    setResult('Folded — ante lost.');
    setHistory(h => [{ profit, result: 'Fold' }, ...h.slice(0, 19)]);
    setPhase('result');
  }, [totalBet]);

  const call = useCallback(() => {
    if (balance < anteBet) return;
    setBalance(b => parseFloat((b - anteBet).toFixed(2)));
    setDealerRevealed(true);

    let profit = -totalBet - anteBet;
    let msg = '';

    const pRank = evaluate3Card(playerCards);
    const ppMult = PAIR_PLUS[pRank];
    if (pairPlusBet > 0 && ppMult > 0) {
      profit += pairPlusBet * ppMult + pairPlusBet;
      msg += `Pair+ (${pRank}) +$${(pairPlusBet * ppMult).toFixed(0)}. `;
    }

    if (!dealerQualifies(dealerCards)) {
      profit += anteBet * 2;
      msg += 'Dealer no qualify — Ante wins, Play push.';
    } else {
      const cmp = compareHands(playerCards, dealerCards);
      if (cmp === 'player') {
        profit += anteBet * 2 + anteBet * 2;
        msg += `Player wins with ${pRank}!`;
      } else if (cmp === 'tie') {
        profit += anteBet + anteBet;
        msg += 'Tie — push.';
      } else {
        msg += `Dealer wins with ${evaluate3Card(dealerCards)}.`;
      }
    }

    setLastProfit(profit);
    setResult(msg);
    if (profit > 0) setBalance(b => parseFloat((b + profit).toFixed(2)));
    setHistory(h => [{ profit, result: msg }, ...h.slice(0, 19)]);
    setPhase('result');
  }, [balance, anteBet, pairPlusBet, totalBet, playerCards, dealerCards]);

  const playerRank = playerCards.length ? evaluate3Card(playerCards) : null;
  const accentColor = '#f59e0b';

  return (
    <MainLayout>
      <div className="min-h-screen py-8 pb-16 relative" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.22) 0%, transparent 58%), var(--background)'
      }}>
        <div className="max-w-5xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 text-xs font-bold tracking-widest uppercase" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', color: accentColor }}>
                <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>♠</motion.span>
                THREE CARD POKER
                <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>♦</motion.span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1" style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 45%, #dc2626 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Three Card Poker</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Ante + optional Pair Plus side bet — dealer needs Queen-high to qualify.</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">

            {/* Controls */}
            <div className="rounded-2xl border p-5 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>

              {/* Ante bet */}
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Ante Bet</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ANTE_CHIPS.map(a => (
                    <button key={a} onClick={() => setAnteBet(a)} disabled={phase === 'dealt'}
                      className="py-2 rounded-lg text-xs font-black transition-all disabled:opacity-40"
                      style={{
                        border: `1.5px solid ${anteBet === a ? accentColor : 'rgba(255,255,255,0.1)'}`,
                        background: anteBet === a ? `${accentColor}22` : 'transparent',
                        color: anteBet === a ? accentColor : 'var(--muted-foreground)'
                      }}>
                      ${a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pair Plus bet */}
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Pair Plus Side Bet</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PP_OPTIONS.map(a => (
                    <button key={a} onClick={() => setPairPlusBet(a)} disabled={phase === 'dealt'}
                      className="py-2 rounded-lg text-xs font-black transition-all disabled:opacity-40"
                      style={{
                        border: `1.5px solid ${pairPlusBet === a ? '#f97316' : 'rgba(255,255,255,0.1)'}`,
                        background: pairPlusBet === a ? 'rgba(249,115,22,0.15)' : 'transparent',
                        color: pairPlusBet === a ? '#f97316' : 'var(--muted-foreground)'
                      }}>
                      {a === 0 ? 'Off' : `$${a}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="rounded-xl px-3 py-2.5 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Total Bet</span>
                <span className="font-black" style={{ color: accentColor }}>${totalBet}</span>
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
                    <p className="text-lg font-black" style={{ color: lastProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                      {lastProfit >= 0 ? '+' : ''}${lastProfit.toFixed(2)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pair Plus pays */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1.5px solid rgba(245,158,11,0.12)' }}>
                <p className="text-xs font-black mb-2" style={{ color: accentColor }}>Pair Plus Pays</p>
                {(Object.entries(PAIR_PLUS) as [HandRank, number][]).filter(([, v]) => v > 0).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[11px] mb-1">
                    <span style={{ color: 'var(--muted-foreground)' }}>{k}</span>
                    <span className="font-black" style={{ color: 'var(--foreground)' }}>{v}:1</span>
                  </div>
                ))}
              </div>

              {/* History */}
              {history.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>History</p>
                  <div className="space-y-1">
                    {history.slice(0, 5).map((h, i) => (
                      <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs"
                        style={{ background: h.profit >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
                        <span className="truncate" style={{ color: 'var(--muted-foreground)', maxWidth: 120 }}>{h.result}</span>
                        <span className="font-black ml-1 shrink-0" style={{ color: h.profit >= 0 ? '#22c55e' : '#ef4444' }}>
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
              {/* Dealer zone */}
              <div className="rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(170deg, #0c0800 0%, #070500 100%)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Dealer</p>
                    {dealerRevealed && dealerCards.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full"
                          style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}44`, color: accentColor }}>
                          {evaluate3Card(dealerCards)}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: dealerQualifies(dealerCards) ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${dealerQualifies(dealerCards) ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, color: dealerQualifies(dealerCards) ? '#22c55e' : '#ef4444' }}>
                          {dealerQualifies(dealerCards) ? 'Qualifies' : 'No Qualify'}
                        </span>
                      </div>
                    )}
                    {!dealerRevealed && phase !== 'betting' && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>All face down</span>}
                  </div>
                  <div className="flex gap-3">
                    {(phase === 'betting' ? [undefined, undefined, undefined] : dealerCards).map((card, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
                        <CardFace card={card} hidden={!dealerRevealed} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Player zone */}
              <div className="rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(170deg, #0c0a00 0%, rgba(245,158,11,0.05) 100%)', borderColor: 'rgba(245,158,11,0.1)' }}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Your Hand</p>
                    {playerRank && (
                      <span className="text-xs font-black px-2.5 py-1 rounded-full"
                        style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}44`, color: accentColor }}>
                        {playerRank}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {(phase === 'betting' ? [undefined, undefined, undefined] : playerCards).map((card, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8, rotateY: 90 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ type: 'spring', stiffness: 150, damping: 18, delay: i * 0.38 }}>
                        <CardFace card={card} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Result message */}
              <AnimatePresence>
                {result && phase === 'result' && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="rounded-2xl p-4 text-center"
                    style={{
                      background: lastProfit !== null && lastProfit > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1.5px solid ${lastProfit !== null && lastProfit > 0 ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
                      boxShadow: lastProfit !== null && lastProfit > 0 ? '0 0 24px rgba(34,197,94,0.2)' : '0 0 24px rgba(239,68,68,0.2)'
                    }}>
                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{result}</p>
                    {lastProfit !== null && (
                      <p className="text-3xl font-black mt-1" style={{ color: lastProfit > 0 ? '#22c55e' : lastProfit < 0 ? '#ef4444' : 'var(--foreground)' }}>
                        {lastProfit > 0 ? `+$${lastProfit.toFixed(2)}` : lastProfit < 0 ? `-$${Math.abs(lastProfit).toFixed(2)}` : 'Push'}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex gap-3">
                {phase === 'betting' && (
                  <button onClick={deal} disabled={balance < totalBet}
                    className="flex-1 py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-40"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, #d97706)`, color: '#000', boxShadow: `0 0 22px ${accentColor}44` }}>
                    DEAL — ${totalBet}
                  </button>
                )}
                {phase === 'dealt' && (
                  <>
                    <button onClick={fold}
                      className="flex-1 py-3.5 rounded-xl font-black text-sm transition-all"
                      style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.45)', color: '#ef4444' }}>
                      FOLD
                    </button>
                    <button onClick={call} disabled={balance < anteBet}
                      className="flex-1 py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', boxShadow: '0 0 18px rgba(22,163,74,0.4)' }}>
                      CALL — ${anteBet}
                    </button>
                  </>
                )}
                {phase === 'result' && (
                  <button onClick={() => { setPhase('betting'); setPlayerCards([]); setDealerCards([]); setResult(''); setLastProfit(null); }}
                    className="flex-1 py-3.5 rounded-xl font-black text-sm transition-all"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, #d97706)`, color: '#000', boxShadow: `0 0 22px ${accentColor}44` }}>
                    NEW ROUND
                  </button>
                )}
              </div>

              {phase === 'betting' && (
                <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Set ante, optional Pair Plus, then deal</p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 lg:px-6 mt-6">
          <GameRules gameId="three-card-poker" />
        </div>
      </div>
    </MainLayout>
  );
}
