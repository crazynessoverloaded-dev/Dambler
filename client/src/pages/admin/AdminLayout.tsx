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
  { path: "/admin/bug-reports",  label: "Bug Reports",         icon: "🐛" },
  { path: "/admin/contact",      label: "Contact Messages",    icon: "✉" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: me } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { utils.auth.me.setData(undefined, null); window.location.href = "/admin"; },
  });

  const { data: susData } = trpc.admin.getSuspiciousActivity.useQuery(
    { page: 1, limit: 1, onlyOpen: true },
    { refetchInterval: 10_000 },
  );
  const openFlags = susData?.total ?? 0;

  const { data: bugData } = trpc.admin.getBugReports.useQuery(
    { page: 1, limit: 1, status: "open" },
    { refetchInterval: 30_000 },
  );
  const openBugs = bugData?.total ?? 0;

  const { data: contactData } = trpc.admin.getContactSubmissions.useQuery(
    { page: 1, limit: 1, status: "new" },
    { refetchInterval: 30_000 },
  );
  const newMessages = contactData?.total ?? 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#0d0d0d" }}>

      {/* Sidebar */}
      <aside style={{
        width: 240, background: "#111111", borderRight: "1px solid #222",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #222" }}>
          <Link href="/admin/dashboard" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{ fontSize: 28, fontWeight: 400, fontFamily: "'Great Vibes', cursive", color: "#fff", lineHeight: 1 }}>Dambler</div>
              <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, fontWeight: 600, marginTop: 2 }}>ADMIN PANEL</div>
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
                  background: active ? "#222" : "transparent",
                  color: active ? "#ffffff" : "#888",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13.5,
                  transition: "all 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 15, opacity: 0.8 }}>{item.icon}</span>
                    {item.label}
                  </div>
                  {isSus && openFlags > 0 && (
                    <span style={{ background: "#ef4444", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 800, padding: "2px 6px", minWidth: 18, textAlign: "center" }}>{openFlags}</span>
                  )}
                  {item.path === "/admin/bug-reports" && openBugs > 0 && (
                    <span style={{ background: "#f59e0b", color: "#000", borderRadius: 10, fontSize: 10, fontWeight: 800, padding: "2px 6px", minWidth: 18, textAlign: "center" }}>{openBugs}</span>
                  )}
                  {item.path === "/admin/contact" && newMessages > 0 && (
                    <span style={{ background: "#60a5fa", color: "#000", borderRadius: 10, fontSize: 10, fontWeight: 800, padding: "2px 6px", minWidth: 18, textAlign: "center" }}>{newMessages}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user info + logout */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #222" }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>Signed in as</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 10 }}>{me?.username ?? "—"}</div>
          <button
            onClick={() => logoutMutation.mutate()}
            style={{
              width: "100%", padding: "8px", borderRadius: 7,
              background: "#1a0000", border: "1px solid #3a0000",
              color: "#f87171", fontWeight: 700, fontSize: 12.5,
              cursor: "pointer",
            }}>
            Sign Out
          </button>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{
              marginTop: 6, padding: "7px", borderRadius: 7, textAlign: "center",
              background: "#1a1a1a", border: "1px solid #252525",
              color: "#888", fontSize: 12, cursor: "pointer",
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
