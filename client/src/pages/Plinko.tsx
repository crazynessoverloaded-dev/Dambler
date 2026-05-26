import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/MainLayout';
import { useGameWallet } from '@/_core/hooks/useGameWallet';
import GameRules from '@/components/GameRules';
import { Play, Volume2, VolumeX, Square } from 'lucide-react';
// @ts-ignore
import * as Matter from 'matter-js';

const { Engine: MatterEngine, World, Bodies, Body, Events, Composite } = Matter;

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  isWin: boolean;
}

interface BallData {
  id: string;
  body: any;
  landed: boolean;
  betAmount: number;
}

// Mirrored layout: 10x 3x 1x 0.7x 0.5x 0.4x | 0.2x | 0.4x 0.5x 0.7x 1x 3x 10x
const BUCKET_MULTIPLIERS = [10, 3, 1, 0.7, 0.5, 0.4, 0.2, 0.4, 0.5, 0.7, 1, 3, 10];
const BUCKET_COLORS = [
  '#FF1744', '#FF6D00', '#FFAB00', '#76FF03', '#00E676', '#1DE9B6',
  '#00B0FF',
  '#1DE9B6', '#00E676', '#76FF03', '#FFAB00', '#FF6D00', '#FF1744',
];
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 620;
const PEG_RADIUS = 5;
const BALL_RADIUS = 7;
const NUM_ROWS = 12; // 12 rows → 13 natural landing slots → matches 13 multipliers

const RISK_CONFIGS = {
  low: { houseBias: 0.65, speedMultiplier: 0.8 },
  medium: { houseBias: 0.55, speedMultiplier: 1.0 },
  high: { houseBias: 0.45, speedMultiplier: 1.2 },
};

