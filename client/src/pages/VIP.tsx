import { motion } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { Crown, Star, Zap, Gift, Users, TrendingUp, Clock, Check } from 'lucide-react';

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px 24px' };
const ol: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 };

const TIERS = [
  { name: 'Silver',   minDep: '1,000',  cashback: '5%',  perks: ['Priority support','Monthly bonus','Exclusive game access'] },
  { name: 'Gold',     minDep: '5,000',  cashback: '10%', perks: ['24/7 VIP support','Weekly bonus','Private tournaments','Personal manager'], featured: true },
  { name: 'Platinum', minDep: '25,000', cashback: '15%', perks: ['Dedicated manager','Daily bonus','Luxury gifts','Birthday bonus'] },
  { name: 'Diamond',  minDep: '100,000',cashback: '20%', perks: ['Personal concierge','Unlimited bonuses','VIP-only events','Priority withdrawals','Custom promotions'] },
];

const PERKS = [
  { icon: Gift,       title: 'Exclusive Rewards',   desc: 'Premium gifts and bonuses unavailable to regular players.' },
  { icon: Zap,        title: 'Faster Withdrawals',  desc: 'Priority queue — VIP withdrawals process in under 10 minutes.' },
  { icon: Users,      title: 'VIP Events',          desc: 'Invite-only tournaments with massive prize pools.' },
  { icon: TrendingUp, title: 'Cashback Boosters',   desc: 'Higher cashback percentages on every loss at every tier.' },
  { icon: Crown,      title: 'Dedicated Support',   desc: '24/7 support from a named account manager who knows you.' },
  { icon: Star,       title: 'Luxury Gifts',        desc: 'Real-world gifts and experiences for Diamond and above.' },
];

export default function VIP() {
  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '52px 24px 80px' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48, maxWidth: 520 }}>
            <p style={ol}>VIP Club</p>
            <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: -1, margin: '0 0 14px', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>The higher you play,<br />the more you earn.</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, margin: 0 }}>Four tiers of exclusive benefits, cashback, and personalised service — all tied to your wager volume.</p>
          </motion.div>

          {/* Launch notice */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 18px', marginBottom: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', margin: 0 }}>VIP enrollment opens at official platform launch. Tiers below are a preview.</p>
          </motion.div>

          {/* Tiers */}
          <p style={ol}>Choose Your Tier</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 52, alignItems: 'start' }}>
            {TIERS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                style={{ ...card, opacity: 0.8, border: t.featured ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' }}>
                {t.featured && (
                  <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: 20 }}>Popular</div>
                )}
                <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{t.name}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: 0.6 }}>From {t.minDep} DMB</p>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '12px 14px', marginBottom: 18, textAlign: 'center' }}>
                  <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 2px', letterSpacing: -0.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{t.cashback}</p>
                  <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Daily Cashback</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {t.perks.map((p, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.52)', lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>
                <button disabled style={{ width: '100%', height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Clock style={{ width: 11, height: 11 }} /> Coming Soon
                </button>
              </motion.div>
            ))}
          </div>

          {/* Perks */}
          <p style={ol}>VIP Perks</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 48 }}>
            {PERKS.map((p, i) => { const Icon = p.icon; return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 + i * 0.06 }} style={{ ...card, opacity: 0.8 }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: 8, display: 'inline-flex', marginBottom: 12 }}>
                  <Icon style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.55)' }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{p.title}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
              </motion.div>
            ); })}
          </div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 40px', textAlign: 'center' }}>
            <Crown style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.35)', margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: -0.3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>VIP Club Launching Soon</h3>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.38)', margin: '0 auto', maxWidth: 440 }}>We're putting the finishing touches on the VIP program. Once live, you can enroll and start earning exclusive rewards from day one.</p>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
