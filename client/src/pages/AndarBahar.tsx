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

function makeDeck(): Card[] { return SUITS.flatMap(s => RANKS.map(r => ({ suit: s, rank: r }))); }
function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

function CardFace({ card, size = 'md' }: { card: Card; size?: 'sm' | 'md' | 'lg' }) {
  const red = isRed(card);
  const dims = size === 'sm' ? 'w-[44px] h-[62px]' : size === 'lg' ? 'w-[90px] h-[126px]' : 'w-[62px] h-[88px]';
  const rankSz = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-base' : 'text-xs';
  const suitSz = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-3xl' : 'text-xl';
  const color = red ? '#ef4444' : '#0f172a';
  return (
    <div className={`${dims} rounded-lg bg-white flex flex-col items-center justify-between p-1 select-none`}
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.08)' }}>
      <span className={`${rankSz} font-black leading-none self-start`} style={{ color }}>{card.rank}</span>
      <span className={`${suitSz} leading-none`} style={{ color }}>{card.suit}</span>
      <span className={`${rankSz} font-black leading-none self-end rotate-180`} style={{ color }}>{card.rank}</span>
    </div>
  );
}

type Phase = 'betting' | 'dealing' | 'result';

export default function AndarBahar() {
  const { balance, balanceRef, setBalance } = useGameWallet('AndarBahar');
  const [bet, setBet] = useState(10);
  const [side, setSide] = useState<'andar' | 'bahar' | null>(null);
  const [joker, setJoker] = useState<Card | null>(null);
  const [andar, setAndar] = useState<Card[]>([]);
  const [bahar, setBahar] = useState<Card[]>([]);
  const [phase, setPhase] = useState<Phase>('betting');
  const [winner, setWinner] = useState<'andar' | 'bahar' | null>(null);
  const [profit, setProfit] = useState(0);

  const deal = async () => {
    if (!side || bet > balance || phase !== 'betting') return;
    setPhase('dealing');
    const deck = shuffle(makeDeck());
    const jokerCard = deck[0];
    setJoker(jokerCard);
    const rest = deck.slice(1);

    const andarCards: Card[] = [];
    const baharCards: Card[] = [];
    let winSide: 'andar' | 'bahar' | null = null;
    let idx = 0;

    while (idx < rest.length) {
      const card = rest[idx++];
      andarCards.push(card);
      if (card.rank === jokerCard.rank) { winSide = 'andar'; break; }
      if (idx >= rest.length) break;
      const card2 = rest[idx++];
      baharCards.push(card2);
      if (card2.rank === jokerCard.rank) { winSide = 'bahar'; break; }
    }

    const stepDelay = Math.max(120, 1200 / Math.max(andarCards.length + baharCards.length, 1));
    const totalA = [...andarCards];
    const totalB = [...baharCards];
    setAndar([]);
    setBahar([]);

    let ai = 0, bi = 0;
    const animInterval = setInterval(() => {
      let changed = false;
      if (ai < totalA.length) { setAndar(prev => [...prev, totalA[ai++]]); changed = true; }
      if (bi < totalB.length) { setBahar(prev => [...prev, totalB[bi++]]); changed = true; }
      if (!changed || (ai >= totalA.length && bi >= totalB.length)) {
        clearInterval(animInterval);
        const won = winSide === side;
        const payout = winSide === 'andar' ? 0.9 : 1;
        const p = won ? +(bet * payout).toFixed(2) : -bet;
        setBalance(prev => +(prev + p).toFixed(2));
        setWinner(winSide);
        setProfit(p);
        setPhase('result');
      }
    }, stepDelay);
  };

  const reset = () => {
    setPhase('betting');
    setSide(null);
    setJoker(null);
    setAndar([]);
    setBahar([]);
    setWinner(null);
  };

  // Ambient theme colors
  const inColor = '#06b6d4';   // teal — IN (Andar)
  const outColor = '#f59e0b';  // amber — OUT (Bahar)

  return (
    <MainLayout>
      <div className="min-h-screen py-8 pb-16 relative" style={{
        background: 'radial-gradient(ellipse at 20% 0%, rgba(6,182,212,0.2) 0%, transparent 55%), radial-gradient(ellipse at 80% 0%, rgba(245,158,11,0.2) 0%, transparent 55%), var(--background)'
      }}>
        <div className="max-w-6xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 text-xs font-bold tracking-widest uppercase overflow-hidden relative" style={{ borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.07)', color: inColor }}>
                <motion.span animate={{ x: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>⬅</motion.span>
                ANDAR BAHAR
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>➡</motion.span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1" style={{
                background: `linear-gradient(135deg, ${inColor} 0%, #4ade80 45%, ${outColor} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>In or Out</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>A joker is drawn — bet which side a matching rank will land first.</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">

            {/* ── Controls ── */}
            <div className="rounded-2xl border p-5 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>

              {/* Side select */}
              <div>
                <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Choose Side</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['andar', 'bahar'] as const).map(s => {
                    const col = s === 'andar' ? inColor : outColor;
                    const active = side === s;
                    return (
                      <button key={s} onClick={() => phase === 'betting' && setSide(s)}
                        className="py-3 rounded-xl font-black text-sm transition-all"
                        style={{
                          border: `2px solid ${active ? col : 'rgba(255,255,255,0.1)'}`,
                          background: active ? `${col}22` : 'transparent',
                          color: active ? col : 'var(--muted-foreground)',
                          boxShadow: active ? `0 0 14px ${col}44` : 'none'
                        }}>
                        {s === 'andar' ? '⬅ IN' : 'OUT ➡'}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-center mt-1.5" style={{ color: 'var(--muted-foreground)' }}>IN: 0.9:1 · OUT: 1:1</p>
              </div>

              {/* Bet chips */}
              <div>
                <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Bet Amount</p>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {CHIPS.map(c => (
                    <button key={c} onClick={() => phase === 'betting' && setBet(c)}
                      className="py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        border: `1.5px solid ${bet === c ? inColor : 'rgba(255,255,255,0.1)'}`,
                        background: bet === c ? `${inColor}22` : 'transparent',
                        color: bet === c ? inColor : 'var(--muted-foreground)'
                      }}>
                      ${c}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setBet(p => Math.max(1, Math.floor(p / 2)))}
                    className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }}>½</button>
                  <div className="flex-1 rounded-lg px-3 py-2 text-sm font-black text-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--foreground)' }}>
                    ${bet}
                  </div>
                  <button onClick={() => setBet(p => Math.min(balance, p * 2))}
                    className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ border: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }}>2×</button>
                </div>
              </div>

              {/* Action button */}
              {phase === 'betting' ? (
                <button onClick={deal} disabled={!side || bet > balance}
                  className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40"
                  style={{
                    background: `linear-gradient(135deg, ${inColor}, #0891b2)`,
                    color: '#000',
                    boxShadow: `0 0 20px ${inColor}55`
                  }}>
                  Deal Cards
                </button>
              ) : phase === 'result' ? (
                <button onClick={reset}
                  className="w-full py-3 rounded-xl font-black text-sm transition-all"
                  style={{ background: `linear-gradient(135deg, ${inColor}, #0891b2)`, color: '#000', boxShadow: `0 0 20px ${inColor}55` }}>
                  New Round
                </button>
              ) : (
                <button disabled
                  className="w-full py-3 rounded-xl font-black text-sm opacity-50 cursor-not-allowed"
                  style={{ background: `${inColor}44`, color: inColor }}>
                  Dealing…
                </button>
              )}
            </div>

            {/* ── Table ── */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(170deg, #050d14 0%, #020a10 100%)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="p-6 space-y-6">

                {/* Joker card */}
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--muted-foreground)' }}>Joker Card</p>
                  {joker ? (
                    <motion.div initial={{ scale: 0, rotateY: 180 }} animate={{ scale: 1, rotateY: 0 }} transition={{ type: 'spring', stiffness: 200 }}
                      style={{ filter: `drop-shadow(0 0 18px rgba(245,158,11,0.6))` }}>
                      <CardFace card={joker} size="lg" />
                    </motion.div>
                  ) : (
                    <div className="w-[90px] h-[126px] rounded-xl border-2 border-dashed flex items-center justify-center text-4xl"
                      style={{ borderColor: 'rgba(245,158,11,0.3)', color: 'rgba(245,158,11,0.3)' }}>?</div>
                  )}
                  {joker && (
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Match rank <span className="font-black" style={{ color: outColor }}>{joker.rank}</span> to win
                    </p>
                  )}
                </div>

                {/* IN / OUT lanes */}
                <div className="grid grid-cols-2 gap-4">
                  {(['andar', 'bahar'] as const).map(s => {
                    const col = s === 'andar' ? inColor : outColor;
                    const cards = s === 'andar' ? andar : bahar;
                    const isWinner = winner === s;
                    const isMine = side === s;
                    return (
                      <div key={s} className="rounded-xl p-3 min-h-[180px] flex flex-col gap-2 transition-all"
                        style={{
                          background: isWinner ? `${col}15` : isMine ? `${col}08` : 'rgba(255,255,255,0.03)',
                          border: `2px solid ${isWinner ? col : isMine ? `${col}55` : 'rgba(255,255,255,0.07)'}`,
                          boxShadow: isWinner ? `0 0 28px ${col}44` : 'none'
                        }}>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black uppercase tracking-wider" style={{ color: isMine || isWinner ? col : 'var(--muted-foreground)' }}>
                            {s === 'andar' ? '⬅ IN' : 'OUT ➡'}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {isMine && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${col}22`, color: col }}>YOUR BET</span>
                            )}
                            {isWinner && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${col}33`, color: col }}>WINNER ✓</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-start">
                          {cards.map((card, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: -12, rotateY: 90 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 22, delay: i * 0.18 }}>
                              <CardFace card={card} size="sm" />
                            </motion.div>
                          ))}
                          {cards.length === 0 && phase === 'betting' && (
                            <p className="text-[11px] mt-auto" style={{ color: 'rgba(255,255,255,0.2)' }}>Cards will appear here</p>
                          )}
                        </div>
                        <p className="text-xs mt-auto" style={{ color: 'var(--muted-foreground)' }}>
                          {cards.length} card{cards.length !== 1 ? 's' : ''} dealt · {s === 'andar' ? '0.9:1' : '1:1'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Result banner */}
                <AnimatePresence>
                  {phase === 'result' && winner && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="rounded-xl p-4 text-center space-y-1"
                      style={{
                        background: profit > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1.5px solid ${profit > 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                        boxShadow: profit > 0 ? '0 0 24px rgba(34,197,94,0.25)' : '0 0 24px rgba(239,68,68,0.25)'
                      }}>
                      <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                        {winner === 'andar' ? 'IN wins!' : 'OUT wins!'} {winner === side ? '🎉 You called it!' : 'Better luck next round'}
                      </p>
                      <p className="text-3xl font-black" style={{ color: profit > 0 ? '#22c55e' : '#ef4444' }}>
                        {profit > 0 ? `+$${profit}` : `-$${Math.abs(profit)}`}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {phase === 'betting' && !joker && (
                  <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Choose your side and deal to begin</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <GameRules gameId="andar-bahar" />
      </div>
    </MainLayout>
  );
}
