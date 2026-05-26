import { motion } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { FileText, AlertTriangle } from 'lucide-react';

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

export default function TermsOfService() {
  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px', position: 'relative' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{ background: 'rgba(0,255,136,0.09)', border: '1px solid rgba(0,255,136,0.18)', borderRadius: 10, padding: 10, display: 'flex' }}>
              <FileText style={{ width: 18, height: 18, color: ACCENT }} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -0.4 }}>Terms of Service</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12.5, margin: '4px 0 0' }}>Last updated: {LAST_UPDATED}</p>
            </div>
          </motion.div>

          {/* Important notice */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
            style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '16px 20px', marginTop: 28, marginBottom: 16, display: 'flex', gap: 12 }}>
            <AlertTriangle style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>
              <strong style={{ color: '#f59e0b', fontWeight: 700 }}>IMPORTANT:</strong> Please read these Terms carefully before using Dambler. By registering an account or placing any bet you agree to be legally bound by these terms. If you do not agree, do not use Dambler.
            </p>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            <Section num={1} title="About Dambler">
              <p>Dambler is an online crypto gambling platform operated by Dambler Ltd ("we", "us", "Dambler"). By accessing or using our website, mobile applications, APIs, or any other product or service we offer (collectively, the "Platform"), you agree to these Terms of Service and our Privacy Policy.</p>
            </Section>

            <Section num={2} title="Eligibility">
              <p>To use Dambler you must: (a) be at least 18 years of age, or the legal age of majority in your jurisdiction if higher; (b) not be a resident of a Restricted Jurisdiction (see Section 3); (c) have full legal capacity to enter into this agreement; (d) not be self-excluded from gambling services; and (e) not be acting on behalf of any other person.</p>
              <p>By registering you warrant that all of the above conditions are met and that the information you provide is accurate and complete. We reserve the right to request verification documents at any time and to close accounts where eligibility cannot be confirmed.</p>
            </Section>

            <Section num={3} title="Restricted Jurisdictions">
              <p>Dambler does not accept players from the following jurisdictions: United States of America (and its territories), United Kingdom (without a specific licence), France and overseas territories, Netherlands, Australia, Singapore, North Korea, Iran, Cuba, Syria, and Sudan. This list may be updated without notice. You are solely responsible for ensuring that online gambling is legal in your jurisdiction.</p>
            </Section>

            <Section num={4} title="Account Registration & Security">
              <p>You may hold only one account on Dambler. Multiple accounts are prohibited and may result in all accounts being closed and balances forfeited. You are responsible for maintaining the confidentiality of your login credentials and for all activity on your account. Notify us immediately at <span style={{ color: ACCENT }}>security@dambler.com</span> if you suspect unauthorised access.</p>
              <p>We reserve the right to close accounts where: (a) we suspect fraud or collusion; (b) inaccurate registration information was provided; (c) the account holder is ineligible; or (d) the account has been inactive for more than 24 months. Dormant account fees may apply after 12 months of inactivity.</p>
            </Section>

            <Section num={5} title="Deposits, Withdrawals & Balances">
              <p>All funds on Dambler are denominated in DMB Coin or the equivalent value of accepted cryptocurrencies. Minimum deposit is $5 USD equivalent; minimum withdrawal is $10 USD equivalent.</p>
              <p>Withdrawals are processed within 1–4 hours subject to verification requirements. We reserve the right to delay or suspend withdrawals where we have reasonable grounds to suspect fraud, money laundering, or a breach of these Terms.</p>
              <p>Balances do not accrue interest. Dambler is not a bank and your balance is not a deposit in the financial services sense. In the event of insolvency, player funds are held in a segregated account and will be returned to players as a priority.</p>
            </Section>

            <Section num={6} title="Gambling Rules & Fairness">
              <p>Each game on Dambler is governed by its specific rules displayed on the game page. All games use a certified random number generator (RNG). Results are provably fair and can be independently verified using the cryptographic seeds disclosed after each bet.</p>
              <p>We reserve the right to void any bet placed: (a) due to a software malfunction or error; (b) where incorrect odds or payouts were displayed due to a technical fault; (c) where we have reasonable grounds to believe the bet was placed as part of fraudulent activity or collusion. In the event of a void bet, the stake is returned to the player's balance.</p>
            </Section>

            <Section num={7} title="Bonuses & Promotions">
              <p>All bonuses and promotions are subject to specific terms stated at the time of the offer. Unless stated otherwise, bonus funds carry a 30× wagering requirement before withdrawal. Wagering contributions vary by game type: slots 100%, table games 10%, video poker 10%, other games 0% unless specified.</p>
              <p>We reserve the right to withdraw, modify, or cancel any bonus at any time if we believe it is being abused, if there is evidence of bonus exploitation, or if the promotion was offered in error.</p>
            </Section>

            <Section num={8} title="Responsible Gambling">
              <p>Dambler is committed to responsible gambling. We offer deposit limits, loss limits, session time limits, and self-exclusion tools. We encourage you to use these tools if gambling is negatively affecting your life. Access responsible gambling settings from your account Settings page at any time.</p>
              <p>If you self-exclude, you may not attempt to circumvent the exclusion by opening new accounts. Any winnings accumulated on an account opened in breach of a self-exclusion will be forfeited. For immediate help, contact the National Problem Gambling Helpline: <span style={{ color: ACCENT }}>1-800-522-4700</span>.</p>
            </Section>

            <Section num={9} title="Prohibited Conduct">
              <p>The following are strictly prohibited: (a) using automated software, bots, or scripts to place bets; (b) exploiting software bugs, glitches, or errors; (c) collusion with other players or Dambler employees; (d) money laundering or using Dambler for any illegal financial activity; (e) making chargebacks or fraudulent payment disputes; (f) harassing or threatening other users or staff; (g) attempting to access another player's account; and (h) reselling access to the platform.</p>
              <p>Violation of these rules may result in immediate account suspension, forfeiture of balance, and referral to law enforcement authorities.</p>
            </Section>

            <Section num={10} title="Intellectual Property">
              <p>All content on the Platform — including game software, graphics, logos, text, and trademarks — is owned by or licensed to Dambler Ltd. You may not reproduce, distribute, modify, or create derivative works without our written consent. Dambler grants you a limited, non-exclusive, non-transferable licence to use the Platform for personal, non-commercial gambling purposes only.</p>
            </Section>

            <Section num={11} title="Limitation of Liability">
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, DAMBLER'S LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE OF THE PLATFORM IS LIMITED TO THE AMOUNT YOU DEPOSITED IN THE 30 DAYS PRIOR TO THE CLAIM. DAMBLER IS NOT LIABLE FOR INDIRECT, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR INCIDENTAL DAMAGES.</p>
              <p>We do not guarantee that the Platform will be available at all times or that it will be free of errors. Scheduled maintenance and unplanned outages may occur. We will endeavour to notify you of planned downtime in advance.</p>
            </Section>

            <Section num={12} title="Governing Law & Disputes">
              <p>These Terms are governed by the laws of [Jurisdiction]. Any dispute that cannot be resolved by our support team will be submitted to binding arbitration under the rules of [Arbitration Body]. You waive any right to participate in a class action lawsuit or class-wide arbitration.</p>
              <p>Before initiating formal proceedings, you must contact us at <span style={{ color: ACCENT }}>legal@dambler.com</span> and allow 30 days for us to resolve the dispute informally.</p>
            </Section>

            <Section num={13} title="Amendments">
              <p>We may amend these Terms at any time. Material changes will be communicated by email or a notice on the Platform at least 14 days before they take effect. Continued use of Dambler after the effective date constitutes acceptance. If you do not accept the new Terms, you must close your account before the effective date.</p>
            </Section>

            <Section num={14} title="Contact">
              <p>
                Legal enquiries: <span style={{ color: ACCENT }}>legal@dambler.com</span> &nbsp;·&nbsp;
                General support: <span style={{ color: ACCENT }}>support@dambler.com</span> &nbsp;·&nbsp;
                Responsible gambling: <span style={{ color: ACCENT }}>rg@dambler.com</span>
              </p>
            </Section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
