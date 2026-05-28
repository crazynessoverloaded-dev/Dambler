import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import AnimatedBackground from "./AnimatedBackground";
import Footer from "./Footer";
import Navbar from "./Navbar";
import CommunityChat from "./CommunityChat";
import FloatingBalance from "./FloatingBalance";
import { useAuth } from "@/_core/hooks/useAuth";

const GAME_PATHS = new Set([
  '/plinko', '/dice', '/guess-the-cup', '/blackjack', '/mines', '/crash',
  '/hilo', '/keno', '/roulette', '/baccarat', '/video-poker', '/three-card-poker',
  '/casino-war', '/sicbo', '/craps', '/bigsix', '/dragon-tiger', '/red-dog',
  '/scratch-cards', '/coinflip', '/limbo', '/tower', '/chuck-a-luck', '/andar-bahar',
  '/wheel', '/pontoon', '/caribbean-stud', '/casino-holdem', '/lightning-dice',
  '/bingo', '/rps', '/classic-slots', '/dice-21', '/parity', '/dice-duel',
  '/color-spin', '/lucky-7', '/card-flip', '/penalty', '/hot-dice', '/number-match',
  '/rapid-roulette', '/jackpot-box', '/slot-joker',
]);

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => { setDismissed(false); }, [location]);

  const isGamePath = GAME_PATHS.has(location);
  const showOverlay = isGamePath && !isAuthenticated && !dismissed;

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />

      <div className="flex flex-col min-h-screen relative z-10">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

      <CommunityChat />
      <FloatingBalance />

      {showOverlay && (
        <div
          onClick={() => setDismissed(true)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'linear-gradient(170deg, #111118 0%, #09090f 100%)',
              borderRadius: 28,
              padding: '44px 40px 36px',
              maxWidth: 400,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 0 0 1px rgba(251,191,36,0.18), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.9)',
              overflow: 'hidden',
            }}
          >
            {/* Top ambient glow */}
            <div style={{
              position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
              width: 240, height: 100,
              background: 'radial-gradient(ellipse, rgba(245,158,11,0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Close button */}
            <button
              onClick={() => setDismissed(true)}
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.35)', fontSize: 18, lineHeight: '28px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
            >
              ×
            </button>

            {/* Icon */}
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'linear-gradient(145deg, rgba(245,158,11,0.14), rgba(245,158,11,0.06))',
              border: '1.5px solid rgba(245,158,11,0.32)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 22px',
              boxShadow: '0 0 36px rgba(245,158,11,0.18)',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#f59e0b" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="3" y="11" width="18" height="11" rx="3" stroke="#f59e0b" strokeWidth="1.75"/>
                <circle cx="12" cy="16.5" r="1.4" fill="#f59e0b"/>
                <line x1="12" y1="17.9" x2="12" y2="19.2" stroke="#f59e0b" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Label */}
            <p style={{
              fontSize: 9.5, fontWeight: 800, letterSpacing: 3, color: '#f59e0b',
              textTransform: 'uppercase', marginBottom: 10, opacity: 0.65,
            }}>
              Members Only
            </p>

            <h2 style={{
              fontSize: 27, fontWeight: 900, color: '#ffffff',
              letterSpacing: -0.5, marginBottom: 10, lineHeight: 1.15,
            }}>
              Login to Play
            </h2>

            <p style={{
              fontSize: 13.5, color: 'rgba(255,255,255,0.36)',
              marginBottom: 30, lineHeight: 1.7,
            }}>
              Create a free account to bet with real money,<br />
              track your stats, and unlock rewards.
            </p>

            {/* Divider */}
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)',
              marginBottom: 24,
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/login" style={{
                display: 'block', padding: '15px 0', borderRadius: 14,
                background: '#ffffff',
                color: '#0a0a0f', fontWeight: 900, fontSize: 15, textDecoration: 'none',
                letterSpacing: 0.3,
                boxShadow: '0 4px 20px rgba(255,255,255,0.12)',
              }}>
                Login
              </Link>

              <Link href="/register" style={{
                display: 'block', padding: '15px 0', borderRadius: 14,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.72)', fontWeight: 700, fontSize: 14,
                textDecoration: 'none',
              }}>
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
