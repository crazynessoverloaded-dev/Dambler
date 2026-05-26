import { useState } from "react";
import { Link } from "wouter";
import { Play, Users } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  "Crash Games":      "#00FF88",
  "Card Games":       "#3b82f6",
  "Slot Games":       "#22c55e",
  "Dice Games":       "#f97316",
  "Table Games":      "#06b6d4",
  "Wheel Games":      "#eab308",
  "Luck Games":       "#ec4899",
  "Strategy Games":   "#6366f1",
  "Lottery Games":    "#10b981",
  "Prediction Games": "#f43f5e",
};

// Maps game IDs to their routes.
// Add new games here as you build them.
const GAME_ROUTES: Record<string, string> = {
  plinko: "/plinko",
  dice: "/dice",
  "guess-the-cup": "/guess-the-cup",
  blackjack: "/blackjack",
  slots: "/slots",
  mines: "/mines",
  crash: "/crash",
  hilo: "/hilo",
  keno: "/keno",
  roulette: "/roulette",
  baccarat: "/baccarat",
  "video-poker": "/video-poker",
  "three-card-poker": "/three-card-poker",
  "casino-war": "/casino-war",
  sicbo: "/sicbo",
  craps: "/craps",
  bigsix: "/bigsix",
  "dragon-tiger": "/dragon-tiger",
  "red-dog": "/red-dog",
  "scratch-cards": "/scratch-cards",
  "coinflip": "/coinflip",
  "limbo": "/limbo",
  "tower": "/tower",
  "chuck-a-luck": "/chuck-a-luck",
  "andar-bahar": "/andar-bahar",
  "wheel": "/wheel",
  "pontoon": "/pontoon",
  "caribbean-stud": "/caribbean-stud",
  "casino-holdem": "/casino-holdem",
  "lightning-dice": "/lightning-dice",
  "bingo": "/bingo",
  "rps": "/rps",
  "classic-slots": "/classic-slots",
  "dice-21": "/dice-21",
  "parity": "/parity",
  "dice-duel": "/dice-duel",
  "color-spin": "/color-spin",
  "lucky-7": "/lucky-7",
  "card-flip": "/card-flip",
  "penalty": "/penalty",
  "hot-dice": "/hot-dice",
  "number-match": "/number-match",
  "rapid-roulette": "/rapid-roulette",
  "jackpot-box": "/jackpot-box",
  "slot-joker": "/slot-joker",
};

interface GameCardProps {
  id: string;
  title: string;
  image: string;
  category: string;
  players: number;
  rtp?: string;
  featured?: boolean;
}

/**
 * GameCard
 * Displays a single game with image, stats, and a hover-reveal play button.
 * Links to the game's route; falls back to /game/:id for unknown games.
 */
export default function GameCard({
  id,
  title,
  image,
  category,
  players,
  rtp,
  featured = false,
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const href = GAME_ROUTES[id] ?? `/game/${id}`;
  const catColor = CATEGORY_COLORS[category] ?? "#00FF88";

  return (
    <Link
      href={href}
      className="group block h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative overflow-hidden rounded-xl transition-all duration-300"
        style={{
          aspectRatio: '16 / 9',
          border: isHovered ? `1px solid ${catColor}60` : "1px solid rgba(255,255,255,0.07)",
          boxShadow: isHovered ? `0 0 24px ${catColor}25, 0 8px 32px rgba(0,0,0,0.4)` : "none",
          transform: isHovered ? "scale(1.04) translateY(-2px)" : "none",
        }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
          style={{
            backgroundImage: `url("${image}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        >
          {/* Dark gradient overlay — always full opacity so text is always readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
        </div>

        {/* Card content */}
        <div className="relative h-full flex flex-col justify-between">
          {/* Title & category — solid dark pill so text is never camouflaged */}
          <div className="flex-1 flex flex-col justify-end px-3 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: `${catColor}` }}>{category}</p>
            <h3 className="text-sm font-bold text-white transition-colors line-clamp-2" style={{ color: isHovered ? catColor : '#fff' }}>
              {title}
            </h3>
          </div>

          {/* Stats row */}
          <div className="px-3 pb-3 space-y-1.5" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
            {rtp && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">RTP</span>
                <span className="font-bold" style={{ color: catColor }}>{rtp}%</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{players.toLocaleString()} playing</span>
              </div>

              {isHovered && (
                <div className="flex items-center gap-1 font-bold animate-pulse" style={{ color: catColor }}>
                  <Play className="h-3 w-3" />
                  <span>Play</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}
