import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem { q: string; a: string }

const SECTIONS: { title: string; items: FAQItem[] }[] = [
  {
    title: 'Getting Started',
    items: [
      { q: 'What is Dambler?', a: 'Dambler is a crypto-native gambling platform powered by DMB Coin. We offer 45+ casino games — from Plinko and Crash to Baccarat, Blackjack, and Video Poker — with provably fair outcomes and instant settlement.' },
      { q: 'How do I create an account?', a: 'Click "Register" in the top navigation, enter your email and a secure password, and verify your email address. That\'s it — no lengthy KYC required to start playing, though enhanced verification is needed for larger withdrawals.' },
      { q: 'Is Dambler legal in my country?', a: 'Online gambling laws vary by jurisdiction. You are solely responsible for ensuring that accessing Dambler is legal in your country of residence. We do not accept players from jurisdictions where online gambling is prohibited. A full list of restricted countries is in our Terms of Service.' },
      { q: 'What is the minimum age to play?', a: 'You must be at least 18 years old (or the legal gambling age in your jurisdiction if higher) to use Dambler. We take underage gambling seriously and perform age verification checks. Any account found to be operated by a minor will be immediately closed.' },
    ],
  },
  {
    title: 'Deposits & Withdrawals',
    items: [
      { q: 'What currencies does Dambler accept?', a: 'Dambler primarily operates with DMB Coin. We also support Bitcoin (BTC), Ethereum (ETH), USDT, and USDC. Fiat on-ramp options are available in select regions via our payment partners.' },
      { q: 'How long do deposits take?', a: 'Crypto deposits are credited after the required number of blockchain confirmations: BTC requires 3 confirmations (typically 30 mins), ETH requires 12 confirmations (approx. 3 mins), and DMB Coin is near-instant on our network.' },
      { q: 'How long do withdrawals take?', a: 'Withdrawal requests are processed within 1–4 hours. Once processed, blockchain confirmation time applies. Most withdrawals complete within a few hours. Large withdrawals may require additional verification and up to 24 hours processing.' },
      { q: 'Are there withdrawal fees?', a: 'Dambler charges no platform withdrawal fee. You are only responsible for the blockchain network fee (gas fee), which is deducted from the withdrawal amount. We display the estimated network fee before you confirm any withdrawal.' },
      { q: 'What are the deposit and withdrawal limits?', a: 'Minimum deposit: $5 equivalent. Minimum withdrawal: $10 equivalent. Maximum single withdrawal: $50,000 equivalent. Higher limits are available for VIP players — contact support if you need to move larger amounts.' },
    ],
  },
  {
    title: 'Games & Fairness',
    items: [
      { q: 'Are the games fair?', a: 'Yes. All games use a certified random number generator (RNG) and are built with provably fair cryptographic verification. The server seed, client seed, and nonce for each bet are logged and can be verified independently. We publish our fairness methodology on the platform.' },
      { q: 'What is RTP?', a: 'RTP (Return to Player) is the theoretical percentage of all wagered money that a game pays back over time. For example, a 97% RTP game returns $97 for every $100 wagered on average. RTP is a long-run statistic — individual sessions can vary significantly. Each game displays its RTP on the game page.' },
      { q: 'Which game has the best odds?', a: 'Video Poker (Jacks or Better) has the highest RTP at 99.5% with optimal strategy. Blackjack (99.0%), Baccarat Banker bet (98.9%), and Craps Pass Line with odds (98.6%) are also excellent. Big Six has the lowest RTP at 86.0% for some segments.' },
      { q: 'Can I play for free?', a: 'We do not currently offer a free-play demo mode. All games require a real-money wager. We are considering a demo mode for new players — check the blog for updates.' },
    ],
  },
  {
    title: 'Account & Security',
    items: [
      { q: 'How do I reset my password?', a: 'Click "Login" then "Forgot password?" and enter your registered email. You\'ll receive a secure reset link within a few minutes. If you don\'t receive the email, check your spam folder or contact support.' },
      { q: 'Can I have multiple accounts?', a: 'No. Each player is permitted one account only. Operating multiple accounts is a violation of our Terms of Service and may result in permanent bans and forfeiture of balances.' },
      { q: 'How do I enable two-factor authentication (2FA)?', a: 'Go to Settings → Security → Two-Factor Authentication and follow the setup steps. We support authenticator apps (Google Authenticator, Authy). We strongly recommend enabling 2FA.' },
      { q: 'What happens if I forget my 2FA device?', a: 'Contact support with your account email and identity verification documents. Recovery without the 2FA device takes 48–72 hours for security reasons. We cannot bypass this delay.' },
    ],
  },
  {
    title: 'Responsible Gambling',
    items: [
      { q: 'How do I set deposit limits?', a: 'Go to Settings → Responsible Gambling → Deposit Limits. You can set daily, weekly, or monthly caps. Limit increases take 24 hours to activate; decreases are immediate.' },
      { q: 'How do I self-exclude?', a: 'Go to Settings → Responsible Gambling → Self-Exclusion. Choose a period from 24 hours to 5 years. During self-exclusion your account is locked, promotional emails are stopped, and you cannot re-open the account until the period expires.' },
      { q: 'Where can I get help for problem gambling?', a: 'If you\'re concerned about your gambling, please contact the National Problem Gambling Helpline: 1-800-522-4700 (US), GamCare: 0808 8020 133 (UK), or Gamblers Anonymous at gamblersanonymous.org. You can also contact us at rg@dambler.com.' },
    ],
  },
  {
    title: 'VIP & Promotions',
    items: [
      { q: 'How does the VIP programme work?', a: 'The VIP programme has five tiers: Bronze, Silver, Gold, Platinum, and Diamond. You earn XP points on every bet — higher tiers unlock better cashback rates, higher withdrawal limits, a personal account manager, and exclusive bonuses.' },
      { q: 'How are bonuses wagered?', a: 'Bonus funds carry a 30× wagering requirement before they can be withdrawn. For example, a $100 bonus must generate $3,000 in total wagers. Wagering contributions vary by game — slots contribute 100%, table games 10%.' },
      { q: 'Can I cancel a bonus?', a: 'Yes. You can forfeit an active bonus at any time from Settings → Bonuses. Note that forfeiting a bonus removes both the bonus funds and any winnings generated from them.' },
    ],
  },
];

function FAQRow({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} className="last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', gap: 16, textAlign: 'left' }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: open ? '#fff' : 'rgba(255,255,255,0.75)', lineHeight: 1.45 }}>{item.q}</span>
        <ChevronDown style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.35)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.72, paddingBottom: 16, paddingRight: 28, margin: 0 }}>{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 380, background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px', position: 'relative' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, display: 'flex' }}>
              <HelpCircle style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.52)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -0.4 }}>Frequently Asked Questions</h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13.5, margin: '4px 0 0' }}>Can't find an answer? Email <span style={{ color: 'rgba(255,255,255,0.52)' }}>support@dambler.com</span></p>
            </div>
          </motion.div>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SECTIONS.map((section, i) => (
              <motion.div key={section.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '4px 24px 4px' }}>
                <div style={{ padding: '16px 0 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.52)', textTransform: 'uppercase', letterSpacing: 1 }}>{section.title}</span>
                </div>
                {section.items.map(item => <FAQRow key={item.q} item={item} />)}
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ marginTop: 28, textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Still have questions?{' '}
              <a href="mailto:support@dambler.com" style={{ color: 'rgba(255,255,255,0.52)', textDecoration: 'none' }}>support@dambler.com</a>
              {' '}— we reply within 4 hours.
            </p>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
