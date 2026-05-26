import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';

// ── Types & logic ──────────────────────────────────────────────────────────────
type Suit = '♠' | '♥' | '♦' | '♣';
interface Card { value: number; suit: Suit; label: string }
type BetSide = 'dragon' | 'tiger' | 'tie' | null;
type Phase = 'betting' | 'dealing' | 'result';

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function randomCard(): Card {
  const v = Math.ceil(Math.random() * 13);
  return { value: v, suit: SUITS[Math.floor(Math.random() * 4)], label: LABELS[v] };
}
function isRed(s: Suit) { return s === '♥' || s === '♦'; }

// ── Card component ─────────────────────────────────────────────────────────────
function BigCard({ card, placeholder, accentColor }: { card?: Card | null; placeholder?: boolean; accentColor: string }) {
  if (placeholder || !card) return (
    <div className="w-[120px] h-[168px] rounded-2xl flex items-center justify-center"
      style={{ background: `${accentColor}08`, border: `2px dashed ${accentColor}30` }}>
      <span style={{ fontSize: 40, opacity: 0.2 }}>?</span>
    </div>
  );
  const red = isRed(card.suit);
  return (
    <motion.div
      initial={{ rotateY: 90, scale: 0.7, y: -20 }}
      animate={{ rotateY: 0, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
      className="w-[120px] h-[168px] rounded-2xl bg-white flex flex-col justify-between p-3 shadow-2xl select-none"
      style={{ border: `3px solid ${red ? '#fca5a5' : '#d1d5db'}`, boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 30px ${accentColor}30` }}
    >
      <div className={`text-lg font-black leading-tight ${red ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.label}</div><div>{card.suit}</div>
      </div>
      <div className={`text-5xl text-center leading-none ${red ? 'text-red-600' : 'text-gray-900'}`}>{card.suit}</div>
      <div className={`text-lg font-black leading-tight text-right rotate-180 ${red ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.label}</div><div>{card.suit}</div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DragonTiger() {
  const { balance, balanceRef, setBalance } = useGameWallet('DragonTiger');
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBet, setSelectedBet] = useState<BetSide>(null);
  const [phase, setPhase] = useState<Phase>('betting');
  const [dragon, setDragon] = useState<Card | null>(null);
  const [tiger, setTiger] = useState<Card | null>(null);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [winner, setWinner] = useState<BetSide>(null);
  const [history, setHistory] = useState<{ side: string; profit: number }[]>([]);

  const deal = useCallback(async () => {
    if (!selectedBet || balance < betAmount) return;
    setBalance(b => parseFloat((b - betAmount).toFixed(2)));
    setPhase('dealing'); setDragon(null); setTiger(null); setWinner(null); setLastProfit(null);
    await new Promise(r => setTimeout(r, 300));
    const d = randomCard(); setDragon(d);
    await new Promise(r => setTimeout(r, 500));
    const t = randomCard(); setTiger(t);
    await new Promise(r => setTimeout(r, 600));
    let result: BetSide = d.value > t.value ? 'dragon' : t.value > d.value ? 'tiger' : 'tie';
    setWinner(result);
    let profit = -betAmount;
    if (selectedBet === result) {
      if (result === 'tie') { const win = betAmount * 8; setBalance(b => parseFloat((b + betAmount + win).toFixed(2))); profit = win; }
      else { setBalance(b => parseFloat((b + betAmount * 2).toFixed(2))); profit = betAmount; }
    } else if (result === 'tie' && selectedBet !== 'tie') {
      const half = parseFloat((betAmount / 2).toFixed(2));
      setBalance(b => parseFloat((b + half).toFixed(2))); profit = -half;
    }
    setLastProfit(profit);
    setHistory(h => [{ side: result!, profit }, ...h.slice(0, 14)]);
    setPhase('result');
  }, [selectedBet, balance, betAmount]);

  const reset = () => { setPhase('betting'); setDragon(null); setTiger(null); setWinner(null); setLastProfit(null); };

  const BET_OPTIONS = [
    { side: 'dragon' as BetSide, label: '🐉 DRAGON', odds: '1:1', color: '#3b82f6', glow: 'rgba(59,130,246,0.35)', bg: 'rgba(59,130,246,0.12)' },
    { side: 'tie'    as BetSide, label: '⚡ TIE',    odds: '8:1', color: '#22c55e', glow: 'rgba(34,197,94,0.35)',  bg: 'rgba(34,197,94,0.12)'  },
    { side: 'tiger'  as BetSide, label: '🐯 TIGER',  odds: '1:1', color: '#f97316', glow: 'rgba(249,115,22,0.35)', bg: 'rgba(249,115,22,0.12)' },
  ];

  const HIST_COLORS = { dragon: '#3b82f6', tiger: '#f97316', tie: '#22c55e' };

  return (
    <MainLayout>
      <section className="py-6 pb-16 min-h-screen relative">
        {/* Dual ambient — blue left, orange right */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 20% 0%, rgba(59,130,246,0.22) 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(249,115,22,0.22) 0%, transparent 50%)',
        }} />
        <div className="max-w-5xl mx-auto px-4 lg:px-6 relative">

          {/* Title */}
          <div className="mb-7 flex items-end justify-between">
            <div>
              <div className="inline-block px-4 py-1 rounded-full text-[10px] font-bold tracking-widest mb-3"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
                🐉 DRAGON TIGER 🐯
              </div>
              <h1 className="text-5xl font-black tracking-tight"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #4ade80 40%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                DRAGON TIGER
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>One card each — higher card wins · Ace is low</p>
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
                  {[5, 10, 25, 50, 100, 250].map(a => (
                    <button key={a} onClick={() => setBetAmount(a)} disabled={phase === 'dealing'}
                      className="py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
                      style={{
                        background: betAmount === a ? 'rgba(134,239,172,0.18)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${betAmount === a ? 'rgba(134,239,172,0.45)' : 'rgba(255,255,255,0.07)'}`,
                        color: betAmount === a ? '#86efac' : 'rgba(255,255,255,0.5)',
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
                    style={{ background: 'rgba(134,239,172,0.07)', border: '1px solid rgba(134,239,172,0.18)', color: '#86efac' }}>
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
                    className="rounded-2xl p-4 text-center font-black text-xl"
                    style={{
                      background: lastProfit >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${lastProfit >= 0 ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.3)'}`,
                      color: lastProfit >= 0 ? '#4ade80' : '#f87171',
                    }}>
                    {lastProfit >= 0 ? '+' : ''}${lastProfit.toFixed(2)}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* History */}
              {history.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>History</p>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((h, i) => (
                      <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                        style={{ background: (HIST_COLORS as any)[h.side] || '#6b7280', boxShadow: `0 0 8px ${(HIST_COLORS as any)[h.side] || '#6b7280'}50` }}>
                        {h.side === 'dragon' ? 'D' : h.side === 'tiger' ? 'T' : 'TIE'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Arena ── */}
            <div className="space-y-4">
              {/* Card arena */}
              <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="p-8 min-h-[320px] flex items-center" style={{ background: 'linear-gradient(170deg, #050d18 0%, #030a0f 100%)' }}>
                  {/* Dragon side */}
                  <div className="flex-1 flex flex-col items-center gap-4">
                    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(59,130,246,0.7)' }}>DRAGON</div>
                    <BigCard card={dragon} placeholder={!dragon} accentColor="#3b82f6" />
                    {dragon && (
                      <div className="text-lg font-black" style={{ color: '#3b82f6' }}>{dragon.label}{dragon.suit}</div>
                    )}
                    <AnimatePresence>
                      {winner === 'dragon' && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          className="px-4 py-1.5 rounded-full text-xs font-black"
                          style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.5)', color: '#93c5fd', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}>
                          WINNER
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* VS */}
                  <div className="flex-shrink-0 flex flex-col items-center px-6">
                    <div className="text-4xl font-black" style={{ color: 'rgba(255,255,255,0.15)' }}>VS</div>
                    <AnimatePresence>
                      {winner === 'tie' && (
                        <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          className="mt-3 px-3 py-1.5 rounded-full text-[10px] font-black"
                          style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.5)', color: '#86efac', boxShadow: '0 0 16px rgba(34,197,94,0.4)' }}>
                          TIE
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Tiger side */}
                  <div className="flex-1 flex flex-col items-center gap-4">
                    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(249,115,22,0.7)' }}>TIGER</div>
                    <BigCard card={tiger} placeholder={!tiger} accentColor="#f97316" />
                    {tiger && (
                      <div className="text-lg font-black" style={{ color: '#f97316' }}>{tiger.label}{tiger.suit}</div>
                    )}
                    <AnimatePresence>
                      {winner === 'tiger' && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          className="px-4 py-1.5 rounded-full text-xs font-black"
                          style={{ background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.5)', color: '#fed7aa', boxShadow: '0 0 20px rgba(249,115,22,0.4)' }}>
                          WINNER
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Bet buttons */}
              <div className="grid grid-cols-3 gap-3">
                {BET_OPTIONS.map(b => {
                  const sel = selectedBet === b.side;
                  return (
                    <button key={b.side!} onClick={() => { if (phase === 'betting') setSelectedBet(b.side); }}
                      disabled={phase === 'dealing'}
                      className="py-5 rounded-2xl font-black text-sm transition-all disabled:opacity-40"
                      style={{
                        background: sel ? b.bg : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${sel ? b.color : 'rgba(255,255,255,0.09)'}`,
                        color: sel ? b.color : 'rgba(255,255,255,0.5)',
                        boxShadow: sel ? `0 0 24px ${b.glow}` : 'none',
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
                  style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)', color: '#fff', boxShadow: '0 0 24px rgba(255,255,255,0.0)' }}>
                  DEAL — ${betAmount}
                </button>
              )}
              {phase === 'dealing' && (
                <div className="w-full py-4 rounded-2xl font-black text-base text-center"
                  style={{ background: 'rgba(255,255,255,0.0)', border: '1px solid rgba(22,163,74,0.2)', color: '#86efac' }}>
                  Dealing...
                </div>
              )}
              {phase === 'result' && (
                <button onClick={reset}
                  className="w-full py-4 rounded-2xl font-black text-base transition-all"
                  style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)', color: '#fff' }}>
                  NEW ROUND
                </button>
              )}
            </div>
          </div>
        </div>
        <GameRules gameId="dragon-tiger" />
      </section>
    </MainLayout>
  );
}


