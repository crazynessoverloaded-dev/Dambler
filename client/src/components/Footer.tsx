import { Link } from "wouter";
import { Mail, Twitter, Github, Linkedin, Shield, Lock, CheckCircle2 } from "lucide-react";

const FOOTER_LINKS = {
  Company: [
    { label: "About Us",  href: "/about" },
    { label: "Blog",      href: "/blog" },
    { label: "Careers",   href: "/careers" },
  ],
  Support: [
    { label: "FAQ",                  href: "/faq" },
    { label: "Contact",              href: "/contact" },
    { label: "Responsible Gambling", href: "/responsible-gambling" },
  ],
  Legal: [
    { label: "Privacy Policy",   href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Provably Fair",    href: "/provably-fair" },
  ],
};

const SOCIAL_LINKS = [
  { label: "Twitter",  href: "#", icon: Twitter },
  { label: "GitHub",   href: "#", icon: Github },
  { label: "LinkedIn", href: "#", icon: Linkedin },
  { label: "Email",    href: "mailto:support@dambler.com", icon: Mail },
];

const TRUST_BADGES = [
  { icon: Shield,       text: "Licensed · Curaçao eGaming #8048/JAZ", href: undefined },
  { icon: CheckCircle2, text: "Provably Fair",                         href: "/provably-fair" },
  { icon: Lock,         text: "256-bit SSL Encrypted",                 href: undefined },
];

const BG = '#0d0d12';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.07)',
      background: BG,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 32px 24px', position: 'relative', zIndex: 1 }}>

        {/* Top: brand + columns + social */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 1fr 1fr 160px',
          gap: 40,
          marginBottom: 36,
          alignItems: 'start',
        }}>

          {/* Brand */}
          <div>
            <div style={{
              fontSize: 18, fontWeight: 900,
              letterSpacing: -0.4, marginBottom: 10,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: '#ffffff',
            }}>
              Dambler
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', lineHeight: 1.65, maxWidth: 160, margin: 0 }}>
              Provably fair crypto gambling. No KYC. Instant payouts.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <div style={{
                fontSize: 10, fontWeight: 700,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: 2, textTransform: 'uppercase',
                marginBottom: 14,
              }}>
                {section}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href}>
                      <span style={{
                        fontSize: 12.5, color: 'rgba(255,255,255,0.38)',
                        cursor: 'pointer', transition: 'color 0.15s', display: 'inline-block',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}
                      >
                        {label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social */}
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: 2, textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              Follow Us
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a key={label} href={href} aria-label={label}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.35)',
                    transition: 'all 0.18s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = 'rgba(255,255,255,0.12)';
                    el.style.borderColor = 'rgba(255,255,255,0.22)';
                    el.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = 'rgba(255,255,255,0.06)';
                    el.style.borderColor = 'rgba(255,255,255,0.1)';
                    el.style.color = 'rgba(255,255,255,0.35)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  <Icon style={{ width: 14, height: 14 }} />
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }} />

        {/* Trust badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginBottom: 18 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 10px', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            fontSize: 11, fontWeight: 800,
            color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5,
          }}>
            18+
          </div>

          {TRUST_BADGES.map(({ icon: Icon, text, href }) => {
            const inner = (
              <div key={text} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 11px', borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.03)',
                fontSize: 11, color: 'rgba(255,255,255,0.3)',
                cursor: href ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (href) { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.18)'; (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.6)'; } }}
                onMouseLeave={e => { if (href) { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.3)'; } }}
              >
                <Icon style={{ width: 11, height: 11, flexShrink: 0 }} />
                {text}
              </div>
            );
            return href ? <Link key={text} href={href}>{inner}</Link> : inner;
          })}
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center', gap: 8,
        }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', margin: 0 }}>
            © {new Date().getFullYear()} Dambler. All rights reserved.
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', margin: 0 }}>
            Gambling involves risk. Please play responsibly. 18+ only.
          </p>
        </div>

      </div>
    </footer>
  );
}

