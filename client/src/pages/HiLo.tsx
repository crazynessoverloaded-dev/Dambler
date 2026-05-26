import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';
import { ArrowUp, ArrowDown, DollarSign } from 'lucide-react';

// ── Types & logic ──────────────────────────────────────────────────────────────
type Suit = '♠' | '♥' | '♦' | '♣';
type GameState = 'idle' | 'playing' | 'won' | 'lost';

interface Card { value: number; suit: Suit; label: string }

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const LABELS = ['', '', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function randomCard(): Card {
  const value = VALUES[Math.floor(Math.random() * VALUES.length)];
  return { value, suit: SUITS[Math.floor(Math.random() * SUITS.length)], label: LABELS[value] };
}
function isRed(s: Suit) { return s === '♥' || s === '♦'; }

function calcMultiplier(v: number, g: 'higher' | 'lower'): number {
  const hc = VALUES.filter(x => x > v).length;
  const lc = VALUES.filter(x => x < v).length;
  const prob = g === 'higher' ? hc / VALUES.length : lc / VALUES.length;
  if (prob <= 0) return 0;
  return parseFloat(Math.min(0.97 / prob, 50).toFixed(2));
}

interface HistoryEntry { id: string; streak: number; multiplier: number; profit: number; won: boolean }

// ── Card component ─────────────────────────────────────────────────────────────
function CardFace({ card, size = 'md', faded }: { card?: Card | null; size?: 'sm' | 'md' | 'lg'; faded?: boolean }) {
  const dims = size === 'lg' ? 'w-[140px] h-[196px]' : size === 'md' ? 'w-[96px] h-[136px]' : 'w-[68px] h-[96px]';
  const textSm = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-sm' : 'text-xs';
  const textLg = size === 'lg' ? 'text-7xl' : size === 'md' ? 'text-4xl' : 'text-2xl';
  const pad = size === 'lg' ? 'p-4' : 'p-2';

  if (!card) return (
    <div className={`${dims} rounded-2xl flex items-center justify-center`}
      style={{ background: 'rgba(255,255,255,0.0)', border: '2px dashed rgba(22,163,74,0.25)' }}>
      <span className="text-4xl" style={{ opacity: 0.3 }}>🂠</span>
    </div>
  );
  const red = isRed(card.suit);
  return (
    <motion.div
      initial={{ rotateY: 90, scale: 0.8 }} animate={{ rotateY: 0, scale: 1 }} transition={{ duration: 0.35 }}
      className={`${dims} rounded-2xl bg-white flex flex-col justify-between ${pad} shadow-2xl select-none`}
      style={{
        border: `${size === 'lg' ? 3 : 2}px solid ${red ? '#fca5a5' : '#d1d5db'}`,
        opacity: faded ? 0.45 : 1,
        boxShadow: !faded && size === 'lg' ? `0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(22,163,74,0.2)` : undefined,
      }}
    >
      <div className={`${textSm} font-black leading-tight ${red ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.label}</div><div>{card.suit}</div>
      </div>
      <div className={`${textLg} text-center leading-none ${red ? 'text-red-600' : 'text-gray-900'}`}>{card.suit}</div>
      <div className={`${textSm} font-black leading-tight text-right rotate-180 ${red ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.label}</div><div>{card.suit}</div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HiLo() {
  const { balance, balanceRef, setBalance } = useGameWallet('HiLo');
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [prevCard, setPrevCard] = useState<Card | null>(null);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [lastGuess, setLastGuess] = useState<'higher' | 'lower' | null>(null);
  const [resultMessage, setResultMessage] = useState('');

  const startGame = useCallback(() => {
    if (balance < betAmount) return;
    setBalance(b => parseFloat((b - betAmount).toFixed(2)));
    const card = randomCard();
    setCurrentCard(card); setPrevCard(null); setStreak(0); setMultiplier(1);
    setLastProfit(null); setLastGuess(null); setResultMessage(''); setGameState('playing');
  }, [balance, betAmount]);

  const guess = useCallback((dir: 'higher' | 'lower') => {
    if (gameState !== 'playing' || !currentCard) return;
    setLastGuess(dir);
    const next = randomCard();
    const correct = dir === 'higher' ? next.value > currentCard.value : next.value < currentCard.value;
    if (!correct) {
      setPrevCard(currentCard); setCurrentCard(next);
      setResultMessage(`${next.label}${next.suit} — Wrong!`);
      const profit = -betAmount;
      setLastProfit(profit);
      setHistory(h => [{ id: crypto.randomUUID(), streak, multiplier, profit, won: false }, ...h.slice(0, 19)]);
      setGameState('lost'); return;
    }
    const newMult = parseFloat((multiplier * calcMultiplier(currentCard.value, dir)).toFixed(2));
    const newStreak = streak + 1;
    setPrevCard(currentCard); setCurrentCard(next);
    setMultiplier(newMult); setStreak(newStreak);
    setResultMessage(`${next.label}${next.suit} — Correct! ×${newMult}`);
  }, [gameState, currentCard, multiplier, streak, betAmount]);

  const cashOut = useCallback(() => {
    if (gameState !== 'playing' || streak === 0) return;
    const win = parseFloat((betAmount * multiplier).toFixed(2));
    const profit = parseFloat((win - betAmount).toFixed(2));
    setBalance(b => parseFloat((b + win).toFixed(2)));
    setLastProfit(profit);
    setHistory(h => [{ id: crypto.randomUUID(), streak, multiplier, profit, won: true }, ...h.slice(0, 19)]);
    setGameState('won');
  }, [gameState, streak, betAmount, multiplier]);

  const isPlaying = gameState === 'playing';
  const higherMult = currentCard ? calcMultiplier(currentCard.value, 'higher') : 0;
  const lowerMult  = currentCard ? calcMultiplier(currentCard.value, 'lower')  : 0;

  return (
    <MainLayout>
      <section className="py-6 pb-16 min-h-screen relative"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(20,83,45,0.3) 0%, transparent 60%)' }}>
        <div className="max-w-6xl mx-auto px-4 lg:px-6">

          {/* Title */}
          <div className="mb-7 flex items-end justify-between">
            <div>
              <div className="inline-block px-4 py-1 rounded-full text-[10px] font-bold tracking-widest mb-3"
                style={{ background: 'rgba(255,255,255,0.0)', border: '1px solid rgba(255,255,255,0.0)', color: '#86efac' }}>
                ♠ HI-LO ♠
              </div>
              <h1 className="text-5xl font-black tracking-tight"
                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 50%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                HI · LO
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Guess if the next card is higher or lower — build your streak</p>
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
                  {[5, 10, 50, 100, 250, 500].map(a => (
                    <button key={a} onClick={() => setBetAmount(a)} disabled={isPlaying}
                      className="py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
                      style={{
                        background: betAmount === a ? 'rgba(255,255,255,0.0)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${betAmount === a ? 'rgba(22,163,74,0.45)' : 'rgba(255,255,255,0.07)'}`,
                        color: betAmount === a ? '#86efac' : 'rgba(255,255,255,0.5)',
                      }}>
                      ${a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => setBetAmount(b => Math.max(1, Math.floor(b / 2)))} disabled={isPlaying}
                    className="w-10 h-9 rounded-lg text-xs font-bold disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>½</button>
                  <div className="flex-1 text-center py-2 rounded-lg text-sm font-black"
                    style={{ background: 'rgba(255,255,255,0.0)', border: '1px solid rgba(255,255,255,0.0)', color: '#86efac' }}>
                    ${betAmount}
                  </div>
                  <button onClick={() => setBetAmount(b => Math.min(balance, b * 2))} disabled={isPlaying}
                    className="w-10 h-9 rounded-lg text-xs font-bold disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>2×</button>
                </div>
              </div>

              {/* Streak + multiplier + cashout */}
              {isPlaying && streak > 0 && (
                <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.0)', border: '1px solid rgba(255,255,255,0.0)' }}>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Streak</p>
                      <p className="text-2xl font-black text-white">{streak} 🔥</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Multiplier</p>
                      <p className="text-2xl font-black" style={{ color: '#86efac' }}>{multiplier.toFixed(2)}×</p>
                    </div>
                  </div>
                  <button onClick={cashOut}
                    className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', boxShadow: '0 0 20px rgba(255,255,255,0.0)' }}>
                    <DollarSign size={15} /> Cash Out ${(betAmount * multiplier).toFixed(2)}
                  </button>
                </div>
              )}

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

              {/* Deal / play again */}
              {!isPlaying && (
                <button onClick={startGame} disabled={balance < betAmount}
                  className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', boxShadow: '0 0 24px rgba(20,83,45,0.35)' }}>
                  {gameState === 'idle' ? 'DEAL CARD' : 'PLAY AGAIN'}
                </button>
              )}

              {/* History */}
              {history.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>History</p>
                  <div className="space-y-1.5">
                    {history.slice(0, 6).map(h => (
                      <div key={h.id} className="flex justify-between items-center px-2.5 py-1.5 rounded-lg"
                        style={{
                          background: h.won ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                          border: `1px solid ${h.won ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{h.streak} in a row</span>
                        <span className={`text-xs font-black ${h.won ? 'text-green-400' : 'text-red-400'}`}>
                          {h.profit >= 0 ? '+' : ''}${h.profit.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Card area ── */}
            <div className="space-y-4">
              {/* Cards */}
              <div className="rounded-3xl p-8 flex flex-col items-center gap-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', minHeight: 340 }}>
                <div className="flex items-center gap-8 justify-center">
                  {/* Previous card */}
                  <AnimatePresence>
                    {prevCard && (
                      <motion.div key={`${prevCard.label}${prevCard.suit}`}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                        <CardFace card={prevCard} size="sm" faded />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Current card */}
                  <AnimatePresence mode="wait">
                    {currentCard ? (
                      <motion.div key={`${currentCard.label}${currentCard.suit}${streak}`}>
                        <CardFace card={currentCard} size="lg" />
                      </motion.div>
                    ) : (
                      <CardFace card={null} size="lg" />
                    )}
                  </AnimatePresence>

                  {/* Next card face-down */}
                  {isPlaying && (
                    <div className="w-[68px] h-[96px] rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.0)', border: '2px dashed rgba(22,163,74,0.2)' }}>
                      <span style={{ fontSize: 24, opacity: 0.3 }}>?</span>
                    </div>
                  )}
                </div>

                {/* Result message */}
                <AnimatePresence>
                  {resultMessage && (
                    <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="font-black text-base"
                      style={{ color: gameState === 'lost' ? '#f87171' : gameState === 'won' ? '#4ade80' : '#86efac' }}>
                      {resultMessage}
                    </motion.p>
                  )}
                </AnimatePresence>

                {gameState === 'idle' && <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>Place your bet and deal a card to start</p>}
                {gameState === 'won'  && <p className="font-black text-lg" style={{ color: '#4ade80' }}>Cashed out! 💰</p>}
                {gameState === 'lost' && <p className="font-black text-lg" style={{ color: '#f87171' }}>Wrong guess! 💸</p>}
              </div>

              {/* HIGHER / LOWER buttons */}
              {isPlaying && (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => guess('higher')}
                    className="py-6 rounded-2xl font-black text-lg flex flex-col items-center gap-2 transition-all"
                    style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(255,255,255,0.0))', border: '2px solid rgba(34,197,94,0.45)', color: '#4ade80', boxShadow: '0 0 24px rgba(34,197,94,0.2)' }}>
                    <ArrowUp size={28} />
                    HIGHER
                    {higherMult > 0 && <span className="text-sm font-bold opacity-70">{higherMult}×</span>}
                  </button>
                  <button onClick={() => guess('lower')}
                    className="py-6 rounded-2xl font-black text-lg flex flex-col items-center gap-2 transition-all"
                    style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.12))', border: '2px solid rgba(239,68,68,0.45)', color: '#f87171', boxShadow: '0 0 24px rgba(239,68,68,0.2)' }}>
                    <ArrowDown size={28} />
                    LOWER
                    {lowerMult > 0 && <span className="text-sm font-bold opacity-70">{lowerMult}×</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <GameRules gameId="hilo" />
      </section>
    </MainLayout>
  );
}


