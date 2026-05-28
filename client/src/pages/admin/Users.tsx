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
  | { type: "notes"; userId: number; username: string }
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
  const [newNote, setNewNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.getUsers.useQuery({ search: search || undefined, page, limit: 50 },
    { keepPreviousData: true });

  const notesUserId = modal?.type === "notes" ? modal.userId : 0;
  const { data: notesData, refetch: refetchNotes } = trpc.admin.getUserNotes.useQuery(
    { userId: notesUserId },
    { enabled: modal?.type === "notes" },
  );

  const banMutation = trpc.admin.banUser.useMutation({
    onSuccess: () => { utils.admin.getUsers.invalidate(); setModal(null); setFeedback("User banned."); },
  });
  const xpMutation = trpc.admin.awardXp.useMutation({
    onSuccess: () => { utils.admin.getUsers.invalidate(); setModal(null); setFeedback("XP adjusted."); },
  });
  const balanceMutation = trpc.admin.adjustBalance.useMutation({
    onSuccess: () => { utils.admin.getUsers.invalidate(); setModal(null); setFeedback("Balance adjusted."); },
  });
  const passwordMutation = trpc.admin.resetPassword.useMutation({
    onSuccess: () => { setModal(null); setFeedback("Password updated."); },
  });
  const addNoteMutation = trpc.admin.addUserNote.useMutation({
    onSuccess: () => { setNewNote(""); refetchNotes(); },
  });
  const deleteNoteMutation = trpc.admin.deleteUserNote.useMutation({
    onSuccess: () => refetchNotes(),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 50);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1.5px solid #252525", fontSize: 13, color: "#f0f0f0",
    outline: "none", boxSizing: "border-box", background: "#1a1a1a",
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", margin: 0 }}>Users</h1>
          <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{data?.total ?? 0} total users</p>
        </div>
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search username or email…"
          style={{ padding: "9px 14px", borderRadius: 8, border: "1.5px solid #252525", fontSize: 13, width: 260, outline: "none", background: "#161616", color: "#f0f0f0" }}
        />
      </div>

      {feedback && (
        <div style={{ background: "#052e16", border: "1px solid #14532d", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#4ade80" }}>
          {feedback} <button onClick={() => setFeedback(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "#4ade80" }}>×</button>
        </div>
      )}

      <div style={{ background: "#161616", borderRadius: 12, border: "1px solid #222", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#111" }}>
                {["ID", "Username", "Email", "Balance", "XP / Tier", "Joined", "Last Seen", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={9} style={{ padding: 28, textAlign: "center", color: "#555" }}>Loading…</td></tr>
              )}
              {data?.rows.map((u, i) => {
                const banned = !!u.bannedAt;
                return (
                  <tr key={u.id} style={{ borderTop: "1px solid #1e1e1e", background: banned ? "#1a0000" : i % 2 === 0 ? "#161616" : "#1a1a1a" }}>
                    <td style={{ padding: "9px 14px", color: "#555" }}>{u.id}</td>
                    <td style={{ padding: "9px 14px", fontWeight: 700, color: "#f0f0f0" }}>{u.username}</td>
                    <td style={{ padding: "9px 14px", color: "#888" }}>{u.email}</td>
                    <td style={{ padding: "9px 14px", fontWeight: 600, color: "#f0f0f0" }}>${Number(u.balance ?? 0).toFixed(2)}</td>
                    <td style={{ padding: "9px 14px", color: "#888" }}>{(u.xp ?? 0).toLocaleString()} <span style={{ color: "#555" }}>/ {getXpTier(u.xp ?? 0)}</span></td>
                    <td style={{ padding: "9px 14px", color: "#555" }}>{fmtDate(u.createdAt)}</td>
                    <td style={{ padding: "9px 14px", color: "#555" }}>{fmtDate(u.lastSignedIn)}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: banned ? "#1a0000" : "#052e16",
                        color: banned ? "#f87171" : "#4ade80",
                      }}>{banned ? "Banned" : "Active"}</span>
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <ActionBtn label="Ban" color="#f87171" bg="#1a0000"
                          onClick={() => { setBanReason(""); setModal({ type: "ban", userId: u.id, username: u.username }); }} />
                        <ActionBtn label="XP" color="#c084fc" bg="#1a0a2e"
                          onClick={() => setModal({ type: "xp", userId: u.id, username: u.username })} />
                        <ActionBtn label="Balance" color="#60a5fa" bg="#0a1929"
                          onClick={() => { setBalanceAmount(""); setModal({ type: "balance", userId: u.id, username: u.username }); }} />
                        <ActionBtn label="Reset PW" color="#888" bg="#1a1a1a"
                          onClick={() => { setNewPassword(""); setModal({ type: "password", userId: u.id, username: u.username }); }} />
                        <ActionBtn label="Notes" color="#fbbf24" bg="#1a1000"
                          onClick={() => { setNewNote(""); setModal({ type: "notes", userId: u.id, username: u.username }); }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && data?.rows.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 28, textAlign: "center", color: "#555" }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #222", display: "flex", gap: 8, alignItems: "center" }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={paginationBtn(page === 1)}>← Prev</button>
            <span style={{ fontSize: 13, color: "#555" }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={paginationBtn(page === totalPages)}>Next →</button>
          </div>
        )}
      </div>

      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#161616", borderRadius: 14, padding: "28px 28px", maxWidth: 380, width: "90%", border: "1px solid #252525", boxShadow: "0 12px 40px rgba(0,0,0,0.8)" }}>
            {modal.type === "ban" && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", margin: "0 0 6px" }}>Ban {modal.username}</h3>
                <p style={{ fontSize: 13, color: "#555", marginBottom: 14 }}>The user's balance will be frozen. They cannot log in.</p>
                <textarea value={banReason} onChange={e => setBanReason(e.target.value)}
                  placeholder="Reason for ban…"
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => banMutation.mutate({ userId: modal.userId, username: modal.username, reason: banReason })}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    Confirm Ban
                  </button>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#222", color: "#888", fontWeight: 600, fontSize: 13, border: "1px solid #333", cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            )}
            {modal.type === "xp" && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", margin: "0 0 6px" }}>Adjust XP — {modal.username}</h3>
                <p style={{ fontSize: 12, color: "#555", marginBottom: 14 }}>Positive to award, negative to remove. XP cannot go below 0.</p>
                <input type="number" value={xpAmount} onChange={e => setXpAmount(e.target.value)} style={inputStyle} placeholder="e.g. 500 or -200" />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => xpMutation.mutate({ userId: modal.userId, username: modal.username, amount: parseInt(xpAmount) })}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, background: parseInt(xpAmount) < 0 ? "#dc2626" : "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    {parseInt(xpAmount) < 0 ? `Remove ${Math.abs(parseInt(xpAmount) || 0)} XP` : `Award ${parseInt(xpAmount) || 0} XP`}
                  </button>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#222", color: "#888", fontWeight: 600, fontSize: 13, border: "1px solid #333", cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            )}
            {modal.type === "balance" && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", margin: "0 0 6px" }}>Adjust Balance for {modal.username}</h3>
                <p style={{ fontSize: 12, color: "#555", marginBottom: 14 }}>Use negative number to deduct.</p>
                <input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} placeholder="e.g. 50 or -25"
                  style={{ ...inputStyle, marginBottom: 8 }} />
                <input type="text" value={balanceNote} onChange={e => setBalanceNote(e.target.value)} placeholder="Note" style={inputStyle} />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => balanceMutation.mutate({ userId: modal.userId, username: modal.username, amount: parseFloat(balanceAmount), note: balanceNote })}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    Apply
                  </button>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#222", color: "#888", fontWeight: 600, fontSize: 13, border: "1px solid #333", cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            )}
            {modal.type === "password" && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", margin: "0 0 14px" }}>Reset Password for {modal.username}</h3>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" style={inputStyle} />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => passwordMutation.mutate({ userId: modal.userId, newPassword })}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#fff", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    Set Password
                  </button>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#222", color: "#888", fontWeight: 600, fontSize: 13, border: "1px solid #333", cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            )}
            {modal.type === "notes" && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", margin: 0 }}>Notes — {modal.username}</h3>
                  <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>

                <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  {notesData && notesData.length === 0 && (
                    <p style={{ fontSize: 12, color: "#444", textAlign: "center", padding: "16px 0" }}>No notes yet.</p>
                  )}
                  {notesData?.map(n => (
                    <div key={n.id} style={{ background: "#111", border: "1px solid #252525", borderRadius: 8, padding: "9px 12px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <p style={{ fontSize: 13, color: "#e0e0e0", margin: 0, flex: 1, lineHeight: 1.5 }}>{n.note}</p>
                        <button
                          onClick={() => deleteNoteMutation.mutate({ id: n.id })}
                          style={{ background: "none", border: "none", color: "#555", fontSize: 14, cursor: "pointer", flexShrink: 0, padding: 0, lineHeight: 1 }}>
                          ×
                        </button>
                      </div>
                      <p style={{ fontSize: 11, color: "#444", margin: "5px 0 0" }}>
                        {n.adminUsername} · {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>

                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a note…"
                  style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
                />
                <button
                  onClick={() => addNoteMutation.mutate({ userId: modal.userId, targetUsername: modal.username, note: newNote })}
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                  style={{ marginTop: 10, width: "100%", padding: "10px", borderRadius: 8, background: newNote.trim() ? "#fbbf24" : "#1a1000", color: newNote.trim() ? "#000" : "#555", fontWeight: 700, fontSize: 13, border: "none", cursor: newNote.trim() ? "pointer" : "not-allowed" }}>
                  Add Note
                </button>
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
    padding: "6px 14px", borderRadius: 7, border: "1px solid #252525",
    background: "#1a1a1a", color: disabled ? "#333" : "#888",
    fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
  };
}