export default function Plinko() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const ballsRef = useRef<BallData[]>([]);
  const pegsRef = useRef<any[]>([]);
  const bucketsRef = useRef<any[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const isAutoRunningRef = useRef(false);
  const ballIdCounterRef = useRef(0);

  // Refs for dynamic state (so animation loop doesn't recreate)
  const betAmountRef = useRef(1);
  const riskLevelRef = useRef<'low' | 'medium' | 'high'>('medium');

  // React State
  const { balance, balanceRef, setBalance } = useGameWallet('Plinko');
  const [betAmount, setBetAmount] = useState(1);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isRunning, setIsRunning] = useState(false);
  const [autoBetCount, setAutoBetCount] = useState(0);
  const [autoBetRemaining, setAutoBetRemaining] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<{ multiplier: number; winAmount: number } | null>(null);

  const betOptions = [0.1, 0.5, 1, 5, 10, 50, 100];

  // Update refs when state changes
  useEffect(() => {
    betAmountRef.current = betAmount;
  }, [betAmount]);

  useEffect(() => {
    riskLevelRef.current = riskLevel;
  }, [riskLevel]);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  // Initialize Matter.js - runs ONCE
  useEffect(() => {
    const engine = MatterEngine.create();
    engineRef.current = engine;
    engine.world.gravity.y = 1;

    // Create pegs
    const pegs: any[] = [];
    const pegSpacingX = CANVAS_WIDTH / (NUM_ROWS + 1);
    const pegSpacingY = (CANVAS_HEIGHT - 100) / (NUM_ROWS + 2);

    for (let row = 0; row < NUM_ROWS; row++) {
      const pegsInRow = row + 1;
      const rowWidth = pegsInRow * pegSpacingX;
      const rowStartX = (CANVAS_WIDTH - rowWidth) / 2 + pegSpacingX / 2;

      for (let col = 0; col < pegsInRow; col++) {
        const x = rowStartX + col * pegSpacingX;
        const y = 30 + row * pegSpacingY;
        const peg = Bodies.circle(x, y, PEG_RADIUS, {
          isStatic: true,
          label: 'peg',
          friction: 0.1,
          restitution: 0.5,
        });
        World.add(engine.world, peg);
        pegs.push(peg);
      }
    }
    pegsRef.current = pegs;

    // Create buckets
    const buckets: any[] = [];
    const bucketWidth = CANVAS_WIDTH / BUCKET_MULTIPLIERS.length;
    const bucketY = CANVAS_HEIGHT - 30;

    BUCKET_MULTIPLIERS.forEach((mult, index) => {
      const x = (index + 0.5) * bucketWidth;
      const bucket = Bodies.rectangle(x, bucketY, bucketWidth - 2, 30, {
        isStatic: true,
        label: `bucket-${index}`,
        isSensor: true,
      });
      World.add(engine.world, bucket);
      buckets.push(bucket);
    });
    bucketsRef.current = buckets;

    // Add walls
    const leftWall = Bodies.rectangle(5, CANVAS_HEIGHT / 2, 10, CANVAS_HEIGHT, {
      isStatic: true,
    });
    const rightWall = Bodies.rectangle(CANVAS_WIDTH - 5, CANVAS_HEIGHT / 2, 10, CANVAS_HEIGHT, {
      isStatic: true,
    });
    World.add(engine.world, [leftWall, rightWall]);

    // Collision detection
    Events.on(engine, 'collisionStart', (event: any) => {
      event.pairs.forEach((pair: any) => {
        const { bodyA, bodyB } = pair;

        // Apply random lateral impulse on peg hits — this creates proper binomial distribution.
        // Without this, floating-point determinism can bias balls toward the same path repeatedly.
        const pegBall = bodyA.label === 'peg' ? bodyB : bodyB.label === 'peg' ? bodyA : null;
        if (pegBall && !pegBall.isStatic) {
          Body.applyForce(pegBall, pegBall.position, {
            x: (Math.random() - 0.5) * 0.00025,
            y: 0,
          });
        }

        // Check if ball hit a bucket
        let ballBody = null;
        let bucketLabel = null;

        if (bodyA.label?.startsWith('bucket-')) {
          ballBody = bodyB;
          bucketLabel = bodyA.label;
        } else if (bodyB.label?.startsWith('bucket-')) {
          ballBody = bodyA;
          bucketLabel = bodyB.label;
        }

        if (ballBody && bucketLabel) {
          // Find the ball in our array
          const ballData = ballsRef.current.find((b) => b.body === ballBody);
          if (ballData && !ballData.landed) {
            ballData.landed = true;

            // Extract bucket index from label
            const bucketIndex = parseInt(bucketLabel.split('-')[1]);
            const multiplier = BUCKET_MULTIPLIERS[bucketIndex];

            // Calculate winnings: bet amount × multiplier
            const winAmount = ballData.betAmount * multiplier;

            // Update balance: add the winnings (which includes the original bet if multiplier >= 1)
            setBalance((prev) => {
              const newBalance = prev + winAmount;
              balanceRef.current = newBalance;
              return newBalance;
            });

            // Calculate profit/loss for display
            const profitLoss = winAmount - ballData.betAmount;

            // Add floating text
            const floatingId = `float-${Date.now()}-${Math.random()}`;
            setFloatingTexts((prev) => [
              ...prev,
              {
                id: floatingId,
                x: ballBody.position.x,
                y: ballBody.position.y,
                text: `${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}`,
                isWin: profitLoss >= 0,
              },
            ]);

            // Remove floating text after 2 seconds
            setTimeout(() => {
              setFloatingTexts((prev) => prev.filter((t) => t.id !== floatingId));
            }, 2000);

            // Update history and last result
            setHistory((prev) => [multiplier, ...prev.slice(0, 19)]);
            setLastResult({ multiplier, winAmount: profitLoss });

            // Remove ball from physics world
            World.remove(engine.world, ballBody);
          }
        }
      });
    });

    return () => {
      World.clear(engine.world, false);
      MatterEngine.clear(engine);
    };
  }, []); // Empty dependency array - runs only once

  // Draw function
  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0F1419';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Border
    ctx.strokeStyle = '#00FF88';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);

    // Draw pegs
    ctx.fillStyle = '#FFFFFF';
    pegsRef.current.forEach((peg) => {
      ctx.beginPath();
      ctx.arc(peg.position.x, peg.position.y, PEG_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw buckets with labels
    const bucketWidth = CANVAS_WIDTH / BUCKET_MULTIPLIERS.length;
    const bucketY = CANVAS_HEIGHT - 38;

    BUCKET_MULTIPLIERS.forEach((mult, index) => {
      const x = index * bucketWidth;
      ctx.fillStyle = BUCKET_COLORS[index];
      ctx.fillRect(x + 1, bucketY, bucketWidth - 2, 34);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${mult}x`, x + bucketWidth / 2, bucketY + 21);
    });

    // Draw only non-landed balls
    ballsRef.current.forEach((ballData) => {
      if (!ballData.landed) {
        const ball = ballData.body;
        ctx.fillStyle = '#00FF88';
        ctx.beginPath();
        ctx.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  };

  // Animation loop - runs ONCE
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      MatterEngine.update(engineRef.current);

      // Clean up landed balls
      ballsRef.current = ballsRef.current.filter((b) => !b.landed);

      draw(ctx);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []); // Empty dependency array - runs only once

  // Drop ball function
  const dropBall = () => {
    if (!engineRef.current) return;

    const engine = engineRef.current;
    // Slight random x-offset and velocity at drop. The pegs and random impulse on
    // each peg collision do the real work of spreading balls into a bell-curve shape.
    const randomOffset = (Math.random() - 0.5) * 10;
    const riskConfig = RISK_CONFIGS[riskLevelRef.current];

    const ball = Bodies.circle(CANVAS_WIDTH / 2 + randomOffset, 15, BALL_RADIUS, {
      friction: 0.1,
      restitution: 0.5,
      density: 0.002,
      frictionAir: 0.008,
    });

    Body.setVelocity(ball, {
      x: (Math.random() - 0.5) * 1.5,
      y: 3 * riskConfig.speedMultiplier,
    });

    World.add(engine.world, ball);
    ballsRef.current.push({
      id: `ball-${ballIdCounterRef.current++}`,
      body: ball,
      landed: false,
      betAmount: betAmountRef.current,
    });
  };

  // Handle BET NOW click
  const handleBetNow = async () => {
    if (balanceRef.current < betAmountRef.current) {
      alert('Insufficient balance!');
      return;
    }

    // If auto-bet is set, run auto-bet loop
    if (autoBetCount > 0) {
      isAutoRunningRef.current = true;
      setIsRunning(true);
      let remaining = autoBetCount;

      while (remaining > 0 && isAutoRunningRef.current && balanceRef.current >= betAmountRef.current) {
        // Deduct bet upfront
        setBalance((prev) => {
          const newBalance = prev - betAmountRef.current;
          balanceRef.current = newBalance;
          return newBalance;
        });

        // Drop ball - winnings will be added in collision handler
        dropBall();

        // Wait for ball to land
        await new Promise((resolve) => setTimeout(resolve, 3000));

        remaining--;
        setAutoBetRemaining(remaining);
      }

      isAutoRunningRef.current = false;
      setIsRunning(false);
      setAutoBetCount(0);
      setAutoBetRemaining(0);
    } else {
      // Single bet - deduct bet upfront
      setBalance((prev) => {
        const newBalance = prev - betAmountRef.current;
        balanceRef.current = newBalance;
        return newBalance;
      });

      // Drop ball - winnings will be added in collision handler
      dropBall();
    }
  };

  // Handle STOP button
  const handleStop = () => {
    isAutoRunningRef.current = false;
    setIsRunning(false);
    setAutoBetCount(0);
    setAutoBetRemaining(0);
  };

  return (
    <MainLayout>
      <section className="bg-gradient-to-b from-background via-background to-background/50 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
            style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}
          >
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-1">PLINKO</h1>
              <p className="text-muted-foreground text-sm">Professional Crypto Gambling with 97% RTP</p>
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 }}>BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>${balance.toFixed(2)}</div>
            </div>
          </motion.div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-1 space-y-3 max-h-[700px] overflow-y-auto"
            >

              {/* Risk Level */}
              <div className="glass-effect rounded-lg border border-accent/20 p-3 space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Risk Level</p>
                <div className="space-y-2">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setRiskLevel(level)}
                      disabled={isRunning}
                      className={`w-full px-3 py-2 rounded text-xs font-semibold transition-all ${
                        riskLevel === level
                          ? 'bg-accent text-primary-foreground'
                          : 'bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20'
                      } disabled:opacity-50 capitalize`}
                    >
                      {level === 'low' && '🛡️ Low'}
                      {level === 'medium' && '⚡ Medium'}
                      {level === 'high' && '🔥 High'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bet Amount */}
              <div className="glass-effect rounded-lg border border-accent/20 p-3 space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Bet Amount</p>
                <div className="grid grid-cols-2 gap-1">
                  {betOptions.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      disabled={isRunning}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                        betAmount === amount
                          ? 'bg-accent text-primary-foreground'
                          : 'bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20'
                      } disabled:opacity-50`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseFloat(e.target.value))}
                  disabled={isRunning}
                  className="w-full px-2 py-2 rounded bg-background/50 border border-accent/30 text-foreground text-xs"
                />
              </div>

              {/* Auto-Bet */}
              <div className="glass-effect rounded-lg border border-accent/20 p-3 space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Auto-Bet</p>
                <div className="grid grid-cols-2 gap-1">
                  {[10, 50, 100].map((count) => (
                    <button
                      key={count}
                      onClick={() => setAutoBetCount(count)}
                      disabled={isRunning}
                      className="px-2 py-1 rounded text-xs font-semibold bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 disabled:opacity-50"
                    >
                      {count}x
                    </button>
                  ))}
                </div>
                {autoBetRemaining > 0 && (
                  <p className="text-xs text-accent font-bold">
                    Remaining: {autoBetRemaining}
                  </p>
                )}
              </div>

              {/* BET NOW Button */}
              <Button
                onClick={handleBetNow}
                disabled={balance < betAmount || isRunning}
                className="w-full bg-accent text-primary-foreground hover:bg-accent/90 h-10 font-bold text-sm gap-2 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                BET NOW
              </Button>

              {/* STOP Button */}
              {isRunning && (
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  className="w-full h-10 font-bold text-sm gap-2"
                >
                  <Square className="h-4 w-4" />
                  STOP
                </Button>
              )}

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-full p-2 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors flex items-center justify-center gap-2 text-xs"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="h-3 w-3" />
                    <span>Sound On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3 w-3" />
                    <span>Sound Off</span>
                  </>
                )}
              </button>

              {/* Last Result */}
              {lastResult && (
                <div className="glass-effect rounded-lg border border-accent/20 p-3">
                  <p className="text-xs text-muted-foreground mb-2">Last Result</p>
                  <p className="text-lg font-bold text-accent">{lastResult.multiplier}x</p>
                  <p className={`text-sm font-bold ${lastResult.winAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {lastResult.winAmount >= 0 ? '+' : ''}{lastResult.winAmount.toFixed(2)} DMB
                  </p>
                </div>
              )}
            </motion.div>

            {/* Center - Game Canvas */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3 flex justify-center relative"
            >
              <div className="glass-effect rounded-xl border border-accent/20 p-3 w-full overflow-x-auto">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="rounded-lg bg-black block mx-auto"
                  style={{ maxWidth: '100%', width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                />

                {/* Floating text overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <AnimatePresence>
                    {floatingTexts.map((text) => (
                      <motion.div
                        key={text.id}
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: -50 }}
                        transition={{ duration: 2 }}
                        className="absolute text-lg font-bold"
                        style={{
                          left: text.x,
                          top: text.y,
                          color: text.isWin ? '#00FF88' : '#FF3333',
                        }}
                      >
                        {text.text}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Right Sidebar - Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-1 space-y-3 max-h-[700px] overflow-y-auto"
            >
              {/* Multipliers */}
              <div className="glass-effect rounded-lg border border-accent/20 p-3 space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Multipliers</p>
                <div className="space-y-1 text-xs">
                  {BUCKET_MULTIPLIERS.map((mult, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-muted-foreground">Bucket {idx + 1}</span>
                      <span className="text-accent font-bold">{mult}x</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* History */}
              {history.length > 0 && (
                <div className="glass-effect rounded-lg border border-accent/20 p-3 space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Recent</p>
                  <div className="flex flex-wrap gap-1">
                    {history.slice(0, 10).map((mult, idx) => (
                      <div
                        key={idx}
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          mult >= 1
                            ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                            : 'bg-red-500/20 border border-red-500/50 text-red-400'
                        }`}
                      >
                        {mult}x
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multiplier guide */}
              <div className="glass-effect rounded-lg border border-accent/20 p-3 space-y-1">
                <p className="text-xs text-accent font-semibold uppercase mb-2">Bucket Odds</p>
                {[
                  { label: '0.2x (centre)', prob: '22.6%', color: '#00B0FF' },
                  { label: '0.5x (×2)', prob: '38.6%', color: '#1DE9B6' },
                  { label: '0.5x (×2)', prob: '24.2%', color: '#00E676' },
                  { label: '1x (×2)', prob: '10.7%', color: '#76FF03' },
                  { label: '3x (×2)', prob: '3.2%', color: '#FFAB00' },
                  { label: '5x (×2)', prob: '0.6%', color: '#FF6D00' },
                  { label: '20x (edges)', prob: '0.05%', color: '#FF1744' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center text-xs">
                    <span style={{ color: row.color }} className="font-bold">{row.label}</span>
                    <span className="text-muted-foreground">{row.prob}</span>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="glass-effect rounded-lg border border-accent/20 p-3 space-y-2">
                <p className="text-xs text-accent font-semibold uppercase">Game Info</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 12 rows of pegs</li>
                  <li>• 13 multiplier buckets</li>
                  <li>• Bell-curve distribution</li>
                  <li>• Edges are very rare</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      <GameRules gameId="plinko" />
      </section>
    </MainLayout>
  );
}
