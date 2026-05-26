import { motion } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { Shield } from 'lucide-react';

const LAST_UPDATED = 'May 17, 2026';
const ACCENT = '#00FF88';

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
  padding: '22px 26px',
};

interface SectionProps { num: number; title: string; children: React.ReactNode }

function Section({ num, title, children }: SectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: num * 0.04 }} style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT, background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 6, padding: '2px 7px', fontFamily: 'monospace' }}>{num}</span>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.54)', lineHeight: 1.72, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </motion.div>
  );
}

export default function PrivacyPolicy() {
  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px', position: 'relative' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{ background: 'rgba(0,255,136,0.09)', border: '1px solid rgba(0,255,136,0.18)', borderRadius: 10, padding: 10, display: 'flex' }}>
              <Shield style={{ width: 18, height: 18, color: ACCENT }} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -0.4 }}>Privacy Policy</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12.5, margin: '4px 0 0' }}>Last updated: {LAST_UPDATED}</p>
            </div>
          </motion.div>

          {/* Intro */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
            style={{ ...card, marginTop: 28, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.72, margin: 0 }}>
              Dambler ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, who we share it with, and how you can exercise your rights. By using Dambler you agree to the practices described in this policy.
            </p>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            <Section num={1} title="Who We Are">
              <p>Dambler is operated by Dambler Ltd, a company incorporated under the laws of [Jurisdiction]. Our registered address is [Registered Address]. For data protection enquiries, contact our Data Protection Officer at <span style={{ color: ACCENT }}>privacy@dambler.com</span>.</p>
            </Section>

            <Section num={2} title="Information We Collect">
              <p><strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Account Information:</strong> When you register, we collect your email address, username, date of birth, and password (stored as a secure hash). We never store your password in plain text.</p>
              <p><strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Identity Verification:</strong> For compliance and KYC purposes we may collect government-issued ID documents, proof of address, and a selfie. These are processed by our certified third-party verification partner and stored only as long as legally required.</p>
              <p><strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Financial Information:</strong> We record your deposit and withdrawal transactions, crypto wallet addresses, and transaction hashes. We do not store full payment card numbers.</p>
              <p><strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Usage Data:</strong> We collect your IP address, browser type, device identifiers, pages visited, game sessions, bet history, and timestamps. This data helps us detect fraud and improve the platform.</p>
              <p><strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Communications:</strong> If you contact support or fill in a form, we store those messages to resolve your enquiry and improve service quality.</p>
            </Section>

            <Section num={3} title="How We Use Your Information">
              <p>We use the information we collect to: (a) provide and operate our gambling services; (b) verify your identity and comply with AML/KYC regulations; (c) process deposits and withdrawals; (d) detect and prevent fraud, cheating, or terms violations; (e) personalise your experience and show relevant promotions; (f) send account and security notifications; (g) comply with legal and regulatory obligations; and (h) respond to support requests.</p>
              <p>Legal bases: performance of a contract, legal obligation (KYC/AML), legitimate interests (fraud prevention), and consent (marketing, which you can withdraw at any time).</p>
            </Section>

            <Section num={4} title="Sharing Your Information">
              <p>We do not sell your personal data. We share information with:</p>
              <p><strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Service Providers:</strong> Third-party vendors who help operate the platform — payment processors, KYC providers, cloud hosting, email services, and analytics. All are bound by data processing agreements.</p>
              <p><strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Regulators and Law Enforcement:</strong> We will disclose information when required by law, court order, or to protect the safety of users. We may report suspicious transactions to financial intelligence authorities.</p>
              <p><strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Business Transfers:</strong> In the event of a merger or acquisition, your information may be transferred as part of business assets. We will notify you in advance.</p>
            </Section>

            <Section num={5} title="Cookies and Tracking">
              <p>We use essential cookies required for the platform to function (session management, security tokens) and analytics cookies to understand how players use Dambler. We do not use third-party advertising cookies.</p>
              <p>You can control non-essential cookies via your browser settings. Disabling essential cookies will prevent you from logging in.</p>
            </Section>

            <Section num={6} title="Data Retention">
              <p>We retain your account data for as long as your account is active and for a minimum of 5 years after closure, as required by AML and gaming regulations. KYC documents are retained for 5 years after the end of the business relationship. Bet and transaction records are retained for 7 years. You may request deletion of marketing data at any time.</p>
            </Section>

            <Section num={7} title="Your Rights">
              <p>Depending on your location, you may have the following rights: <strong style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Access</strong>, <strong style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Rectification</strong>, <strong style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Erasure</strong>, <strong style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Restriction</strong>, <strong style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Portability</strong>, and <strong style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Objection</strong> to processing.</p>
              <p>To exercise any right, email <span style={{ color: ACCENT }}>privacy@dambler.com</span>. We will respond within 30 days. We may need to verify your identity before fulfilling the request.</p>
            </Section>

            <Section num={8} title="Security">
              <p>We use industry-standard safeguards including TLS encryption for all data in transit, AES-256 encryption for sensitive data at rest, two-factor authentication support, and regular penetration testing by independent security firms. Despite these measures, no system is 100% secure — please use a strong, unique password and enable 2FA.</p>
            </Section>

            <Section num={9} title="Children's Privacy">
              <p>Dambler is strictly for adults aged 18 and over. We do not knowingly collect personal data from anyone under 18. If we discover an account belongs to a minor, we will immediately close it and delete associated data. If you believe a minor has registered, contact us at <span style={{ color: ACCENT }}>security@dambler.com</span>.</p>
            </Section>

            <Section num={10} title="Changes to This Policy">
              <p>We may update this Privacy Policy from time to time. Material changes will be notified by email or a prominent notice on the platform at least 14 days before they take effect. The current version is always available at <span style={{ color: ACCENT }}>dambler.com/privacy</span>.</p>
            </Section>

            <Section num={11} title="Contact">
              <p>For privacy questions or to exercise your rights, contact our Data Protection Officer at <span style={{ color: ACCENT }}>privacy@dambler.com</span>. If you are unsatisfied with our response, you have the right to lodge a complaint with your local data protection supervisory authority.</p>
            </Section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
