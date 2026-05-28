import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getXpTier(xp: number) {
  if (xp >= 200000) return "Dambler";
  if (xp >= 50000) return "Diamond";
  if (xp >= 10000) return "Platinum";
  if (xp >= 2000) return "Gold";
  if (xp >= 500) return "Silver";
  if (xp >= 100) return "Bronze";
  return "Starter";
}

type ActionModal =
  | { type: "ban"; userId: number; username: string }
  | { type: "xp"; userId: number; username: string }
  | { type: "balance"; userId: number; username: string }
  | { type: "password"; userId: number; username: string }
  | null;

export default function Users() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ActionModal>(null);
  const [banReason, setBanReason] = useState("");
  const [xpAmount, setXpAmount] = useState("500");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceNote, setBalanceNote] = useState("Admin credit");
  const [newPassword, setNewPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.getUsers.useQuery({ search: search || undefined, page, limit: 50 },
    { keepPreviousData: true });

  const banMutation = trpc.admin.banUser.useMutation({
    onSuccess: () => { utils.admin.getUsers.invalidate(); setModal(null); setFeedback("User banned."); },
  });
  const xpMutation = trpc.admin.awardXp.useMutation({
    onSuccess: () => { utils.admin.getUsers.invalidate(); setModal(null); setFeedback("XP awarded."); },
  });
  const balanceMutation = trpc.admin.adjustBalance.useMutation({
    onSuccess: () => { utils.admin.getUsers.invalidate(); setModal(null); setFeedback("Balance adjusted."); },
  });
  const passwordMutation = trpc.admin.resetPassword.useMutation({
    onSuccess: () => { setModal(null); setFeedback("Password updated."); },
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 50);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Users</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{data?.total ?? 0} total users</p>
        </div>
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search username or email…"
          style={{
            padding: "9px 14px", borderRadius: 8, border: "1.5px solid #d1d5db",
            fontSize: 13, width: 260, outline: "none", background: "#fff",
          }}
        />
      </div>

      {feedback && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#16a34a" }}>
          {feedback} <button onClick={() => setFeedback(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "#16a34a" }}>×</button>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ID", "Username", "Email", "Balance", "XP / Tier", "Joined", "Last Seen", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={9} style={{ padding: 28, textAlign: "center", color: "#94a3b8" }}>Loading…</td></tr>
              )}
              {data?.rows.map((u, i) => {
                const banned = !!u.bannedAt;
                return (
                  <tr key={u.id} style={{ borderTop: "1px solid #f1f5f9", background: banned ? "#fff5f5" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "9px 14px", color: "#94a3b8" }}>{u.id}</td>
                    <td style={{ padding: "9px 14px", fontWeight: 700, color: "#1e293b" }}>{u.username}</td>
                    <td style={{ padding: "9px 14px", color: "#475569" }}>{u.email}</td>
                    <td style={{ padding: "9px 14px", fontWeight: 600 }}>${Number(u.balance ?? 0).toFixed(2)}</td>
                    <td style={{ padding: "9px 14px", color: "#475569" }}>{(u.xp ?? 0).toLocaleString()} <span style={{ color: "#94a3b8" }}>/ {getXpTier(u.xp ?? 0)}</span></td>
                    <td style={{ padding: "9px 14px", color: "#94a3b8" }}>{fmtDate(u.createdAt)}</td>
                    <td style={{ padding: "9px 14px", color: "#94a3b8" }}>{fmtDate(u.lastSignedIn)}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: banned ? "#fee2e2" : "#f0fdf4",
                        color: banned ? "#dc2626" : "#16a34a",
                      }}>{banned ? "Banned" : "Active"}</span>
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <ActionBtn label="Ban" color="#dc2626" bg="#fee2e2"
                          onClick={() => { setBanReason(""); setModal({ type: "ban", userId: u.id, username: u.username }); }} />
                        <ActionBtn label="+XP" color="#7c3aed" bg="#f5f3ff"
                          onClick={() => setModal({ type: "xp", userId: u.id, username: u.username })} />
                        <ActionBtn label="Balance" color="#0369a1" bg="#f0f9ff"
                          onClick={() => { setBalanceAmount(""); setModal({ type: "balance", userId: u.id, username: u.username }); }} />
                        <ActionBtn label="Reset PW" color="#475569" bg="#f1f5f9"
                          onClick={() => { setNewPassword(""); setModal({ type: "password", userId: u.id, username: u.username }); }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && data?.rows.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 28, textAlign: "center", color: "#94a3b8" }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, alignItems: "center" }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={paginationBtn(page === 1)}>← Prev</button>
            <span style={{ fontSize: 13, color: "#64748b" }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={paginationBtn(page === totalPages)}>Next →</button>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: "28px 28px", maxWidth: 380, width: "90%", boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
            {modal.type === "ban" && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 6px" }}>Ban {modal.username}</h3>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>The user's balance will be frozen. They cannot log in.</p>
                <textarea value={banReason} onChange={e => setBanReason(e.target.value)}
                  placeholder="Reason for ban…"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, minHeight: 80, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => banMutation.mutate({ userId: modal.userId, reason: banReason })}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    Confirm Ban
                  </button>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            )}
            {modal.type === "xp" && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 14px" }}>Award XP to {modal.username}</h3>
                <input type="number" value={xpAmount} onChange={e => setXpAmount(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => xpMutation.mutate({ userId: modal.userId, amount: parseInt(xpAmount) })}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    Award XP
                  </button>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            )}
            {modal.type === "balance" && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 6px" }}>Adjust Balance for {modal.username}</h3>
                <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>Use negative number to deduct.</p>
                <input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} placeholder="e.g. 50 or -25"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 14, boxSizing: "border-box", outline: "none", marginBottom: 8 }} />
                <input type="text" value={balanceNote} onChange={e => setBalanceNote(e.target.value)} placeholder="Note"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => balanceMutation.mutate({ userId: modal.userId, amount: parseFloat(balanceAmount), note: balanceNote })}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#0369a1", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    Apply
                  </button>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            )}
            {modal.type === "password" && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 14px" }}>Reset Password for {modal.username}</h3>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => passwordMutation.mutate({ userId: modal.userId, newPassword })}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#1e293b", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    Set Password
                  </button>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function ActionBtn({ label, color, bg, onClick }: { label: string; color: string; bg: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 9px", borderRadius: 6, border: "none", cursor: "pointer",
      background: bg, color, fontSize: 11, fontWeight: 700,
    }}>{label}</button>
  );
}

function paginationBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "6px 14px", borderRadius: 7, border: "1px solid #e2e8f0",
    background: disabled ? "#f8fafc" : "#fff", color: disabled ? "#cbd5e1" : "#475569",
    fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
  };
}
