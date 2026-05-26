import { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface Win { id: number | string; user: string; game: string; multiplier: string; amount: string }

const GAMES = ['Crash', 'Plinko', 'Blackjack', 'Baccarat', 'Mines', 'Roulette', 'Video Poker', 'Dragon Tiger', 'Sic Bo', 'Hi-Lo', 'Craps', 'Slots'];
const PREFIXES = ['Player', 'User', 'Lucky', 'Crypto', 'High'];
const SUFFIXES = ['***', '##', '...'];

function randomUser() {
  return PREFIXES[Math.floor(Math.random() * PREFIXES.length)] +
    Math.floor(Math.random() * 9000 + 1000) +
    SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
}

function randomWin(): Win {
  const amount = (Math.random() * 4900 + 100).toFixed(2);
  const multiplier = (Math.random() * 18 + 1.2).toFixed(2);
  return {
    id: Date.now() + Math.random(),
    user: randomUser(),
    game: GAMES[Math.floor(Math.random() * GAMES.length)],
    multiplier,
    amount,
  };
}

function toWin(raw: { id: number; username: string; amount: number; game: string | null }): Win {
  const multiplier = (Math.random() * 8 + 1.2).toFixed(2);
  return {
    id: `real-${raw.id}`,
    user: raw.username,
    game: raw.game ?? 'Casino',
    multiplier,
    amount: raw.amount.toFixed(2),
  };
}

const INITIAL: Win[] = Array.from({ length: 8 }, randomWin);

export default function BigWinsTicker() {
  const [wins, setWins] = useState<Win[]>(INITIAL);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch real wins and inject them into the rotation
  const { data: realWins } = trpc.wallet.recentWins.useQuery(undefined, {
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!realWins || realWins.length === 0) return;
    const converted = realWins.map(toWin);
    setWins(prev => {
      // Merge real wins at the front, de-duplicate by id, cap at 20
      const merged = [...converted, ...prev.filter(w => !String(w.id).startsWith('real-'))];
      return merged.slice(0, 20);
    });
  }, [realWins]);

  // Add a generated win every 3–6 seconds to fill gaps
  useEffect(() => {
    const schedule = () => {
      const delay = 3000 + Math.random() * 3000;
      return setTimeout(() => {
        const w = randomWin();
        setWins(prev => [w, ...prev.slice(0, 19)]);
        timerRef.current = schedule();
      }, delay);
    };
    const timerRef = { current: schedule() };
    return () => clearTimeout(timerRef.current);
  }, []);

  // Scroll the ticker
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let frame: number;
    let pos = 0;
    const animate = () => {
      pos += 0.4;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const displayWins = [...wins, ...wins];

  return (
    <div className="w-full border-y border-accent/15 bg-background/40 backdrop-blur-sm flex items-stretch relative">
      <div className="flex-shrink-0 flex items-center px-3 border-r border-accent/20 bg-background z-10" style={{ background: 'var(--background)' }}>
        <span className="text-xs font-bold text-accent flex items-center gap-1 whitespace-nowrap py-2">
          <Zap className="h-3 w-3" />BIG WINS
        </span>
      </div>

      <div className="flex-1 overflow-hidden relative py-2">
        <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div ref={containerRef} className="flex items-center gap-6 overflow-hidden cursor-default" style={{ scrollbarWidth: 'none' }}>
          {displayWins.map((w, i) => (
            <div key={`${w.id}-${i}`} className="flex items-center gap-2 flex-shrink-0 text-xs">
              <span className={String(w.id).startsWith('real-') ? 'text-accent font-semibold' : 'text-muted-foreground'}>{w.user}</span>
              <span className="text-foreground font-semibold">won</span>
              <span className="text-accent font-bold">${w.amount}</span>
              <span className="text-muted-foreground">on</span>
              <span className="text-foreground font-semibold">{w.game}</span>
              <span className="px-1.5 py-0.5 rounded bg-accent/15 text-accent text-[10px] font-bold">{w.multiplier}×</span>
              <span className="text-border">|</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
