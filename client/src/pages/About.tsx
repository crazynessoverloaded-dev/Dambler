import { motion } from 'framer-motion';
import { Link } from 'wouter';
import MainLayout from '@/components/MainLayout';
import { Zap, Shield, Rocket, Globe, Users, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px 24px' };
const iconBox: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8, display: 'flex', flexShrink: 0 };
const ol: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 };

const VALUES  = [{ icon: Zap, title: 'Lightning Fast', body: 'Instant settlements and real-time game updates. No waiting.' }, { icon: Shield, title: 'Provably Fair', body: "Every outcome is verifiable on-chain. Inspect any bet's seed." }, { icon: Rocket, title: 'Innovation First', body: 'We ship games every week. New mechanics, not recycled slots.' }, { icon: Globe, title: 'Global & Remote', body: 'Players from 150+ countries. Our team spans 15 time zones.' }];
const PILLARS = [{ icon: Users, label: 'Community Driven', desc: 'Built by gamers, for gamers — your feedback shapes the platform.' }, { icon: TrendingUp, label: 'Transparent Odds', desc: 'Every game shows its RTP upfront. No surprises.' }, { icon: Shield, label: 'Secure by Default', desc: 'TLS everywhere, 2FA support, and regular third-party pen tests.' }];

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M+';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K+';
  return n.toLocaleString();
}

function fmtDmb(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M DMB';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K DMB';
  return n.toLocaleString() + ' DMB';
}

export default function About() {
  const { data: stats } = trpc.wallet.publicStats.useQuery(undefined, { refetchInterval: 60_000 });

  const STATS = [
    { value: stats ? fmtNumber(stats.totalUsers) : '—', label: 'Registered Players' },
    { value: '44+', label: 'Casino Games' },
    { value: stats ? fmtDmb(stats.wageredToday) : '—', label: 'Wagered Today' },
    { value: stats ? stats.activeUsers.toLocaleString() : '—', label: 'Active Now' },
  ];

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '52px 24px 80px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 52, maxWidth: 560 }}>
            <p style={ol}>About Dambler</p>
            <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: -1, margin: '0 0 14px', lineHeight: 1.12, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>The crypto casino<br />built for players.</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.44)', lineHeight: 1.7, margin: '0 0 28px' }}>Dambler combines provably fair games, instant DMB Coin settlements, and a community-first culture into a platform that respects your intelligence — and your time.</p>
            <Link href="/register"><button style={{ background: '#fff', color: '#0c0e14', fontWeight: 800, fontSize: 13, padding: '11px 24px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>Get Started Free</button></Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden', marginBottom: 40 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ background: '#0f1118', padding: '22px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: -0.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.value}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} style={card}>
              <p style={ol}>Our Mission</p>
              <p style={{ fontSize: 14.5, color: '#fff', fontWeight: 700, marginBottom: 12, lineHeight: 1.5, letterSpacing: -0.2 }}>Redefining what a crypto casino can be.</p>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.46)', lineHeight: 1.72, margin: 0 }}>We believe gambling platforms owe their players transparency, fairness, and honest odds. Every game on Dambler is provably fair — you can verify any bet outcome using the cryptographic seed committed before your wager. Our DMB Coin ensures instant, low-fee settlements with full on-chain records.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {PILLARS.map((p, i) => { const Icon = p.icon; return (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={iconBox}><Icon style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.52)' }} /></div>
                  <div><p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{p.label}</p><p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.42)', margin: 0, lineHeight: 1.55 }}>{p.desc}</p></div>
                </div>
              ); })}
            </motion.div>
          </div>

          <p style={ol}>Why Choose Dambler</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 40 }}>
            {VALUES.map((v, i) => { const Icon = v.icon; return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 + i * 0.06 }} style={card}>
                <div style={{ ...iconBox, marginBottom: 12 }}><Icon style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.52)' }} /></div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{v.title}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', lineHeight: 1.6, margin: 0 }}>{v.body}</p>
              </motion.div>
            ); })}
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: -0.3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Ready to play?</h3>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Join {stats ? fmtNumber(stats.totalUsers) : 'thousands of'} players. Your first 1,000 DMB are on us.</p>
            </div>
            <Link href="/register"><button style={{ background: '#fff', color: '#0c0e14', fontWeight: 800, fontSize: 13, padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>Create Account</button></Link>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
