import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      const me = await utils.auth.me.fetch();
      if (me?.role === "admin") {
        setLocation("/admin/dashboard");
      } else {
        setError("Access denied. Admin accounts only.");
        await trpc.createClient({ links: [] });
      }
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("All fields required"); return; }
    loginMutation.mutate({ email, password });
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0d0d0d",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        background: "#111", borderRadius: 16, padding: "40px 36px",
        width: "100%", maxWidth: 380,
        border: "1px solid #222",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 42, fontWeight: 400, fontFamily: "'Great Vibes', cursive", color: "#fff", lineHeight: 1, marginBottom: 6 }}>Dambler</div>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, fontWeight: 600, marginBottom: 16 }}>ADMIN PANEL</div>
          <div style={{ fontSize: 13, color: "#555" }}>Sign in to your admin account</div>
        </div>

        {error && (
          <div style={{
            background: "#1a0000", border: "1px solid #3a0000", borderRadius: 8,
            padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#f87171",
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#888", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@dambler.com"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1.5px solid #252525", fontSize: 14, color: "#f0f0f0",
                outline: "none", boxSizing: "border-box",
                background: "#1a1a1a",
              }}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#888", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1.5px solid #252525", fontSize: 14, color: "#f0f0f0",
                outline: "none", boxSizing: "border-box",
                background: "#1a1a1a",
              }}
            />
          </div>

          <button
            type="submit" disabled={loginMutation.isPending}
            style={{
              width: "100%", padding: "11px", borderRadius: 9,
              background: "#fff", color: "#000",
              fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
              opacity: loginMutation.isPending ? 0.6 : 1,
            }}>
            {loginMutation.isPending ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
