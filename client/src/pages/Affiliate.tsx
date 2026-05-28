import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import MainLayout from '@/components/MainLayout';
import { Copy, Check, Users, Zap, TrendingUp, Gift, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { TIERS, getXpTier } from '@/lib/tiers';

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
};

const COMMISSION_RATES: Record<string, number> = {
  Starter: 0, Bronze: 5, Silver: 10, Gold: 12, Platinum: 15, Diamond: 18, Dambler: 20,
};

const SIGNUP_BONUSES = [
  { label: 'Referrals 1–3', xp: '100 XP', note: 'Once they reach Bronze' },
  { label: 'Referrals 4+',  xp: '50 XP',  note: 'Once they reach Bronze' },
];

export default function Affiliate() {
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);

  const statsQ = trpc.wallet.affiliateStats.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
  const myXpQ = trpc.wallet.myXp.useQuery(undefined, { enabled: isAuthenticated });

  const collectMutation = trpc.wallet.collectCommission.useMutation({
    onSuccess: () => statsQ.refetch(),
  });

  const stats = statsQ.data;
  const myXp = myXpQ.data?.xp ?? 0;
  const myTier = getXpTier(myXp);
  const commissionRate = COMMISSION_RATES[myTier.name] ?? 0;
  const pendingXp = stats?.pendingCommissionXp ?? 0;
  const collectableXp = Math.floor(pendingXp);

  function copyCode() {
    if (!stats?.referralCode) return;
    navigator.clipboard.writeText(stats.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '52px 24px 80px' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1.2, margin: '0 0 8px' }}>
              Affiliate Program
            </p>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -0.8, margin: '0 0 8px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Your Referral Dashboard
            </h1>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.36)', margin: 0 }}>
              Invite players with your code. Earn XP commission when they play.
            </p>
          </motion.div>

          {!isAuthenticated ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ ...card, padding: '56px 32px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(245,158,11,0.1)',
                border: '1.5px solid rgba(245,158,11,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 32px rgba(245,158,11,0.12)',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#f59e0b" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="3" y="11" width="18" height="11" rx="3" stroke="#f59e0b" strokeWidth="1.75"/>
                  <circle cx="12" cy="16.5" r="1.4" fill="#f59e0b"/>
                  <line x1="12" y1="17.9" x2="12" y2="19.2" stroke="#f59e0b" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Sign in to Access</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', marginBottom: 28, lineHeight: 1.65 }}>
                Log in to see your referral code, track<br />commissions, and start earning.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Link href="/login" style={{
                  padding: '13px 28px', borderRadius: 12,
                  background: '#ffffff',
                  color: '#0a0a0f', fontWeight: 800, fontSize: 14, textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(255,255,255,0.1)',
                }}>Login</Link>
                <Link href="/register" style={{
                  padding: '13px 28px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 14, textDecoration: 'none',
                }}>Create Account</Link>
              </div>
            </motion.div>
          ) : statsQ.isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.2)' }}>Loading…</div>
          ) : (
            <>
              {/* Top row: referral code + pending commission */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

                {/* Referral code card */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                  style={{ ...card, padding: '22px 24px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                    Your Referral Code
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10, padding: '10px 16px',
                      fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 4,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {stats?.referralCode ?? '——'}
                    </div>
                    <button onClick={copyCode} style={{
                      background: copied ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.07)',
                      border: copied ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                      color: copied ? '#4ade80' : 'rgba(255,255,255,0.7)',
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
                    }}>
                      {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.25)', marginTop: 10 }}>
                    Share this code. Anyone who enters it when signing up becomes your referral.
                  </p>
                </motion.div>

                {/* Pending commission card */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  style={{ ...card, padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                      Pending Commission
                    </p>
                    <p style={{ fontSize: 38, fontWeight: 900, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace', margin: '0 0 4px', lineHeight: 1 }}>
                      {collectableXp.toLocaleString()}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '0 0 16px' }}>
                      XP ready to collect {pendingXp > collectableXp && (
                        <span style={{ color: 'rgba(255,255,255,0.18)' }}>
                          (+{(pendingXp - collectableXp).toFixed(2)} accruing)
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => collectMutation.mutate()}
                    disabled={collectableXp <= 0 || collectMutation.isPending}
                    style={{
                      background: collectableXp > 0 ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                      color: collectableXp > 0 ? '#000' : 'rgba(255,255,255,0.2)',
                      border: 'none', borderRadius: 10, padding: '11px 20px',
                      fontSize: 13, fontWeight: 800, cursor: collectableXp > 0 ? 'pointer' : 'not-allowed',
                      width: '100%', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}>
                    <Gift style={{ width: 14, height: 14 }} />
                    {collectMutation.isPending ? 'Collecting…' : collectableXp > 0 ? `Collect ${collectableXp.toLocaleString()} XP` : 'Nothing to collect'}
                  </button>
                </motion.div>
              </div>

              {/* Stats row */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
                {[
                  { label: 'Total Referred', value: stats?.totalReferred ?? 0, icon: Users },
                  { label: 'Qualified (Bronze+)', value: stats?.qualifiedCount ?? 0, icon: TrendingUp },
                  { label: 'Your Commission Rate', value: `${commissionRate}%`, icon: Zap },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} style={{ background: '#0f1118', padding: '20px 24px', textAlign: 'center' }}>
                    <Icon style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.28)', margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: -0.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{value}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: 0 }}>{label}</p>
                  </div>
                ))}
              </motion.div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

                {/* Commission tier info */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                  style={{ ...card, padding: '22px 24px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                    Commission Rates by Your Rank
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {TIERS.filter(t => t.name !== 'Starter').map(t => {
                      const rate = COMMISSION_RATES[t.name] ?? 0;
                      const isMe = t.name === myTier.name;
                      return (
                        <div key={t.name} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: 8,
                          background: isMe ? `${t.color}12` : 'transparent',
                          border: isMe ? `1px solid ${t.color}30` : '1px solid transparent',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12.5, fontWeight: isMe ? 700 : 500, color: isMe ? t.color : 'rgba(255,255,255,0.5)' }}>
                              {t.name}
                            </span>
                            {isMe && <span style={{ fontSize: 9, fontWeight: 800, color: t.color, background: `${t.color}20`, border: `1px solid ${t.color}40`, padding: '1px 6px', borderRadius: 10 }}>YOU</span>}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: isMe ? t.color : 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {rate}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 12, lineHeight: 1.5 }}>
                    Your rate is determined by your own XP rank. Level up to earn a higher % from all your referrals.
                  </p>
                </motion.div>

                {/* Signup bonus info */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  style={{ ...card, padding: '22px 24px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                    Signup Bonus XP
                  </p>
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.36)', lineHeight: 1.6, marginBottom: 16 }}>
                    Each referred user who reaches <span style={{ color: '#cd7f32', fontWeight: 700 }}>Bronze rank (100 XP)</span> triggers a one-time bonus for you:
                  </p>
                  {SIGNUP_BONUSES.map(b => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 9, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{b.label}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{b.note}</p>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>{b.xp}</span>
                    </div>
                  ))}
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 12, lineHeight: 1.5 }}>
                    Plus ongoing % commission (see left) on every XP they earn after reaching Bronze — forever.
                  </p>
                </motion.div>
              </div>

              {/* Referrals list */}
              {(stats?.referrals?.length ?? 0) > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                  style={{ ...card, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
                      Your Referrals
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px', padding: '8px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Player', 'XP', 'Status'].map(col => (
                      <span key={col} style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase' }}>{col}</span>
                    ))}
                  </div>
                  {stats!.referrals.map((r, i) => {
                    const tier = getXpTier(r.xp);
                    const hue = (r.username.charCodeAt(0) * 47) % 360;
                    return (
                      <div key={r.username} style={{
                        display: 'grid', gridTemplateColumns: '1fr 120px 100px',
                        padding: '11px 22px', alignItems: 'center',
                        borderBottom: i < stats!.referrals.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: `hsl(${hue},40%,22%)`, border: `1px solid hsl(${hue},40%,32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800, color: `hsl(${hue},55%,68%)`, flexShrink: 0 }}>
                            {r.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{r.username}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>
                          {r.xp.toLocaleString()} XP
                        </span>
                        {r.qualified ? (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, width: 'fit-content', background: `${tier.color}18`, border: `1px solid ${tier.color}40`, color: tier.color }}>
                            {tier.name}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, width: 'fit-content', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }}>
                            Starter
                          </span>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {(stats?.referrals?.length ?? 0) === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}
                  style={{ ...card, padding: '40px 32px', textAlign: 'center' }}>
                  <Users style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.12)', margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>No referrals yet</p>
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.18)' }}>
                    Share your code <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{stats?.referralCode}</span> and start earning XP.
                  </p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
