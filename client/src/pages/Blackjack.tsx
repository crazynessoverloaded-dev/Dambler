import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';
import { RotateCcw } from 'lucide-react';

// ── Types & logic ──────────────────────────────────────────────────────────────
interface Card { suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'; rank: string; value: number }
interface GameResult { id: string; bet: number; result: 'win' | 'loss' | 'push'; playerTotal: number; dealerTotal: number; winAmount: number }

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_SYM: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

const getRankValue = (r: string) => ['K','Q','J'].includes(r) ? 10 : r === 'A' ? 11 : parseInt(r);
const createDeck = (): Card[] =>
  SUITS.flatMap(s => RANKS.map(r => ({ suit: s, rank: r, value: getRankValue(r) }))).sort(() => Math.random() - 0.5);

const calcHand = (hand: Card[]): { value: number; aces: number } => {
  let value = 0, aces = 0;
  for (const c of hand) { if (c.rank === 'A') { aces++; value += 11; } else value += c.value; }
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  return { value, aces };
};

// ── Card component ─────────────────────────────────────────────────────────────
function CardFace({ card, hidden, delay = 0 }: { card?: Card; hidden?: boolean; delay?: number }) {
  if (hidden || !card) return (
    <div className="w-[68px] h-[96px] rounded-xl flex items-center justify-center shadow-lg"
      style={{ background: 'linear-gradient(135deg, #0d2a18, #071a0c)', border: '2px solid rgba(255,255,255,0.1)' }}>
      <span style={{ fontSize: 28, opacity: 0.25 }}>?</span>
    </div>
  );
  const red = card.suit === 'hearts' || card.suit === 'diamonds';
  const sym = SUIT_SYM[card.suit];
  return (
    <motion.div
      initial={{ rotateY: 90, scale: 0.8 }} animate={{ rotateY: 0, scale: 1 }} transition={{ duration: 0.35, delay }}
      className="w-[68px] h-[96px] rounded-xl bg-white flex flex-col justify-between p-1.5 shadow-2xl select-none"
      style={{ border: `2px solid ${red ? '#fca5a5' : '#d1d5db'}` }}
    >
      <div className={`text-xs font-black leading-tight ${red ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.rank}</div><div>{sym}</div>
      </div>
      <div className={`text-2xl text-center leading-none ${red ? 'text-red-600' : 'text-gray-900'}`}>{sym}</div>
      <div className={`text-xs font-black leading-tight text-right rotate-180 ${red ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.rank}</div><div>{sym}</div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Blackjack() {
  const { balance, balanceRef, setBalance } = useGameWallet('Blackjack');
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'result'>('betting');
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>(createDeck());
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [isDealing, setIsDealing] = useState(false);

  const playerValue = calcHand(playerHand);
  const dealerValue = calcHand(dealerHand);

  const startGame = async () => {
    if (betAmount > balance || isDealing) return;
    setIsDealing(true); setGameState('playing'); setResult(''); setWinAmount(0);
    const newDeck = deck.length < 20 ? createDeck() : [...deck];
    const pH: Card[] = [], dH: Card[] = [];
    await new Promise(r => setTimeout(r, 200));
    pH.push(newDeck.pop()!); setPlayerHand([...pH]);
    await new Promise(r => setTimeout(r, 250));
    dH.push(newDeck.pop()!); setDealerHand([...dH]);
    await new Promise(r => setTimeout(r, 250));
    pH.push(newDeck.pop()!); setPlayerHand([...pH]);
    await new Promise(r => setTimeout(r, 250));
    dH.push(newDeck.pop()!); setDealerHand([...dH]);
    setDeck(newDeck); setBalance(b => b - betAmount); setIsDealing(false);
    // Auto-resolve if either side has natural blackjack
    if (calcHand(pH).value === 21 || calcHand(dH).value === 21) {
      await new Promise(r => setTimeout(r, 400));
      endGame(pH, dH, 'compare');
    }
  };

  const hit = async () => {
    if (isDealing) return; setIsDealing(true);
    const newDeck = [...deck], newCard = newDeck.pop()!;
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand); setDeck(newDeck);
    if (calcHand(newHand).value > 21) { await new Promise(r => setTimeout(r, 600)); endGame(newHand, dealerHand, 'loss'); }
    setIsDealing(false);
  };

  const stand = async () => {
    if (isDealing) return; setIsDealing(true);
    let dHand = [...dealerHand], newDeck = [...deck];
    let dVal = calcHand(dHand);
    while (dVal.value < 17 && newDeck.length > 0) {
      await new Promise(r => setTimeout(r, 500));
      dHand.push(newDeck.pop()!); setDealerHand([...dHand]); dVal = calcHand(dHand);
    }
    setDeck(newDeck); await new Promise(r => setTimeout(r, 400));
    endGame(playerHand, dHand, 'compare'); setIsDealing(false);
  };

  const endGame = (pH: Card[], dH: Card[], type: string) => {
    const pV = calcHand(pH).value, dV = calcHand(dH).value;
    const playerBJ = pH.length === 2 && pV === 21;
    const dealerBJ = dH.length === 2 && dV === 21;
    let gameResult: 'win' | 'loss' | 'push' = 'loss', payout = 0, msg = '';
    if (playerBJ && dealerBJ) { gameResult = 'push'; msg = 'Both Blackjack — Push!'; payout = betAmount; }
    else if (playerBJ) { gameResult = 'win'; msg = '★ Blackjack! Pays 3:2'; payout = betAmount * 2.5; }
    else if (dealerBJ) { msg = 'Dealer Blackjack'; }
    else if (type === 'loss' || pV > 21) { msg = 'Bust! Over 21'; }
    else if (dV > 21) { gameResult = 'win'; msg = 'Dealer Bust! You Win!'; payout = betAmount * 2; }
    else if (pV > dV) { gameResult = 'win'; msg = 'You Win!'; payout = betAmount * 2; }
    else if (pV < dV) { msg = 'Dealer Wins'; }
    else { gameResult = 'push'; msg = 'Push — Tie!'; payout = betAmount; }
    setResult(msg); setWinAmount(payout); setBalance(b => b + payout); setGameState('result');
    setHistory(p => [{ id: Date.now().toString(), bet: betAmount, result: gameResult, playerTotal: pV, dealerTotal: dV, winAmount: payout - betAmount }, ...p].slice(0, 10));
  };

  const reset = () => { setGameState('betting'); setPlayerHand([]); setDealerHand([]); setResult(''); setWinAmount(0); };

  const isWin = result.includes('Win'), isPush = result.includes('Push');
  const resultColor = isWin ? '#22c55e' : isPush ? '#f59e0b' : '#ef4444';

  return (
    <MainLayout>
      <section className="py-6 pb-16 min-h-screen relative"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(22,101,52,0.32) 0%, transparent 60%)' }}>
        <div className="max-w-6xl mx-auto px-4 lg:px-6">

          {/* Title */}
          <div className="mb-7 flex items-end justify-between">
            <div>
              <div className="inline-block px-4 py-1 rounded-full text-[10px] font-bold tracking-widest mb-3"
                style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.22)', color: '#fcd34d' }}>
                ♠ BLACKJACK ♠
              </div>
              <h1 className="text-5xl font-black tracking-tight"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fef08a 45%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                BLACKJACK
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Beat the dealer · Blackjack pays 3:2</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_210px] gap-5">

            {/* ── Left: Controls ── */}
            <div className="space-y-3">

              <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Bet Amount</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[5, 10, 25, 50, 100, 200].map(a => (
                    <button key={a} onClick={() => setBetAmount(a)} disabled={gameState !== 'betting' || a > balance}
                      className="py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
                      style={{
                        background: betAmount === a ? 'rgba(234,179,8,0.18)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${betAmount === a ? 'rgba(234,179,8,0.45)' : 'rgba(255,255,255,0.07)'}`,
                        color: betAmount === a ? '#fcd34d' : 'rgba(255,255,255,0.5)',
                      }}>
                      ${a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => setBetAmount(b => Math.max(1, Math.floor(b / 2)))} disabled={gameState !== 'betting'}
                    className="w-10 h-9 rounded-lg text-xs font-bold disabled:opacity-30 flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>½</button>
                  <div className="flex-1 text-center py-2 rounded-lg text-sm font-black"
                    style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.18)', color: '#fcd34d' }}>
                    ${betAmount}
                  </div>
                  <button onClick={() => setBetAmount(b => Math.min(balance, b * 2))} disabled={gameState !== 'betting'}
                    className="w-10 h-9 rounded-lg text-xs font-bold disabled:opacity-30 flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>2×</button>
                </div>
              </div>

              {gameState === 'betting' && (
                <button onClick={startGame} disabled={betAmount > balance || betAmount <= 0}
                  className="w-full py-4 rounded-2xl font-black text-base tracking-wide disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #ca8a04, #b45309)', color: '#fef9c3', boxShadow: '0 0 24px rgba(202,138,4,0.3)' }}>
                  DEAL
                </button>
              )}
              {gameState === 'playing' && (
                <div className="space-y-2">
                  <button onClick={hit} disabled={isDealing}
                    className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', boxShadow: '0 0 20px rgba(255,255,255,0.0)' }}>
                    HIT
                  </button>
                  <button onClick={stand} disabled={isDealing}
                    className="w-full py-3 rounded-2xl font-black text-sm disabled:opacity-40 transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.35)', color: '#f87171' }}>
                    STAND
                  </button>
                </div>
              )}
              {gameState === 'result' && (
                <button onClick={reset}
                  className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                  style={{ background: 'linear-gradient(135deg, #ca8a04, #b45309)', color: '#fef9c3' }}>
                  <RotateCcw size={15} /> PLAY AGAIN
                </button>
              )}
            </div>

            {/* ── Center: Felt table ── */}
            <div className="rounded-3xl overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.07)' }}>
              <div className="px-6 py-8 min-h-[480px] flex flex-col relative" style={{ background: 'linear-gradient(170deg, #0b2410 0%, #071509 100%)' }}>
                {/* Decorative felt lines */}
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="absolute left-1/2 -translate-x-1/2 inset-y-10 w-px" style={{ background: 'rgba(255,255,255,0.03)' }} />

                {/* Dealer zone */}
                <div className="flex-1 flex flex-col items-center justify-center pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: 'rgba(255,255,255,0.3)' }}>Dealer</p>
                  <div className="flex gap-3 justify-center flex-wrap mb-4">
                    {gameState === 'betting'
                      ? <><CardFace hidden /><CardFace hidden /></>
                      : dealerHand.map((c, i) => <CardFace key={i} card={c} hidden={gameState === 'playing' && i === 1} delay={i * 0.2} />)
                    }
                  </div>
                  {gameState !== 'betting' && dealerHand.length > 0 && (
                    <div className="px-4 py-1.5 rounded-full text-sm font-black"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
                      {gameState === 'playing' ? `${calcHand([dealerHand[0]]).value} + ?` : dealerValue.value}
                    </div>
                  )}
                </div>

                {/* Divider + result */}
                <div className="relative flex items-center justify-center py-3">
                  <div className="absolute inset-x-0 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <AnimatePresence mode="wait">
                    {gameState === 'result' ? (
                      <motion.div key="r" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="relative z-10 px-6 py-2 rounded-full font-black text-sm"
                        style={{ background: `${resultColor}18`, border: `1px solid ${resultColor}50`, color: resultColor }}>
                        {result}
                        {isWin && winAmount > betAmount && <span className="ml-2 opacity-70">+${(winAmount - betAmount).toFixed(2)}</span>}
                      </motion.div>
                    ) : (
                      <div className="relative z-10 px-4 py-1 rounded-full text-[10px] font-bold"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)' }}>
                        vs
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Player zone */}
                <div className="flex-1 flex flex-col items-center justify-center pt-4">
                  <div className="flex gap-3 justify-center flex-wrap mb-4">
                    {gameState === 'betting'
                      ? <><CardFace hidden /><CardFace hidden /></>
                      : playerHand.map((c, i) => <CardFace key={i} card={c} delay={i * 0.2} />)
                    }
                  </div>
                  {gameState !== 'betting' && (
                    <div className="px-4 py-1.5 rounded-full text-sm font-black"
                      style={{
                        background: playerValue.value > 21 ? 'rgba(239,68,68,0.15)' : playerValue.value === 21 ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.07)',
                        color: playerValue.value > 21 ? '#f87171' : playerValue.value === 21 ? '#fcd34d' : 'rgba(255,255,255,0.65)',
                      }}>
                      {playerValue.value}
                      {playerValue.aces > 0 && playerValue.value < 21 && <span className="text-xs ml-1 opacity-50">soft</span>}
                    </div>
                  )}
                  {gameState === 'betting' && <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Place your bet to start</p>}
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-5" style={{ color: 'rgba(255,255,255,0.3)' }}>You</p>
                </div>
              </div>
            </div>

            {/* ── Right: History ── */}
            <div className="rounded-2xl p-4 max-h-[500px] overflow-y-auto space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>History</p>
              {history.length === 0
                ? <p className="text-xs text-center py-10" style={{ color: 'rgba(255,255,255,0.18)' }}>No results yet</p>
                : history.map(g => (
                  <motion.div key={g.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    className="p-2.5 rounded-xl"
                    style={{
                      background: g.result === 'win' ? 'rgba(34,197,94,0.07)' : g.result === 'loss' ? 'rgba(239,68,68,0.07)' : 'rgba(234,179,8,0.07)',
                      border: `1px solid ${g.result === 'win' ? 'rgba(34,197,94,0.22)' : g.result === 'loss' ? 'rgba(239,68,68,0.18)' : 'rgba(234,179,8,0.18)'}`,
                    }}>
                    <div className="flex justify-between">
                      <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>${g.bet}</span>
                      <span className={`text-xs font-black ${g.result === 'win' ? 'text-green-400' : g.result === 'loss' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {g.result === 'win' ? `+$${g.winAmount.toFixed(2)}` : g.result === 'loss' ? `-$${g.bet.toFixed(2)}` : 'Push'}
                      </span>
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{g.playerTotal} vs {g.dealerTotal}</p>
                  </motion.div>
                ))
              }
            </div>
          </div>
        </div>
        <GameRules gameId="blackjack" />
      </section>
    </MainLayout>
  );
}

