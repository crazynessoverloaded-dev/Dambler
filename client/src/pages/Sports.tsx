import { motion } from 'framer-motion';
import { Link } from 'wouter';
import MainLayout from '@/components/MainLayout';
import { Trophy, Zap, BarChart2, RefreshCw, Bell, ArrowRight, Lock } from 'lucide-react';

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 22px' };
const ol: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 };

const FEATURES = [
  { icon: Zap,        title: 'Live In-Play',      desc: 'Bet as the action unfolds with real-time odds across every market.' },
  { icon: BarChart2,  title: 'Deep Markets',       desc: 'Moneyline, spreads, totals, props, parlays and same-game combos.' },
  { icon: RefreshCw,  title: 'Cash Out',           desc: 'Lock in profit or cut losses before the final whistle.' },
  { icon: Trophy,     title: 'DMB Rewards',        desc: 'Every bet earns DMB Coin — redeemable for free plays and cashback.' },
];

const MOCK_MATCHES = [
  { league: 'UEFA Champions League', home: 'Real Madrid', away: 'Man City',    time: 'Live 67\'', homeOdds: '2.10', drawOdds: '3.40', awayOdds: '3.20', score: '1 – 1' },
  { league: 'NBA',                   home: 'Lakers',      away: 'Celtics',     time: 'Live Q3',   homeOdds: '1.85', drawOdds: null,   awayOdds: '1.95', score: '78 – 82' },
  { league: 'NFL',                   home: 'Chiefs',      away: 'Eagles',      time: 'Starting in 2h', homeOdds: '1.72', drawOdds: null, awayOdds: '2.15', score: null },
  { league: 'Premier League',        home: 'Arsenal',     away: 'Liverpool',   time: 'Starting in 4h', homeOdds: '2.40', drawOdds: '3.10', awayOdds: '2.80', score: null },
];

export default function Sports() {
  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '52px 24px 80px' }}>

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 52 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <p style={{ ...ol, margin: 0 }}>Sports Betting</p>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 1,
                color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '3px 9px', borderRadius: 20,
              }}>COMING SOON</span>
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: -1.2, margin: '0 0 14px', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 540 }}>
              Sports betting<br />is on its way.
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: 0, maxWidth: 480 }}>
              Live odds, deep markets, instant DMB payouts — built with the same provably fair standards as our casino. Launching soon.
            </p>
          </motion.div>

          {/* Mock match cards — locked */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 48 }}>
            <p style={ol}>Preview — Live & Upcoming</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOCK_MATCHES.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.06 }}
                  style={{ ...card, display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 20, filter: 'none', position: 'relative', overflow: 'hidden' }}>

                  {/* Locked overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,17,24,0.55)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px' }}>
                      <Lock style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.4)' }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Available at launch</span>
                    </div>
                  </div>

                  {/* Match info */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{m.league}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{m.home}</span>
                      {m.score
                        ? <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.06)', padding: '2px 10px', borderRadius: 6 }}>{m.score}</span>
                        : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>vs</span>}
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{m.away}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                      background: m.time.startsWith('Live') ? 'rgba(255,255,255,0.0)' : 'rgba(255,255,255,0.05)',
                      color: m.time.startsWith('Live') ? '#4ade80' : 'rgba(255,255,255,0.35)',
                      border: m.time.startsWith('Live') ? '1px solid rgba(255,255,255,0.0)' : '1px solid rgba(255,255,255,0.07)',
                    }}>{m.time}</span>
                  </div>

                  {/* Odds */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[['1', m.homeOdds], ...(m.drawOdds ? [['X', m.drawOdds]] : []), ['2', m.awayOdds]].map(([label, odds]) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 12px', textAlign: 'center', minWidth: 54 }}>
                        <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.28)', margin: '0 0 3px', fontWeight: 600 }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{odds}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} style={{ marginBottom: 48 }}>
            <p style={ol}>What's Coming</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {FEATURES.map((f, i) => { const Icon = f.icon; return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 + i * 0.07 }} style={card}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8, display: 'inline-flex', marginBottom: 12 }}>
                    <Icon style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.5)' }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{f.title}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </motion.div>
              ); })}
            </div>
          </motion.div>

          {/* Notify CTA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Bell style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.4)' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Get notified at launch</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 5px', letterSpacing: -0.3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>In the meantime, try our casino.</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>45+ provably fair games. Instant DMB payouts. No KYC.</p>
            </div>
            <Link href="/casino">
              <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', color: '#0c0e14', fontWeight: 800, fontSize: 13, padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Play Now <ArrowRight style={{ width: 13, height: 13 }} />
              </button>
            </Link>
          </motion.div>

        </div>
      </div>
    </MainLayout>
  );
}

