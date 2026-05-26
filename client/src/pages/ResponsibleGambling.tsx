import { motion } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { AlertTriangle, Phone, Heart, BookOpen, Clock, Lock, BarChart3, ShieldAlert } from 'lucide-react';

const AMBER = '#f59e0b';

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
  padding: '22px 24px',
};

const RESOURCES = [
  { icon: Phone, title: 'National Helpline', detail: '1-800-GAMBLER', sub: 'Free & confidential — 24/7' },
  { icon: Heart, title: 'Gamblers Anonymous', detail: 'gamblersanonymous.org', sub: 'Community support & meetings' },
  { icon: BookOpen, title: 'GamCare (UK)', detail: '0808 8020 133', sub: 'National Council on Problem Gambling' },
];

const SIGNS = [
  'Gambling more frequently or with larger amounts',
  'Thinking about gambling constantly',
  'Lying to family or friends about gambling',
  'Chasing losses by gambling more',
  'Neglecting work, school, or family responsibilities',
  'Borrowing money to gamble',
  'Feeling anxious or irritable when not gambling',
  'Using gambling to escape problems or negative emotions',
];

const TOOLS = [
  { icon: Lock, title: 'Self-Exclusion', desc: 'Lock your account for 24 hours up to 5 years. Exclusion stops account access and all promotional communications.' },
  { icon: BarChart3, title: 'Deposit & Bet Limits', desc: 'Set daily, weekly, or monthly caps. Reductions apply immediately; increases require a 24-hour cooling period.' },
  { icon: Clock, title: 'Reality Check', desc: 'Receive time-on-site reminders at intervals you choose so you always know how long you\'ve been playing.' },
];

export default function ResponsibleGambling() {
  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420, background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.13) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px', position: 'relative' }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 10, padding: 10, display: 'flex' }}>
                <AlertTriangle style={{ width: 18, height: 18, color: AMBER }} />
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -0.4 }}>Responsible Gambling</h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 14.5, margin: '0 0 0 4px' }}>
              We are committed to providing a safe, transparent, and fair gambling environment.
            </p>
          </div>

          {/* Warning banner */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.28)', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <ShieldAlert style={{ width: 20, height: 20, color: AMBER, flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: AMBER, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.8 }}>Important Warning</p>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, margin: 0 }}>
                  Gambling involves risk and is not suitable for everyone. Never gamble more than you can afford to lose, and never use gambling as a way to make money or solve financial problems. If you suspect you have a problem, seek help immediately using the resources below.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Age + House edge */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: '18+ Only', body: 'Dambler is strictly for adults aged 18 and over. We perform age verification checks and will immediately close any account found to be operated by a minor, forfeiting all associated funds.' },
              { label: 'The House Edge', body: 'All casino games carry a mathematical advantage for the house over time. Treat gambling as entertainment with a cost — similar to a movie or concert — never as a method to earn income.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} style={card}>
                <p style={{ fontSize: 11, fontWeight: 700, color: AMBER, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.7 }}>{item.label}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.68, margin: 0 }}>{item.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Signs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} style={{ ...card, marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8 }}>Signs of Problem Gambling</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
              {SIGNS.map((sign, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: AMBER, flexShrink: 0, marginTop: 7 }} />
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.52)', margin: 0, lineHeight: 1.55 }}>{sign}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tools */}
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Player Protection Tools</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
            {TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 + i * 0.06 }} style={card}>
                  <Icon style={{ width: 17, height: 17, color: AMBER, marginBottom: 10 }} />
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{tool.title}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.46)', lineHeight: 1.6, margin: 0 }}>{tool.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 28 }} />

          {/* Resources */}
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>If You Need Help</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {RESOURCES.map((r, i) => {
              const Icon = r.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 + i * 0.06 }}
                  style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '20px 22px' }}>
                  <Icon style={{ width: 16, height: 16, color: AMBER, marginBottom: 10 }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{r.title}</p>
                  <p style={{ fontSize: 12, color: AMBER, fontFamily: 'monospace', marginBottom: 4 }}>{r.detail}</p>
                  <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.38)', margin: 0 }}>{r.sub}</p>
                </motion.div>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ marginTop: 36, textAlign: 'center', paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Activate limits or self-exclusion via{' '}
              <span style={{ color: AMBER }}>Settings → Responsible Gambling</span>
              {' '}or email{' '}
              <span style={{ color: AMBER }}>rg@dambler.com</span>
            </p>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
