import { motion } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { MessageCircle, Mail, Twitter, Send } from 'lucide-react';

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px 24px' };
const ol: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 };
const input: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, color: '#fff', outline: 'none', boxSizing: 'border-box' };

const CHANNELS = [
  { icon: MessageCircle, label: 'Live Chat',    desc: 'Available 24/7 in-app. Avg response under 2 min.',   action: 'Open Chat' },
  { icon: Mail,          label: 'Email Support', desc: 'support@dambler.io — we reply within a few hours.',   action: 'Send Email' },
  { icon: Twitter,       label: 'Twitter / X',  desc: 'DM us @DamblerHQ for quick questions.',               action: 'Follow Us' },
];

export default function Contact() {
  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '52px 24px 80px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 52, maxWidth: 520 }}>
            <p style={ol}>Contact Us</p>
            <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: -1, margin: '0 0 14px', lineHeight: 1.12, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>We're here<br />to help.</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.44)', lineHeight: 1.7, margin: 0 }}>Reach us through live chat, email, or social media. We aim to respond to every message within a few hours.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            <div>
              <p style={ol}>Send a Message</p>
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>First Name</p>
                    <input style={input} placeholder="Alex" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>Last Name</p>
                    <input style={input} placeholder="Smith" />
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>Email</p>
                  <input style={input} placeholder="you@email.com" type="email" />
                </div>
                <div>
                  <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>Subject</p>
                  <input style={input} placeholder="How can we help?" />
                </div>
                <div>
                  <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>Message</p>
                  <textarea style={{ ...input, resize: 'vertical', minHeight: 100, fontFamily: 'inherit' }} placeholder="Describe your issue or question..." />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#0c0e14', fontWeight: 800, fontSize: 13, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%' }}>
                  <Send style={{ width: 13, height: 13 }} /> Send Message
                </button>
              </motion.div>
            </div>

            <div>
              <p style={ol}>Other Ways to Reach Us</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CHANNELS.map((c, i) => { const Icon = c.icon; return (
                  <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.07 }}
                    style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, display: 'flex', flexShrink: 0 }}>
                      <Icon style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.52)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>{c.label}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
                    </div>
                    <button style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{c.action}</button>
                  </motion.div>
                ); })}
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ ...card, marginTop: 10 }}>
                <p style={ol}>Response Times</p>
                {[['Live Chat', 'Under 2 minutes'], ['Email', '2 – 4 hours'], ['Twitter / X', 'Same day']].map(([ch, rt], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{ch}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{rt}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
