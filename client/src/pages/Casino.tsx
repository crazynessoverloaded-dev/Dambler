import { useState } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import GameCard from '@/components/GameCard';
import { Search, SlidersHorizontal, Star, Zap, LayoutGrid, CreditCard, Dice5, Table2, RotateCcw, Clover, Brain, Ticket, Target } from 'lucide-react';

const ol: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 };

const ALL_GAMES = [
  { id: 'crash',            title: 'Crash',             category: 'Crash Games',      image: '/Crash gemini.png', players: 4200, rtp: '97.0', featured: true  },
  { id: 'blackjack',        title: 'Blackjack',          category: 'Card Games',       image: '/blackjack gemini.png',           players: 2100, rtp: '99.0', featured: true  },
  { id: 'roulette',         title: 'Roulette',           category: 'Table Games',      image: '/Roulette GEMINI.png',               players: 2800, rtp: '97.3', featured: false },
  { id: 'plinko',           title: 'Plinko',             category: 'Crash Games',      image: '/plinko gemini.png',              players: 1250, rtp: '97.0', featured: true  },
  { id: 'mines',            title: 'Mines',              category: 'Strategy Games',   image: '/mines gemini.png',                  players: 1840, rtp: '97.0', featured: false },
  { id: 'baccarat',         title: 'Baccarat',           category: 'Card Games',       image: '/Baccarat gemini.png',            players: 1650, rtp: '98.9', featured: true  },
  { id: 'dice',             title: 'Dice',               category: 'Dice Games',       image: '/Dice Game gemini.png',                players: 890,  rtp: '97.0', featured: false },
  { id: 'hilo',             title: 'Hi-Lo',              category: 'Card Games',       image: '/Hi-Lo gemini.png',                players: 980,  rtp: '97.0', featured: false },
  { id: 'keno',             title: 'Keno',               category: 'Lottery Games',    image: '/keno gemini.png',                   players: 720,  rtp: '95.0', featured: false },
  { id: 'scratch-cards',    title: 'Scratch Cards',      category: 'Luck Games',       image: '/Scratch cards gemini.png',          players: 1380, rtp: '95.0', featured: false },
  { id: 'video-poker',      title: 'Video Poker',        category: 'Card Games',       image: '/Video Poker gemini.png',         players: 820,  rtp: '99.5', featured: false },
  { id: 'craps',            title: 'Craps',              category: 'Dice Games',       image: '/craps gemini.png',               players: 910,  rtp: '98.6', featured: true  },
  { id: 'sicbo',            title: 'Sic Bo',             category: 'Dice Games',       image: '/SicBo gemini.png',               players: 780,  rtp: '97.2', featured: false },
  { id: 'limbo',            title: 'Limbo',              category: 'Crash Games',      image: '/Limbo gemini.png',               players: 640,  rtp: '97.0', featured: false },
  { id: 'tower',            title: 'Tower',              category: 'Strategy Games',   image: '/Tower gemini.png',                  players: 560,  rtp: '97.0', featured: false },
  { id: 'coinflip',         title: 'Coin Flip',          category: 'Luck Games',       image: '/Coin flip gemini.png',              players: 1100, rtp: '97.0', featured: false },
  { id: 'dragon-tiger',     title: 'Dragon Tiger',       category: 'Card Games',       image: '/Black Tiger.png',         players: 1120, rtp: '96.7', featured: false },
  { id: 'guess-the-cup',    title: 'Guess The Cup',      category: 'Luck Games',       image: '/guess the cup gemini.png',          players: 650,  rtp: '96.0', featured: false },
  { id: 'wheel',            title: 'Wheel',              category: 'Wheel Games',      image: '/Wheel gemini.png',                  players: 490,  rtp: '97.0', featured: false },
  { id: 'three-card-poker', title: 'Three Card Poker',   category: 'Card Games',       image: '/Three Cad Poker gemini.png',    players: 640,  rtp: '97.8', featured: false },
  { id: 'casino-war',       title: 'Casino War',         category: 'Card Games',       image: '/Casino war gemini.png',          players: 430,  rtp: '97.0', featured: false },
  { id: 'slot-joker',       title: 'Slot Joker',         category: 'Slot Games',       image: '/slots joker gemini.png',           players: 2400, rtp: '96.5', featured: true  },
  { id: 'classic-slots',    title: 'Classic Slots',      category: 'Slot Games',       image: '/slots gemini.png',        players: 1760, rtp: '96.0', featured: false },
  { id: 'lucky-7',          title: 'Lucky 7',            category: 'Dice Games',       image: '/Lucky 7 gemni.png',              players: 870,  rtp: '96.8', featured: false },
  { id: 'card-flip',        title: 'Card Flip',          category: 'Card Games',       image: '/Card Flip gemini.png',            players: 730,  rtp: '97.0', featured: false },
  { id: 'penalty',          title: 'Penalty Shoot',      category: 'Luck Games',       image: '/Peanlty Shoot gemini.png',          players: 940,  rtp: '96.0', featured: false },
  { id: 'jackpot-box',      title: 'Jackpot Box',        category: 'Luck Games',       image: '/Jackpot Box gemini.png',            players: 1050, rtp: '95.5', featured: false },
  { id: 'parity',           title: 'Parity',             category: 'Prediction Games', image: '/Parity gemini.png',                 players: 610,  rtp: '96.0', featured: false },
  { id: 'color-spin',       title: 'Color Spin',         category: 'Wheel Games',      image: '/color spin gemini.png',             players: 530,  rtp: '96.0', featured: false },
  { id: 'chuck-a-luck',     title: 'Chuck-a-Luck',       category: 'Dice Games',       image: '/chuck-a-lick gemini.png',           players: 410,  rtp: '97.0', featured: false },
  { id: 'andar-bahar',      title: 'Andar Bahar',        category: 'Card Games',       image: '/Andar Bahar gemini.png',          players: 590,  rtp: '97.0', featured: false },
  { id: 'pontoon',          title: 'Pontoon',            category: 'Card Games',       image: '/Pontoon gemini.png',             players: 380,  rtp: '97.5', featured: false },
  { id: 'caribbean-stud',   title: 'Caribbean Stud',     category: 'Card Games',       image: '/Caribbean stud gemini.png',       players: 320,  rtp: '97.2', featured: false },
  { id: 'casino-holdem',    title: "Casino Hold'em",     category: 'Card Games',       image: "/CASINO HOLD'EM gemini.png",          players: 470,  rtp: '97.0', featured: false },
  { id: 'lightning-dice',   title: 'Lightning Dice',     category: 'Dice Games',       image: '/lightning dice gemini.png',       players: 680,  rtp: '96.5', featured: false },
  { id: 'bingo',            title: 'Bingo',              category: 'Lottery Games',    image: '/bingo gemini.png',                  players: 540,  rtp: '95.0', featured: false },
  { id: 'rps',              title: 'Rock Paper Scissors',category: 'Luck Games',       image: '/Rock paper sissors gemini.png',     players: 760,  rtp: '97.0', featured: false },
  { id: 'dice-21',          title: 'Dice 21',            category: 'Dice Games',       image: '/Dice 21 gemini.png',                players: 490,  rtp: '97.0', featured: false },
  { id: 'dice-duel',        title: 'Dice Duel',          category: 'Dice Games',       image: '/dice duel gemini.png',              players: 430,  rtp: '97.0', featured: false },
  { id: 'hot-dice',         title: 'Hot Dice',           category: 'Dice Games',       image: '/hot dice gemini.png',             players: 510,  rtp: '96.5', featured: false },
  { id: 'number-match',     title: 'Number Match',       category: 'Prediction Games', image: '/number match.png',                  players: 370,  rtp: '96.0', featured: false },
  { id: 'rapid-roulette',   title: 'Rapid Roulette',     category: 'Table Games',      image: '/rapid roulette gemini.png',         players: 620,  rtp: '97.3', featured: false },
  { id: 'bigsix',           title: 'Big Six',            category: 'Wheel Games',      image: '/Big six gemini.png',                players: 340,  rtp: '96.0', featured: false },
  { id: 'red-dog',          title: 'Red Dog',            category: 'Card Games',       image: '/Red Dog gemini.png',              players: 290,  rtp: '97.0', featured: false },
];

