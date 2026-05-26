import { motion } from 'framer-motion';
import { Link } from 'wouter';
import MainLayout from '@/components/MainLayout';
import { Code2, BarChart2, Headphones, Palette, Globe, Zap } from 'lucide-react';

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px 24px' };
const ol: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 };
const tag: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 8px' };

const ROLES = [
  { icon: Code2,      title: 'Senior Fullstack Engineer',    team: 'Engineering',  type: 'Full-time', loc: 'Remote' },
  { icon: BarChart2,  title: 'Blockchain Data Analyst',      team: 'Analytics',    type: 'Full-time', loc: 'Remote' },
  { icon: Headphones, title: 'Player Support Specialist',    team: 'Support',      type: 'Full-time', loc: 'Remote' },
  { icon: Palette,    title: 'Product Designer',             team: 'Design',       type: 'Full-time', loc: 'Remote' },
  { icon: Globe,      title: 'Community Manager',            team: 'Marketing',    type: 'Part-time', loc: 'Remote' },
  { icon: Zap,        title: 'Smart Contract Developer',     team: 'Engineering',  type: 'Full-time', loc: 'Remote' },
];

const PERKS = [
  { label: '100% Remote', desc: 'Work from anywhere in the world.' },
  { label: 'Paid in Crypto', desc: 'Salary in USDC, BTC, or ETH — your choice.' },
  { label: 'Async-First', desc: 'No pointless meetings. Ship when you\'re sharp.' },
  { label: 'Equity Upside', desc: 'DMB Coin grants vest over 2 years.' },
];

export default function Careers() {
  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '52px 24px 80px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 52, maxWidth: 560 }}>
            <p style={ol}>Careers at Dambler</p>
            <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: -1, margin: '0 0 14px', lineHeight: 1.12, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Build the future<br />of crypto gaming.</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.44)', lineHeight: 1.7, margin: 0 }}>We're a small, fully remote team building provably fair games for players worldwide. If you care about crypto, great UX, and shipping fast — you'll fit right in.</p>
          </motion.div>

          <p style={ol}>Open Roles</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 48 }}>
            {ROLES.map((r, i) => { const Icon = r.icon; return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05 }}
                style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8, display: 'flex', flexShrink: 0 }}>
                  <Icon style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.52)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{r.title}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{r.team}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={tag}>{r.type}</span>
                  <span style={tag}>{r.loc}</span>
                </div>
              </motion.div>
            ); })}
          </div>

          <p style={ol}>Why Dambler</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 48 }}>
            {PERKS.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }} style={card}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{p.label}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: -0.3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Don't see your role?</h3>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Send us a message — we hire for talent, not just open slots.</p>
            </div>
            <Link href="/contact"><button style={{ background: '#fff', color: '#0c0e14', fontWeight: 800, fontSize: 13, padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>Get in Touch</button></Link>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
