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

function spreadPayout(spread: number): number {
  if (spread === 1) return 5;
  if (spread === 2) return 4;
  if (spread === 3) return 2;
  return 1;
}

function CardMed({ card }: { card?: Card }) {
  if (!card) {
    return (
      <div style={{ width: 80, height: 112, borderRadius: 10, background: 'linear-gradient(135deg, #1a0a0a, #2d0f0f)', border: '2px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
        <span style={{ color: 'rgba(239,68,68,0.3)', fontSize: 24 }}>♦</span>
      </div>
    );
  }
  const red = isRed(card.suit);
  const color = red ? '#ef4444' : '#0f172a';
  return (
    <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ type: 'spring', stiffness: 200 }}
      style={{ width: 80, height: 112, borderRadius: 10, background: '#fff', border: '2px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 7, userSelect: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.55)' }}>
      <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-start', color }}>{card.label}</span>
      <span style={{ fontSize: 34, lineHeight: 1, color }}>{card.suit}</span>
      <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)', color }}>{card.label}</span>
    </motion.div>
  );
}

const BET_AMOUNTS = [5, 10, 25, 50, 100];

export default function RedDog() {
  const { balance, balanceRef, setBalance } = useGameWallet('RedDog');
  const [betAmount, setBetAmount] = useState(10);
  const [phase, setPhase] = useState<Phase>('betting');
  const [card1, setCard1] = useState<Card | null>(null);
  const [card2, setCard2] = useState<Card | null>(null);
  const [card3, setCard3] = useState<Card | null>(null);
  const [spread, setSpread] = useState<number | null>(null);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [resultMsg, setResultMsg] = useState('');
  const [raised, setRaised] = useState(false);
  const [history, setHistory] = useState<{ msg: string; profit: number }[]>([]);

  const deal = useCallback(() => {
    if (balance < betAmount) return;
    setBalance(b => parseFloat((b - betAmount).toFixed(2)));
    const deck = buildDeck();
    const c1 = deck[0], c2 = deck[1];
    setCard1(c1); setCard2(c2); setCard3(null);
    setLastProfit(null); setResultMsg(''); setRaised(false);

    const lo = Math.min(c1.value, c2.value);
    const hi = Math.max(c1.value, c2.value);
    const gap = hi - lo - 1;

    if (c1.value === c2.value) {
      const c3 = deck[2];
      setCard3(c3);
      if (c3.value === c1.value) {
        const win = betAmount * 11 + betAmount;
        setBalance(b => parseFloat((b + win).toFixed(2)));
        const profit = win - betAmount;
        setLastProfit(profit);
        const msg = 'Three of a Kind! 11:1';
        setResultMsg(msg);
        setHistory(h => [{ msg, profit }, ...h.slice(0, 9)]);
        setSpread(null);
        setPhase('result');
      } else {
        setBalance(b => parseFloat((b + betAmount).toFixed(2)));
        setLastProfit(0);
        const msg = 'Pair — push!';
        setResultMsg(msg);
        setHistory(h => [{ msg, profit: 0 }, ...h.slice(0, 9)]);
        setSpread(null);
        setPhase('result');
      }
    } else if (gap === 0) {
      setBalance(b => parseFloat((b + betAmount).toFixed(2)));
      setLastProfit(0);
      const msg = 'Consecutive — push!';
      setResultMsg(msg);
      setHistory(h => [{ msg, profit: 0 }, ...h.slice(0, 9)]);
      setSpread(null);
      setPhase('result');
    } else {
      setSpread(gap);
      setResultMsg(`Spread: ${gap} — does the 3rd card fall between?`);
      setPhase('dealt');
    }
  }, [balance, betAmount]);

  const raise = useCallback(() => {
    if (balance < betAmount) return;
    setBalance(b => parseFloat((b - betAmount).toFixed(2)));
    setRaised(true);
    drawThird(true);
  }, [balance, betAmount]);

  const stand = useCallback(() => {
    drawThird(false);
  }, []);

  const drawThird = (didRaise: boolean) => {
    if (!card1 || !card2 || spread === null) return;
    const deck = buildDeck();
    const c3 = deck[0];
    setCard3(c3);

    const lo = Math.min(card1.value, card2.value);
    const hi = Math.max(card1.value, card2.value);
    const inRange = c3.value > lo && c3.value < hi;

    const totalBet = betAmount + (didRaise ? betAmount : 0);
    const payout = spreadPayout(spread!);

    if (inRange) {
      const win = totalBet * payout + totalBet;
      setBalance(b => parseFloat((b + win).toFixed(2)));
      const profit = win - totalBet;
      const msg = `${c3.label}${c3.suit} is between — Win ${payout}:1!`;
      setLastProfit(profit);
      setResultMsg(msg);
      setHistory(h => [{ msg, profit }, ...h.slice(0, 9)]);
    } else {
      const profit = -totalBet;
      const msg = `${c3.label}${c3.suit} missed — Dealer wins.`;
      setLastProfit(profit);
      setResultMsg(msg);
      setHistory(h => [{ msg, profit }, ...h.slice(0, 9)]);
    }
    setPhase('result');
  };

  const reset = () => {
    setPhase('betting');
    setCard1(null); setCard2(null); setCard3(null);
    setSpread(null); setLastProfit(null); setResultMsg('');
  };

  const accentColor = '#ef4444';

  return (
    <MainLayout>
      <div className="min-h-screen py-8 pb-16 relative" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.24) 0%, transparent 58%), var(--background)'
      }}>
        <div className="max-w-5xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 text-xs font-bold tracking-widest uppercase" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: accentColor }}>
                <motion.span animate={{ x: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 1.5 }}>🐕</motion.span>
                RED DOG
                <motion.span animate={{ x: [2, -2, 2] }} transition={{ repeat: Infinity, duration: 1.5 }}>🐕</motion.span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1" style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 50%, #ef4444 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Red Dog</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Does the third card fall between the first two?</p>
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
                <div className="grid grid-cols-3 gap-1.5">
                  {BET_AMOUNTS.map(a => (
                    <button key={a} onClick={() => setBetAmount(a)} disabled={phase !== 'betting'}
                      className="py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-40"
                      style={{
                        border: `1.5px solid ${betAmount === a ? accentColor : 'rgba(255,255,255,0.1)'}`,
                        background: betAmount === a ? `${accentColor}22` : 'transparent',
                        color: betAmount === a ? accentColor : 'var(--muted-foreground)'
                      }}>
                      ${a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result */}
              <AnimatePresence>
                {lastProfit !== null && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: lastProfit > 0 ? 'rgba(34,197,94,0.1)' : lastProfit < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${lastProfit > 0 ? 'rgba(34,197,94,0.4)' : lastProfit < 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`
                    }}>
                    <p className="text-lg font-black" style={{ color: lastProfit > 0 ? '#22c55e' : lastProfit < 0 ? '#ef4444' : 'var(--foreground)' }}>
                      {lastProfit > 0 ? `+$${lastProfit.toFixed(2)}` : lastProfit < 0 ? `-$${Math.abs(lastProfit).toFixed(2)}` : 'Push'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Spread payouts */}
              <div className="rounded-xl p-3" style={{ background: `${accentColor}0d`, border: `1.5px solid ${accentColor}22` }}>
                <p className="text-xs font-black mb-2" style={{ color: accentColor }}>Spread Payouts</p>
                <div className="space-y-1">
                  {[['Spread 1', '5:1'], ['Spread 2', '4:1'], ['Spread 3', '2:1'], ['Spread 4+', '1:1'], ['Three of a Kind', '11:1'], ['Pair / Consecutive', 'Push']].map(([label, pay]) => (
                    <div key={label} className="flex justify-between text-[11px]">
                      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
                      <span className="font-black" style={{ color: 'var(--foreground)' }}>{pay}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* History */}
              {history.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>History</p>
                  <div className="space-y-1">
                    {history.slice(0, 5).map((h, i) => (
                      <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs"
                        style={{ background: h.profit >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
                        <span className="truncate text-[10px]" style={{ color: 'var(--muted-foreground)', maxWidth: 110 }}>{h.msg}</span>
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
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(170deg, #0f0404 0%, #080202 100%)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="p-8 flex flex-col items-center gap-8 min-h-[460px]">

                {/* Card display */}
                <div className="flex items-center justify-center gap-6 w-full">
                  {/* Card 1 */}
                  <div className="text-center">
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Card 1</p>
                    <CardMed card={card1 || undefined} />
                  </div>

                  {/* Spread indicator */}
                  <div className="text-center px-4">
                    {spread !== null ? (
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Spread</p>
                        <motion.p animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                          className="text-5xl font-black" style={{ color: accentColor }}>{spread}</motion.p>
                        <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Pays {spreadPayout(spread)}:1</p>
                      </div>
                    ) : (
                      <p className="text-3xl" style={{ color: 'rgba(255,255,255,0.15)' }}>—</p>
                    )}
                  </div>

                  {/* Card 2 */}
                  <div className="text-center">
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Card 2</p>
                    <CardMed card={card2 || undefined} />
                  </div>

                  {/* Arrow + Card 3 */}
                  {(card3 || phase === 'dealt') && (
                    <>
                      <motion.p animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1 }}
                        className="text-2xl" style={{ color: 'rgba(255,255,255,0.3)' }}>→</motion.p>
                      <div className="text-center">
                        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Card 3</p>
                        <CardMed card={card3 || undefined} />
                      </div>
                    </>
                  )}
                </div>

                {/* Result message */}
                <AnimatePresence>
                  {resultMsg && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="rounded-xl px-6 py-3 text-center w-full max-w-md"
                      style={{
                        background: lastProfit !== null && lastProfit > 0 ? 'rgba(34,197,94,0.1)' : lastProfit !== null && lastProfit < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${lastProfit !== null && lastProfit > 0 ? 'rgba(34,197,94,0.35)' : lastProfit !== null && lastProfit < 0 ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: lastProfit !== null && lastProfit > 0 ? '0 0 24px rgba(34,197,94,0.2)' : 'none'
                      }}>
                      <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{resultMsg}</p>
                      {lastProfit !== null && (
                        <p className="text-3xl font-black mt-1" style={{ color: lastProfit > 0 ? '#22c55e' : lastProfit < 0 ? '#ef4444' : 'var(--foreground)' }}>
                          {lastProfit > 0 ? `+$${lastProfit.toFixed(2)}` : lastProfit < 0 ? `-$${Math.abs(lastProfit).toFixed(2)}` : 'Push'}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div className="flex gap-4 w-full max-w-md">
                  {phase === 'betting' && (
                    <button onClick={deal} disabled={balance < betAmount}
                      className="flex-1 py-4 rounded-xl font-black text-base transition-all disabled:opacity-40"
                      style={{ background: `linear-gradient(135deg, ${accentColor}, #b91c1c)`, color: '#fff', boxShadow: `0 0 24px ${accentColor}44` }}>
                      DEAL — ${betAmount}
                    </button>
                  )}
                  {phase === 'dealt' && (
                    <>
                      <button onClick={stand}
                        className="flex-1 py-4 rounded-xl font-black text-sm transition-all"
                        style={{ background: 'rgba(100,116,139,0.15)', border: '2px solid rgba(100,116,139,0.3)', color: '#94a3b8' }}>
                        STAND<br />
                        <span className="text-xs opacity-70">Draw now</span>
                      </button>
                      <button onClick={raise} disabled={balance < betAmount}
                        className="flex-1 py-4 rounded-xl font-black text-sm transition-all disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #ca8a04, #b45309)', color: '#000', boxShadow: '0 0 20px rgba(202,138,4,0.4)' }}>
                        RAISE<br />
                        <span className="text-xs opacity-80">+${betAmount} more</span>
                      </button>
                    </>
                  )}
                  {phase === 'result' && (
                    <button onClick={reset}
                      className="flex-1 py-4 rounded-xl font-black text-base transition-all"
                      style={{ background: `linear-gradient(135deg, ${accentColor}, #b91c1c)`, color: '#fff', boxShadow: `0 0 24px ${accentColor}44` }}>
                      NEW ROUND
                    </button>
                  )}
                </div>

                {phase === 'betting' && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.18)' }}>Two cards are dealt — bet if the third falls between them</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 lg:px-6 mt-6">
          <GameRules gameId="red-dog" />
        </div>
      </div>
    </MainLayout>
  );
}
