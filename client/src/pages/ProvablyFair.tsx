import { motion } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { Shield, Hash, RefreshCw, CheckCircle, Lock } from 'lucide-react';

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px 24px' };
const ol: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 };

const STEPS = [
  { icon: Hash,        num: '01', title: 'Server Seed (Hashed)',  desc: 'Before each round our server generates a random seed and sends you its SHA-256 hash. The hash proves the seed exists without revealing it — so we cannot change it after you bet.' },
  { icon: RefreshCw,   num: '02', title: 'Client Seed',           desc: 'Your browser generates its own random client seed, combined with the server seed to produce the outcome. You can replace your client seed with any string from your account settings.' },
  { icon: Shield,      num: '03', title: 'Nonce',                 desc: 'A nonce increments with every bet. This ensures each round is unique even when seeds stay the same, and gives you a complete verifiable history of every outcome.' },
  { icon: CheckCircle, num: '04', title: 'Verify Anytime',        desc: 'After the round ends we reveal the original server seed. Plug the server seed, client seed, and nonce into the formula below to independently confirm any result.' },
];

const FAQ = [
  { q: 'Can Dambler change the outcome after I place a bet?',      a: 'No. The server seed hash is committed to you before the round starts. Changing the seed would produce a different hash — you would catch it immediately.' },
  { q: "What if I don't trust the client seed my browser generated?", a: 'Replace it. Go to Settings → Provably Fair and type any string you like. You have full control over your half of the randomness.' },
  { q: 'Where do I find my seeds and nonce?',                       a: 'Your active seeds and current nonce are in Settings → Provably Fair. Completed rounds show the revealed server seed so you can verify them.' },
  { q: 'Does this apply to every game?',                            a: 'Yes. Every game uses the same HMAC-SHA256 system. The only difference is how the output float maps to a result (e.g. crash multiplier vs card drawn).' },
];

const CODE = `import { createHmac } from 'crypto';

function getOutcome(serverSeed, clientSeed, nonce) {
  const hmac = createHmac('sha256', serverSeed)
    .update(\`\${clientSeed}:\${nonce}\`)
    .digest('hex');

  // First 8 hex chars → float in [0, 1)
  return parseInt(hmac.slice(0, 8), 16) / 0xffffffff;
}`;

export default function ProvablyFair() {
  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '52px 24px 80px' }}>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48, maxWidth: 540 }}>
            <p style={ol}>Provably Fair</p>
            <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: -1, margin: '0 0 14px', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Every outcome,<br />independently verified.
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, margin: 0 }}>
              Dambler uses cryptographic proofs so you never have to trust us. You can verify any game result yourself using open-source tools.
            </p>
          </motion.div>

          {/* ── Notice ─────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 18px', marginBottom: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', margin: 0 }}>All games use HMAC-SHA256. No server-side manipulation is possible once a bet is placed.</p>
          </motion.div>

          {/* ── How It Works ───────────────────────────────────────────────── */}
          <p style={ol}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 52 }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                  style={{ ...card, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: 10, display: 'inline-flex' }}>
                    <Icon style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.55)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.22)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>{s.num}</p>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', marginBottom: 7 }}>{s.title}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Verification Formula ───────────────────────────────────────── */}
          <p style={ol}>Verification Formula</p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
            style={{ ...card, marginBottom: 52 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>HMAC-SHA256 — Node.js</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 18, lineHeight: 1.6 }}>
              Combine the server seed, client seed, and nonce with HMAC-SHA256. The first 8 hex characters convert to a float in [0,&nbsp;1) that maps to the game result.
            </p>
            <pre style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: '18px 20px',
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.62)',
              overflowX: 'auto',
              lineHeight: 1.75,
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              margin: 0,
            }}>
              {CODE}
            </pre>
          </motion.div>

          {/* ── FAQ ────────────────────────────────────────────────────────── */}
          <p style={ol}>FAQ</p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
            style={{ ...card, marginBottom: 48 }}>
            {FAQ.map(({ q, a }, i) => (
              <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', padding: '18px 0', ...(i === 0 ? { paddingTop: 0 } : {}), ...(i === FAQ.length - 1 ? { paddingBottom: 0 } : {}) }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', marginBottom: 7 }}>{q}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, margin: 0 }}>{a}</p>
              </div>
            ))}
          </motion.div>

          {/* ── CTA ────────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 40px', textAlign: 'center' }}>
            <Shield style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.35)', margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: -0.3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Your trust is non-negotiable</h3>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.38)', margin: '0 auto', maxWidth: 440, lineHeight: 1.65 }}>
              Every bet on Dambler is cryptographically sealed. If you ever doubt an outcome, the tools to verify it are always available — no account required.
            </p>
          </motion.div>

        </div>
      </div>
    </MainLayout>
  );
}
