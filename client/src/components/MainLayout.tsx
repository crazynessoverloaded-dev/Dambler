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
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: '#161616',
              border: '1px solid #222',
              borderRadius: 18,
              padding: '40px 36px 32px',
              maxWidth: 380,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setDismissed(true)}
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 28, height: 28, borderRadius: '50%',
                background: '#222', border: '1px solid #2e2e2e',
                color: '#555', fontSize: 16, lineHeight: 1,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>

            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 2.5,
              color: '#444', textTransform: 'uppercase', marginBottom: 16,
            }}>
              Members Only
            </p>

            <h2 style={{
              fontSize: 22, fontWeight: 800, color: '#fff',
              letterSpacing: -0.3, marginBottom: 8, lineHeight: 1.2,
            }}>
              Sign in to play
            </h2>

            <p style={{
              fontSize: 13, color: '#555',
              marginBottom: 28, lineHeight: 1.65,
            }}>
              Create a free account to bet, track your<br />stats, and unlock rewards.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Link href="/login" style={{
                display: 'block', padding: '13px 0', borderRadius: 9,
                background: '#fff', color: '#111',
                fontWeight: 800, fontSize: 14, textDecoration: 'none',
              }}>
                Sign In
              </Link>

              <Link href="/register" style={{
                display: 'block', padding: '13px 0', borderRadius: 9,
                background: '#1e1e1e', border: '1px solid #2a2a2a',
                color: '#888', fontWeight: 700, fontSize: 13,
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