const SECTIONS = [
  { key: 'featured',         label: 'Featured',          icon: Star,         color: '#eab308', filter: (g: typeof ALL_GAMES[0]) => g.featured },
  { key: 'Crash Games',      label: 'Crash Games',       icon: Zap,          color: '#00ff88', filter: (g: typeof ALL_GAMES[0]) => g.category === 'Crash Games' },
  { key: 'Slot Games',       label: 'Slot Games',        icon: LayoutGrid,   color: '#22c55e', filter: (g: typeof ALL_GAMES[0]) => g.category === 'Slot Games' },
  { key: 'Card Games',       label: 'Card Games',        icon: CreditCard,   color: '#3b82f6', filter: (g: typeof ALL_GAMES[0]) => g.category === 'Card Games' },
  { key: 'Dice Games',       label: 'Dice Games',        icon: Dice5,        color: '#f97316', filter: (g: typeof ALL_GAMES[0]) => g.category === 'Dice Games' },
  { key: 'Table Games',      label: 'Table Games',       icon: Table2,       color: '#06b6d4', filter: (g: typeof ALL_GAMES[0]) => g.category === 'Table Games' },
  { key: 'Wheel Games',      label: 'Wheel Games',       icon: RotateCcw,    color: '#eab308', filter: (g: typeof ALL_GAMES[0]) => g.category === 'Wheel Games' },
  { key: 'Luck Games',       label: 'Luck Games',        icon: Clover,       color: '#ec4899', filter: (g: typeof ALL_GAMES[0]) => g.category === 'Luck Games' },
  { key: 'Strategy Games',   label: 'Strategy Games',    icon: Brain,        color: '#6366f1', filter: (g: typeof ALL_GAMES[0]) => g.category === 'Strategy Games' },
  { key: 'Lottery Games',    label: 'Lottery Games',     icon: Ticket,       color: '#10b981', filter: (g: typeof ALL_GAMES[0]) => g.category === 'Lottery Games' },
  { key: 'Prediction Games', label: 'Prediction Games',  icon: Target,       color: '#f43f5e', filter: (g: typeof ALL_GAMES[0]) => g.category === 'Prediction Games' },
];

