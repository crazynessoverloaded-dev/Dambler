import { useState } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { Trophy, TrendingUp, Zap, Medal, Star } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { TIERS, getXpTier } from '@/lib/tiers';

type Category = 'xp' | 'wagered' | 'won';

const PRIZE_POOL = 100; // DMB coin reward pool for top 50
const RANK_COLORS = ['#f59e0b', '#9ca3af', '#b45309'];

function fmtXp(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M XP`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k XP`;
  return `${n} XP`;
}

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

function fmtXpShort(n: number) {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000)     return `${n / 1_000}k`;
  return `${n}`;
}

function fmtTierRange(min: number, max: number) {
  return max === Infinity ? `${fmtXpShort(min)}+ XP` : `${fmtXpShort(min)} – ${fmtXpShort(max)} XP`;
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
};

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '7px 18px', borderRadius: 8,
  border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
  color: active ? '#fff' : 'rgba(255,255,255,0.38)',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  display: 'flex', alignItems: 'center', gap: 6,
});

export default function Leaderboard() {
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState<Category>('xp');

  const xpQuery = trpc.wallet.xpLeaderboard.useQuery(
    { limit: 50 },
    { refetchInterval: 30_000, staleTime: 0 }
  );

  const wageredQuery = trpc.wallet.topWagerers.useQuery(
    { limit: 50 },
    { refetchInterval: 30_000, staleTime: 0, enabled: category === 'wagered' }
  );

  const wonQuery = trpc.wallet.leaderboard.useQuery(undefined, {
    refetchInterval: 60_000, staleTime: 30_000, enabled: category === 'won',
  });

  const myXpQuery = trpc.wallet.myXp.useQuery(undefined, {
    enabled: isAuthenticated, staleTime: 30_000,
  });

  const isLoading =
    (category === 'xp'      && xpQuery.isLoading) ||
    (category === 'wagered' && wageredQuery.isLoading) ||
    (category === 'won'     && wonQuery.isLoading);

  const players: { rank: number; username: string; amount: number }[] =
    category === 'xp'
      ? (xpQuery.data ?? []).map((p, i) => ({ rank: i + 1, username: p.username, amount: p.xp ?? 0 }))
      : category === 'wagered'
        ? (wageredQuery.data ?? []).map((p, i) => ({ rank: i + 1, username: p.username, amount: Number(p.wagered) }))
        : (wonQuery.data ?? []).map((p, i) => ({ rank: i + 1, username: p.username, amount: p.totalWon }));

  const top3 = players.slice(0, 3);
  const rest  = players.slice(3);

  const colLabel: Record<Category, string> = { xp: 'XP Points', wagered: 'Total Wagered', won: 'Total Won' };
  const fmtAmount = (n: number) => category === 'xp' ? fmtXp(n) : fmtMoney(n);

  // Find current user's rank in XP leaderboard
  const myXp = myXpQuery.data?.xp ?? 0;
  const myRank = category === 'xp'
    ? (xpQuery.data?.findIndex(p => p.xp === myXp) ?? -1) + 1
    : null;

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '52px 24px 80px' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1.2, margin: 0 }}>Leaderboard</p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', padding: '2px 8px', borderRadius: 20 }}>LIVE</span>
                </div>
                <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: -1, margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Top Players</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: '6px 0 0' }}>
                  Earn XP by playing any game · Top 50 win DMB coin rewards
                </p>
              </div>

              {/* My XP card */}
              {isAuthenticated && (() => {
                const myTier = getXpTier(myXp);
                return (
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 4 }}>YOUR XP</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{myXp.toLocaleString()}</div>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: `${myTier.color}18`, border: `1px solid ${myTier.color}40`, color: myTier.color }}>
                        {myTier.name}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>

          {/* Prize pool banner */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            style={{ ...card, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: 10, display: 'flex' }}>
                <Trophy style={{ width: 18, height: 18, color: '#f59e0b' }} />
              </div>
              <div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Campaign Reward Pool</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: -0.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  DMB Coin Rewards
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: '3px 0 0' }}>Top 50 players by XP earn DMB coin · Rewards announced at campaign end</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {[{ place: 'Top 10', medal: '🥇', note: 'Highest reward' }, { place: 'Top 25', medal: '🥈', note: 'Mid tier' }, { place: 'Top 50', medal: '🥉', note: 'Entry reward' }].map(p => (
                <div key={p.place} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 22, margin: '0 0 4px' }}>{p.medal}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{p.place}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: 0 }}>{p.note}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* How XP works */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { icon: Zap,       text: '1 XP per 10 seconds of play' },
              { icon: Star,      text: 'Same XP across all games' },
              { icon: TrendingUp, text: 'XP never resets — cumulative' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'rgba(255,255,255,0.38)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 12px' }}>
                <Icon style={{ width: 12, height: 12, color: '#f59e0b', flexShrink: 0 }} />
                {text}
              </div>
            ))}
          </motion.div>

          {/* Rank system */}
          {(() => {
            const myTier = getXpTier(myXp);
            return (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
                style={{ ...card, padding: '18px 20px', marginBottom: 28 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1.2, margin: '0 0 14px' }}>
                  Rank System
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {TIERS.map(t => {
                    const isActive = t.name === myTier.name && isAuthenticated;
                    return (
                      <div key={t.name} style={{
                        borderRadius: 10,
                        padding: '10px 8px',
                        textAlign: 'center',
                        background: isActive ? `${t.color}14` : 'rgba(255,255,255,0.02)',
                        border: isActive ? `1.5px solid ${t.color}60` : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: isActive ? `0 0 18px ${t.color}18` : 'none',
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}>
                        {isActive && (
                          <div style={{
                            position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                            fontSize: 9, fontWeight: 800, color: t.color,
                            background: '#0f1118', padding: '1px 7px', borderRadius: 20,
                            border: `1px solid ${t.color}40`, whiteSpace: 'nowrap', letterSpacing: 0.5,
                          }}>YOU</div>
                        )}
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: `${t.color}20`, border: `1.5px solid ${t.color}50`,
                          margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
                        </div>
                        <p style={{ fontSize: 11, fontWeight: 800, color: t.color, margin: '0 0 4px', letterSpacing: 0.2 }}>{t.name}</p>
                        <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.28)', margin: 0, lineHeight: 1.3 }}>
                          {fmtTierRange(t.min, t.max)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })()}

          {/* Category tabs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
            {([
              { key: 'xp',      label: 'XP Points',     icon: Zap    },
              { key: 'wagered', label: 'Most Wagered',   icon: TrendingUp },
              { key: 'won',     label: 'Most Won',       icon: Trophy },
            ] as { key: Category; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setCategory(key)} style={tabBtn(category === key)}>
                <Icon style={{ width: 11, height: 11 }} />
                {label}
              </button>
            ))}
          </motion.div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>Loading…</div>
          ) : players.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
              No players yet — be the first!
            </div>
          ) : (
            <>
              {/* Podium */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 12, marginBottom: 24, alignItems: 'end' }}>
                {[top3[1], top3[0], top3[2]].map((p, vi) => {
                  if (!p) return <div key={vi} />;
                  const heights  = [110, 148, 96];
                  const medals   = ['🥇', '🥈', '🥉'];
                  const mIdx     = vi === 1 ? 0 : vi === 0 ? 1 : 2;
                  const podiumTier = category === 'xp' ? getXpTier(p.amount) : null;
                  return (
                    <motion.div key={p.rank}
                      whileHover={{ y: -3 }}
                      style={{ ...card, padding: '20px 16px', textAlign: 'center', height: heights[vi], display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 5, boxShadow: vi === 1 ? '0 0 40px rgba(245,158,11,0.08)' : 'none', borderColor: vi === 1 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)' }}>
                      <p style={{ fontSize: 28, margin: 0 }}>{medals[mIdx]}</p>
                      <p style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', margin: 0 }}>{p.username}</p>
                      {podiumTier && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${podiumTier.color}18`, border: `1px solid ${podiumTier.color}40`, color: podiumTier.color }}>
                          {podiumTier.name}
                        </span>
                      )}
                      <p style={{ fontSize: 15, fontWeight: 900, color: category === 'xp' ? '#f59e0b' : '#fff', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>{fmtAmount(p.amount)}</p>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Full ranked table — all players */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                style={{ ...card, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 160px 120px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Rank', 'Player', colLabel[category], category === 'xp' ? 'Tier' : 'Status'].map(col => (
                    <span key={col} style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>{col}</span>
                  ))}
                </div>
                {players.map((p, i) => {
                  const hue     = (p.username.charCodeAt(0) * 47) % 360;
                  const inTop50 = p.rank <= 50;
                  const medal   = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : null;
                  const tier    = category === 'xp' ? getXpTier(p.amount) : null;
                  return (
                    <motion.div key={p.rank}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 + i * 0.015 }}
                      style={{
                        display: 'grid', gridTemplateColumns: '52px 1fr 160px 120px',
                        padding: '12px 20px',
                        borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        alignItems: 'center',
                        background: p.rank <= 3 ? 'rgba(245,158,11,0.03)' : 'transparent',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {medal
                          ? <span style={{ fontSize: 16 }}>{medal}</span>
                          : <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>#{p.rank}</span>
                        }
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: `hsl(${hue},40%,22%)`, border: `1px solid hsl(${hue},40%,32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800, color: `hsl(${hue},55%,68%)` }}>
                          {p.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.username}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: category === 'xp' ? '#f59e0b' : '#fff', fontFamily: 'JetBrains Mono, monospace' }}>{fmtAmount(p.amount)}</span>
                      {tier ? (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, width: 'fit-content',
                          background: `${tier.color}18`,
                          border: `1px solid ${tier.color}40`,
                          color: tier.color,
                        }}>
                          {tier.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, width: 'fit-content',
                          background: inTop50 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
                          border: inTop50 ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.08)',
                          color: inTop50 ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                        }}>
                          {inTop50 ? '🏆 Reward' : 'Keep playing'}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </>
          )}

          {/* Footer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 20 }}>
            {[
              { icon: Zap,       text: 'XP is rate-limited — no spam farming' },
              { icon: Medal,     text: 'Rewards paid in DMB coin at campaign end' },
              { icon: TrendingUp, text: 'XP never resets — every round counts' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'rgba(255,255,255,0.28)' }}>
                <Icon style={{ width: 13, height: 13 }} />{text}
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </MainLayout>
  );
}
