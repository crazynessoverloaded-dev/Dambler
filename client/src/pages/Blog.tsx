import { motion } from 'framer-motion';
import { Link } from 'wouter';
import MainLayout from '@/components/MainLayout';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const POSTS = [
  {
    slug: '#',
    tag: 'Platform Update',
    tagColor: '#00FF88',
    title: 'Introducing 20 New Casino Games — Built With Real Odds',
    excerpt: "We just launched Baccarat, Video Poker, Craps, Dragon Tiger, Red Dog, Sic Bo and more. Every game uses mathematically correct casino logic — the same rules you'd find on a Vegas floor.",
    date: 'May 17, 2026',
    readTime: '4 min read',
    featured: true,
  },
  {
    slug: '#',
    tag: 'Strategy',
    tagColor: '#60a5fa',
    title: 'How Plinko Odds Actually Work — The Binomial Distribution Explained',
    excerpt: 'Landing the 20× edge multiplier feels impossible — because it is. With 12 rows of pegs the probability is just 0.024%. Here\'s the maths behind every drop.',
    date: 'May 14, 2026',
    readTime: '6 min read',
    featured: false,
  },
  {
    slug: '#',
    tag: 'Guide',
    tagColor: '#c084fc',
    title: 'Blackjack Basic Strategy: Cut the House Edge to Under 0.5%',
    excerpt: 'A single printed strategy card, applied consistently, is the difference between a 2% house edge and a 0.4% one. We break down every hand decision in plain English.',
    date: 'May 10, 2026',
    readTime: '8 min read',
    featured: false,
  },
  {
    slug: '#',
    tag: 'Crypto',
    tagColor: '#fbbf24',
    title: 'DMB Coin: How Our Native Token Powers Every Bet',
    excerpt: 'DMB Coin is the backbone of every wager on Dambler. Instant settlement, zero chargebacks, and transparent on-chain records — here\'s what makes it different.',
    date: 'May 6, 2026',
    readTime: '5 min read',
    featured: false,
  },
  {
    slug: '#',
    tag: 'Responsible Gambling',
    tagColor: '#34d399',
    title: 'Setting Limits Before You Play: A Practical Guide',
    excerpt: 'The best time to decide your session budget is before you open the game — not after you\'re down. Deposit caps, time alerts, and self-exclusion on Dambler explained.',
    date: 'May 2, 2026',
    readTime: '5 min read',
    featured: false,
  },
  {
    slug: '#',
    tag: 'Strategy',
    tagColor: '#60a5fa',
    title: 'Video Poker: Which Hands to Hold and Why',
    excerpt: 'Jacks or Better has a 99.5% RTP when played with optimal hold strategy. The decision tree isn\'t as complex as it looks — we\'ll show you the 10 rules that cover 95% of situations.',
    date: 'Apr 28, 2026',
    readTime: '7 min read',
    featured: false,
  },
];

export default function Blog() {
  const featured = POSTS.find(p => p.featured)!;
  const rest = POSTS.filter(p => !p.featured);

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 380, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '48px 24px 80px', position: 'relative' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: -0.4 }}>Blog</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>Strategy guides, platform news, and the maths behind the games.</p>
          </motion.div>

          {/* Featured post */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ marginBottom: 32 }}>
            <Link href={featured.slug}>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '32px 36px', cursor: 'pointer', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,255,136,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: '#00FF88', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: 0.3 }}>{featured.tag}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#00FF88', textTransform: 'uppercase', letterSpacing: 1.2 }}>Featured</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: -0.3, lineHeight: 1.35 }}>{featured.title}</h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 20px', maxWidth: 680 }}>{featured.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                    <Calendar style={{ width: 12, height: 12 }} />{featured.date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                    <Clock style={{ width: 12, height: 12 }} />{featured.readTime}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#00FF88' }}>
                    Read more <ArrowRight style={{ width: 12, height: 12 }} />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Post grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {rest.map((post, i) => (
              <motion.div key={post.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.06 }}>
                <Link href={post.slug}>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 14, padding: '22px 22px 20px', cursor: 'pointer', height: '100%',
                    display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{
                        background: `${post.tagColor}18`, border: `1px solid ${post.tagColor}30`,
                        color: post.tagColor, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                      }}>{post.tag}</span>
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 8px', lineHeight: 1.45, flex: 1 }}>{post.title}</h3>
                    <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.44)', lineHeight: 1.62, margin: '0 0 16px' }}>{post.excerpt}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        <Calendar style={{ width: 10, height: 10 }} />{post.date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        <Clock style={{ width: 10, height: 10 }} />{post.readTime}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
