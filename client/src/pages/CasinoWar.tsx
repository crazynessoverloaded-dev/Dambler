import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

type Suit = '♠' | '♥' | '♦' | '♣';
interface Card { value: number; suit: Suit; label: string }
type Phase = 'betting' | 'dealt' | 'war' | 'result';

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function randomCard(): Card {
  const v = Math.ceil(Math.random() * 13);
  return { value: v === 1 ? 14 : v, suit: SUITS[Math.floor(Math.random() * 4)], label: LABELS[v] };
}
function isRed(s: Suit) { return s === '♥' || s === '♦'; }

function BigCard({ card, hidden, color }: { card?: Card; hidden?: boolean; color?: string }) {
  if (!card || hidden) {
    return (
      <div style={{ width: 110, height: 154, borderRadius: 14, background: 'linear-gradient(135deg, #1a0808, #2d0000)', border: `2.5px solid ${color ? color + '33' : 'rgba(220,38,38,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
        <span style={{ color: color ? color + '44' : 'rgba(220,38,38,0.3)', fontSize: 32 }}>♦</span>
      </div>
    );
  }
  const red = isRed(card.suit);
  const textColor = red ? '#ef4444' : '#0f172a';
  const glowColor = color || (red ? '#ef4444' : '#475569');
  return (
    <motion.div initial={{ rotateY: 90, scale: 0.85 }} animate={{ rotateY: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 180 }}
      style={{ width: 110, height: 154, borderRadius: 14, background: '#fff', border: '2.5px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 10, userSelect: 'none', boxShadow: `0 0 32px ${glowColor}44, 0 8px 32px rgba(0,0,0,0.7)` }}>
      <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-start', color: textColor }}>{card.label}</span>
      <span style={{ fontSize: 52, lineHeight: 1, color: textColor }}>{card.suit}</span>
      <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)', color: textColor }}>{card.label}</span>
    </motion.div>
  );
}

const BET_AMOUNTS = [5, 10, 25, 50, 100];

export default function CasinoWar() {
  const { balance, balanceRef, setBalance } = useGameWallet('CasinoWar');
  const [betAmount, setBetAmount] = useState(10);
  const [phase, setPhase] = useState<Phase>('betting');
  const [playerCard, setPlayerCard] = useState<Card | null>(null);
  const [dealerCard, setDealerCard] = useState<Card | null>(null);
  const [warPlayerCard, setWarPlayerCard] = useState<Card | null>(null);
  const [warDealerCard, setWarDealerCard] = useState<Card | null>(null);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<{ profit: number; result: string }[]>([]);

  const startRound = useCallback(() => {
    if (balance < betAmount) return;
    setBalance(b => parseFloat((b - betAmount).toFixed(2)));
    const p = randomCard(), d = randomCard();
    setPlayerCard(p);
    setDealerCard(d);
    setWarPlayerCard(null);
    setWarDealerCard(null);
    setLastProfit(null);
    setResult('');

    if (p.value > d.value) {
      const profit = betAmount;
      setBalance(b => parseFloat((b + betAmount * 2).toFixed(2)));
      setLastProfit(profit);
      setResult('You win!');
      setHistory(h => [{ profit, result: 'Win' }, ...h.slice(0, 19)]);
      setPhase('result');
    } else if (d.value > p.value) {
      const profit = -betAmount;
      setLastProfit(profit);
      setResult('Dealer wins.');
      setHistory(h => [{ profit, result: 'Loss' }, ...h.slice(0, 19)]);
      setPhase('result');
    } else {
      setResult('TIE — Go to War or Surrender?');
      setPhase('dealt');
    }
  }, [balance, betAmount]);

  const goToWar = useCallback(() => {
    if (balance < betAmount) return;
    setBalance(b => parseFloat((b - betAmount).toFixed(2)));
    const wp = randomCard(), wd = randomCard();
    setWarPlayerCard(wp);
    setWarDealerCard(wd);

    if (wp.value >= wd.value) {
      const profit = betAmount;
      setBalance(b => parseFloat((b + betAmount * 3).toFixed(2)));
      setLastProfit(profit);
      setResult('War won! You win the war bet!');
      setHistory(h => [{ profit, result: 'War Win' }, ...h.slice(0, 19)]);
    } else {
      const profit = -betAmount * 2;
      setLastProfit(profit);
      setResult('Dealer wins the war.');
      setHistory(h => [{ profit, result: 'War Loss' }, ...h.slice(0, 19)]);
    }
    setPhase('result');
  }, [balance, betAmount]);

  const surrender = useCallback(() => {
    const profit = -betAmount / 2;
    setBalance(b => parseFloat((b + betAmount / 2).toFixed(2)));
    setLastProfit(profit);
    setResult('Surrendered — lost half your bet.');
    setHistory(h => [{ profit, result: 'Surrender' }, ...h.slice(0, 19)]);
    setPhase('result');
  }, [betAmount]);

  const reset = () => {
    setPhase('betting');
    setPlayerCard(null); setDealerCard(null);
    setWarPlayerCard(null); setWarDealerCard(null);
    setResult(''); setLastProfit(null);
  };

  const accentColor = '#dc2626';
  const isTie = phase === 'dealt';

  return (
    <MainLayout>
      <div className="min-h-screen py-8 pb-16 relative" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.28) 0%, transparent 60%), var(--background)'
      }}>
        <div className="max-w-4xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 text-xs font-bold tracking-widest uppercase" style={{ borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.08)', color: accentColor }}>
                <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}>⚔️</motion.span>
                CASINO WAR
                <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.7 }}>⚔️</motion.span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1" style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #f97316 50%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Casino War</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Higher card wins — a Tie means War!</p>
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
                      background: lastProfit >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1.5px solid ${lastProfit >= 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`
                    }}>
                    <p className="text-lg font-black" style={{ color: lastProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                      {lastProfit >= 0 ? '+' : ''}${lastProfit.toFixed(2)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Rules */}
              <div className="rounded-xl p-3" style={{ background: `${accentColor}0d`, border: `1.5px solid ${accentColor}22` }}>
                <p className="text-xs font-black mb-2" style={{ color: accentColor }}>Rules</p>
                <div className="space-y-1">
                  {['Higher card wins 1:1', 'Ace is highest card', 'Tie → WAR: match bet', 'War win: +bet on war bet', 'Surrender: lose half bet'].map(r => (
                    <p key={r} className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>• {r}</p>
                  ))}
                </div>
              </div>

              {/* History */}
              {history.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>History</p>
                  <div className="space-y-1">
                    {history.slice(0, 6).map((h, i) => (
                      <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs"
                        style={{ background: h.profit >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
                        <span style={{ color: 'var(--muted-foreground)' }}>{h.result}</span>
                        <span className="font-black" style={{ color: h.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                          {h.profit >= 0 ? '+' : ''}${h.profit.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Arena */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(170deg, #0f0303 0%, #070101 100%)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="p-8 flex flex-col items-center gap-8 min-h-[480px]">

                {/* Main cards row */}
                <div className="flex items-center justify-center gap-10 w-full">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Dealer</p>
                    <BigCard card={dealerCard || undefined} color="#dc2626" />
                    {dealerCard && (
                      <p className="text-sm font-black" style={{ color: 'var(--muted-foreground)' }}>
                        {dealerCard.label}<span style={{ color: isRed(dealerCard.suit) ? '#ef4444' : 'var(--foreground)' }}>{dealerCard.suit}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <motion.p className="text-3xl font-black"
                      animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                      style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      VS
                    </motion.p>
                    {isTie && (
                      <motion.p animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                        className="text-xs font-black uppercase tracking-widest" style={{ color: '#f59e0b' }}>
                        TIE!
                      </motion.p>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>You</p>
                    <BigCard card={playerCard || undefined} color="#22c55e" />
                    {playerCard && (
                      <p className="text-sm font-black" style={{ color: 'var(--muted-foreground)' }}>
                        {playerCard.label}<span style={{ color: isRed(playerCard.suit) ? '#ef4444' : 'var(--foreground)' }}>{playerCard.suit}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* War cards row */}
                <AnimatePresence>
                  {(warPlayerCard || warDealerCard) && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-10 w-full pt-4"
                      style={{ borderTop: '1px solid rgba(220,38,38,0.2)' }}>
                      <div className="text-center">
                        <p className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: accentColor }}>War Card</p>
                        <BigCard card={warDealerCard || undefined} color="#dc2626" />
                      </div>
                      <motion.p animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                        className="text-3xl">⚔️</motion.p>
                      <div className="text-center">
                        <p className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: '#22c55e' }}>War Card</p>
                        <BigCard card={warPlayerCard || undefined} color="#22c55e" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Result banner */}
                <AnimatePresence>
                  {result && phase === 'result' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="rounded-xl px-8 py-4 text-center w-full"
                      style={{
                        background: lastProfit !== null && lastProfit > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1.5px solid ${lastProfit !== null && lastProfit > 0 ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
                        boxShadow: lastProfit !== null && lastProfit > 0 ? '0 0 24px rgba(34,197,94,0.2)' : '0 0 24px rgba(239,68,68,0.2)'
                      }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>{result}</p>
                      {lastProfit !== null && (
                        <p className="text-3xl font-black" style={{ color: lastProfit > 0 ? '#22c55e' : '#ef4444' }}>
                          {lastProfit > 0 ? `+$${lastProfit.toFixed(2)}` : `-$${Math.abs(lastProfit).toFixed(2)}`}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div className="flex gap-4 w-full">
                  {phase === 'betting' && (
                    <button onClick={startRound} disabled={balance < betAmount}
                      className="flex-1 py-4 rounded-xl font-black text-base transition-all disabled:opacity-40"
                      style={{ background: `linear-gradient(135deg, ${accentColor}, #b91c1c)`, color: '#fff', boxShadow: `0 0 28px ${accentColor}55` }}>
                      DEAL — ${betAmount}
                    </button>
                  )}
                  {phase === 'dealt' && (
                    <>
                      <button onClick={surrender}
                        className="flex-1 py-4 rounded-xl font-black text-sm transition-all"
                        style={{ background: 'rgba(100,116,139,0.15)', border: '2px solid rgba(100,116,139,0.3)', color: '#94a3b8' }}>
                        SURRENDER<br />
                        <span className="text-xs opacity-70">Lose ${(betAmount / 2).toFixed(2)}</span>
                      </button>
                      <button onClick={goToWar} disabled={balance < betAmount}
                        className="flex-1 py-4 rounded-xl font-black text-base transition-all disabled:opacity-40"
                        style={{ background: `linear-gradient(135deg, ${accentColor}, #b91c1c)`, color: '#fff', boxShadow: `0 0 28px ${accentColor}55` }}>
                        <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 0.9 }} style={{ display: 'block' }}>
                          GO TO WAR!
                        </motion.span>
                        <span className="text-xs opacity-80">+${betAmount} bet</span>
                      </button>
                    </>
                  )}
                  {phase === 'result' && (
                    <button onClick={reset}
                      className="flex-1 py-4 rounded-xl font-black text-base transition-all"
                      style={{ background: `linear-gradient(135deg, ${accentColor}, #b91c1c)`, color: '#fff', boxShadow: `0 0 28px ${accentColor}55` }}>
                      NEW ROUND
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 lg:px-6 mt-6">
          <GameRules gameId="casino-war" />
        </div>
      </div>
    </MainLayout>
  );
}
