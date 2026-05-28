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
    onSuccess: async (data) => {
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
      minHeight: "100vh", background: "#f1f5f9",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        background: "#ffffff", borderRadius: 16, padding: "40px 36px",
        width: "100%", maxWidth: 380,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "linear-gradient(135deg, #1e293b, #334155)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, color: "#f59e0b", fontWeight: 900, margin: "0 auto 12px",
          }}>D</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>Admin Panel</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Sign in to your admin account</div>
        </div>

        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
            padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#dc2626",
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@dambler.com"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1.5px solid #d1d5db", fontSize: 14, color: "#1e293b",
                outline: "none", boxSizing: "border-box",
                background: "#f9fafb",
              }}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1.5px solid #d1d5db", fontSize: 14, color: "#1e293b",
                outline: "none", boxSizing: "border-box",
                background: "#f9fafb",
              }}
            />
          </div>

          <button
            type="submit" disabled={loginMutation.isPending}
            style={{
              width: "100%", padding: "11px", borderRadius: 9,
              background: "#1e293b", color: "#fff",
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
