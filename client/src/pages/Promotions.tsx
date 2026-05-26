import { motion } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { Gift, Zap, TrendingUp, Users, Clock, Copy } from 'lucide-react';

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px 24px', position: 'relative', overflow: 'hidden' };
const ol: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 };

const PROMOS = [
  { icon: Gift,       title: '100% Welcome Bonus',  desc: '100% match on your first deposit up to 5,000 DMB. One-time, new players only.', badge: 'New Players', code: 'WELCOME100' },
  { icon: Zap,        title: 'Daily 10% Cashback',  desc: 'Receive 10% back on all net losses, credited every day at 00:00 UTC.',           badge: 'Daily',       code: 'CASHBACK10' },
  { icon: Users,      title: 'Refer & Earn 20%',    desc: 'Earn 20% revenue share on every player you refer — for life.',                   badge: 'Ongoing',     code: 'REFER20'    },
  { icon: TrendingUp, title: 'Weekend 50% Boost',   desc: '50% deposit bonus on Saturdays and Sundays. Max 2,000 DMB per weekend.',         badge: 'Weekends',    code: 'WEEKEND50'  },
  { icon: Gift,       title: 'VIP Exclusive Bonus', desc: 'Gold tier and above receive a monthly reload bonus tailored to their level.',     badge: 'VIP Only',    code: 'VIPEXTRA'   },
  { icon: Zap,        title: 'Birthday 500 DMB',    desc: 'We drop 500 DMB into your wallet on your birthday — no deposit needed.',         badge: 'Birthday',    code: 'BIRTHDAY500'},
];

const TERMS = [
  'All promotions are subject to a 5× wagering requirement before withdrawal.',
  'Bonuses must be claimed within 7 days of eligibility.',
  'Maximum bonus amount is 10,000 DMB per promotion.',
  'Promotions cannot be combined unless explicitly stated.',
  'Dambler reserves the right to modify or cancel promotions at any time.',
  'Players must be 18+ and comply with responsible gambling guidelines.',
];

export default function Promotions() {
  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '52px 24px 80px' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 12 }}>
            <p style={ol}>Promotions & Offers</p>
            <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: -1, margin: '0 0 12px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Exclusive Bonuses</h1>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Maximize your play with weekly, daily and one-time offers.</p>
          </motion.div>

          {/* Launch notice */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 18px', marginBottom: 36, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Promotions shown are a preview — promo codes and bonuses will be claimable at official launch.</p>
          </motion.div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 48 }}>
            {PROMOS.map((promo, i) => {
              const Icon = promo.icon;
              return (
                <motion.div key={promo.code} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} style={{ ...card, opacity: 0.85 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: 9, display: 'flex' }}>
                      <Icon style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.55)' }} />
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.38)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 9px', borderRadius: 20 }}>{promo.badge}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>{promo.title}</p>
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.6, marginBottom: 18 }}>{promo.desc}</p>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.7 }}>Promo Code</p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '8px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.55)' }}>{promo.code}</code>
                      <button disabled style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '8px 10px', display: 'flex', cursor: 'not-allowed' }}>
                        <Copy style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.2)' }} />
                      </button>
                    </div>
                    <button disabled style={{ width: '100%', marginTop: 10, height: 38, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.2)', fontSize: 12.5, fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Clock style={{ width: 12, height: 12 }} /> Available at Launch
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Terms */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '28px 32px' }}>
            <p style={{ ...ol, marginBottom: 16 }}>Terms & Conditions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TERMS.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0, marginTop: 7 }} />
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>{t}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
