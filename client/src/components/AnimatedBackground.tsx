import { useEffect, useState } from "react";

interface Particle {
  id: number;
  top: string;
  delay: string;
  duration: string;
  color: string;
  size: string;
}

const PARTICLE_COLORS = [
  "rgba(0,255,136,0.7)",
  "rgba(0,255,136,0.5)",
  "rgba(59,130,246,0.5)",
  "rgba(22,163,74,0.4)",
  "rgba(0,221,255,0.4)",
];

export default function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 35 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${8 + Math.random() * 6}s`,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size: Math.random() > 0.7 ? "2px" : "1px",
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            top: p.top,
            left: "-10px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `float-stars ${p.duration} linear infinite, twinkle 3s ease-in-out infinite`,
            animationDelay: p.delay,
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}

      {/* Primary green blob — top left */}
      <div
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full blur-3xl animate-pulse"
        style={{ background: "radial-gradient(circle, rgba(0,255,136,0.07) 0%, transparent 70%)" }}
      />

      {/* Blue blob — top right */}
      <div
        className="absolute -top-16 right-0 w-[400px] h-[400px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          animation: "pulse 4s ease-in-out infinite",
          animationDelay: "1.5s",
        }}
      />

      {/* Violet blob — bottom right */}
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(22,163,74,0.06) 0%, transparent 70%)",
          animation: "pulse 5s ease-in-out infinite",
          animationDelay: "0.8s",
        }}
      />

      {/* Secondary green blob — bottom left */}
      <div
        className="absolute bottom-0 -left-16 w-[380px] h-[380px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 70%)",
          animation: "pulse 6s ease-in-out infinite",
          animationDelay: "2s",
        }}
      />

      {/* Cyan accent — centre */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(ellipse, rgba(0,221,255,0.03) 0%, transparent 70%)",
          animation: "pulse 8s ease-in-out infinite",
          animationDelay: "3s",
        }}
      />
    </div>
  );
}