const TABS = [
  { key: 'all', label: 'All Games' },
  ...SECTIONS.map(s => ({ key: s.key, label: s.label })),
];

const SORT_OPTIONS = [
  { key: 'popular', label: 'Most Popular' },
  { key: 'rtp',     label: 'Highest RTP'  },
  { key: 'az',      label: 'A → Z'        },
];

function GameGrid({ games, delay = 0 }: { games: typeof ALL_GAMES; delay?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
      {games.map((game, i) => (
        <motion.div
          key={game.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: delay + Math.min(i * 0.016, 0.28) }}
        >
          <GameCard {...game} />
        </motion.div>
      ))}
    </div>
  );
}

function SectionHeading({ label, icon: Icon, color, count }: { label: string; icon: React.ElementType; color: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: `${color}12`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: 14, height: 14, color }} />
      </div>
      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: -0.2, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{label}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontWeight: 500 }}>{count} games</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)', marginLeft: 4 }} />
    </div>
  );
}

export default function Casino() {
  const [activeTab, setActiveTab] = useState('all');
  const [sort, setSort]           = useState('popular');
  const [search, setSearch]       = useState('');

  const sortGames = (games: typeof ALL_GAMES) =>
    [...games].sort((a, b) => {
      if (sort === 'popular') return b.players - a.players;
      if (sort === 'rtp')     return parseFloat(b.rtp) - parseFloat(a.rtp);
      return a.title.localeCompare(b.title);
    });

  const isSearching = search.trim().length > 0;

  const searchResults = isSearching
    ? sortGames(ALL_GAMES.filter(g => g.title.toLowerCase().includes(search.toLowerCase())))
    : [];

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 80px' }}>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
            <p style={ol}>Casino</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1, margin: '0 0 8px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  All Games
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                  {ALL_GAMES.length} games across {SECTIONS.length - 1} categories · All provably fair
                </p>
              </div>

              {/* Search + Sort */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                  <input
                    placeholder="Search games…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      height: 36, padding: '0 14px 0 32px', width: 165,
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      color: '#fff', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <SlidersHorizontal style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    style={{
                      height: 36, padding: '0 14px 0 32px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      color: 'rgba(255,255,255,0.6)', fontSize: 13, outline: 'none', cursor: 'pointer',
                    }}
                  >
                    {SORT_OPTIONS.map(o => <option key={o.key} value={o.key} style={{ background: '#1a1d27' }}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Category Tabs ───────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 40, paddingBottom: 2 }}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); }} style={{
                  flexShrink: 0,
                  height: 34, padding: '0 16px',
                  borderRadius: 8,
                  border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer',
                  fontSize: 12.5, fontWeight: 600,
                  background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.38)',
                  transition: 'all 0.15s',
                }}>
                  {tab.label}
                </button>
              );
            })}
          </motion.div>

          {/* ── Content ─────────────────────────────────────────────────────── */}
          <motion.div key={activeTab + sort + search} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

            {/* Search results — flat grid */}
            {isSearching && (
              searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
                  No games match "{search}"
                </div>
              ) : (
                <>
                  <p style={{ ...ol, marginBottom: 20 }}>Search results — {searchResults.length} found</p>
                  <GameGrid games={searchResults} />
                </>
              )
            )}

            {/* Single category tab */}
            {!isSearching && activeTab !== 'all' && (() => {
              const section = SECTIONS.find(s => s.key === activeTab)!;
              const games = sortGames(ALL_GAMES.filter(section.filter));
              return (
                <>
                  <SectionHeading label={section.label} icon={section.icon} color={section.color} count={games.length} />
                  <GameGrid games={games} />
                </>
              );
            })()}

            {/* All games — sectioned */}
            {!isSearching && activeTab === 'all' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 52 }}>
                {SECTIONS.map((section, si) => {
                  const games = sortGames(ALL_GAMES.filter(section.filter));
                  if (games.length === 0) return null;
                  return (
                    <motion.div
                      key={section.key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: si * 0.05 }}
                    >
                      <SectionHeading label={section.label} icon={section.icon} color={section.color} count={games.length} />
                      <GameGrid games={games} delay={si * 0.03} />
                    </motion.div>
                  );
                })}
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}

