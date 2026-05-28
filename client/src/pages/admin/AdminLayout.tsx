import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const NAV = [
  { path: "/admin/dashboard",    label: "Dashboard",           icon: "⊞" },
  { path: "/admin/users",        label: "Users",               icon: "👤" },
  { path: "/admin/banned",       label: "Banned Users",        icon: "🚫" },
  { path: "/admin/transactions", label: "Transactions",        icon: "↔" },
  { path: "/admin/suspicious",   label: "Suspicious Activity", icon: "⚠" },
  { path: "/admin/game-stats",   label: "Game Stats",          icon: "📊" },
  { path: "/admin/accounts",     label: "Admin Accounts",      icon: "🔑" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: me } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { utils.auth.me.setData(undefined, null); window.location.href = "/admin"; },
  });

  // Suspicious activity badge count
  const { data: susData } = trpc.admin.getSuspiciousActivity.useQuery(
    { page: 1, limit: 1, onlyOpen: true },
    { refetchInterval: 10_000 },
  );
  const openFlags = susData?.total ?? 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#f1f5f9" }}>

      {/* Sidebar */}
      <aside style={{
        width: 240, background: "#ffffff", borderRight: "1px solid #e2e8f0",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #e2e8f0" }}>
          <Link href="/admin/dashboard" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, #1e293b, #334155)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: "#f59e0b", fontWeight: 900,
              }}>D</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>Dambler</div>
                <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: 1, fontWeight: 600 }}>ADMIN PANEL</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {NAV.map(item => {
            const active = location.startsWith(item.path);
            const isSus = item.path === "/admin/suspicious";
            return (
              <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 12px", borderRadius: 8, marginBottom: 2, cursor: "pointer",
                  background: active ? "#f0f9ff" : "transparent",
                  color: active ? "#0369a1" : "#475569",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13.5,
                  transition: "all 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 15, opacity: 0.8 }}>{item.icon}</span>
                    {item.label}
                  </div>
                  {isSus && openFlags > 0 && (
                    <span style={{
                      background: "#ef4444", color: "#fff", borderRadius: 10,
                      fontSize: 10, fontWeight: 800, padding: "2px 6px", minWidth: 18, textAlign: "center",
                    }}>{openFlags}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user info + logout */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Signed in as</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>{me?.username ?? "—"}</div>
          <button
            onClick={() => logoutMutation.mutate()}
            style={{
              width: "100%", padding: "8px", borderRadius: 7,
              background: "#fee2e2", border: "1px solid #fecaca",
              color: "#dc2626", fontWeight: 700, fontSize: 12.5,
              cursor: "pointer",
            }}>
            Sign Out
          </button>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{
              marginTop: 6, padding: "7px", borderRadius: 7, textAlign: "center",
              background: "#f8fafc", border: "1px solid #e2e8f0",
              color: "#64748b", fontSize: 12, cursor: "pointer",
            }}>← Back to Site</div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, padding: "28px 32px", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
