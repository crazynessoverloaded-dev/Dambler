import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

export default function ChatModeration() {
  const [page, setPage] = useState(1);
  const [muteModal, setMuteModal] = useState<{ userId: number; username: string } | null>(null);
  const [muteHours, setMuteHours] = useState("24");
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.getChatMessages.useQuery(
    { page, limit: 50 },
    { keepPreviousData: true, refetchInterval: 10_000 },
  );

  const deleteMutation = trpc.admin.deleteChatMessage.useMutation({
    onSuccess: () => utils.admin.getChatMessages.invalidate(),
  });
  const muteMutation = trpc.admin.muteUser.useMutation({
    onSuccess: () => { utils.admin.getChatMessages.invalidate(); setMuteModal(null); },
  });
  const unmuteMutation = trpc.admin.unmuteUser.useMutation({
    onSuccess: () => utils.admin.getChatMessages.invalidate(),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 50);

  const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12 };
  const td: React.CSSProperties = { padding: "9px 14px", fontSize: 13 };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", margin: 0 }}>Chat Moderation</h1>
          <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{data?.total ?? 0} messages</p>
        </div>
      </div>

      <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#111" }}>
              {["#", "User", "Message", "Time", "Actions"].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} style={{ padding: 28, textAlign: "center", color: "#555" }}>Loading…</td></tr>}
            {data?.rows.map((msg, i) => (
              <tr key={msg.id} style={{ borderTop: "1px solid #1e1e1e", background: i % 2 === 0 ? "#161616" : "#1a1a1a" }}>
                <td style={{ ...td, color: "#555" }}>{msg.id}</td>
                <td style={{ ...td, fontWeight: 700, color: "#f0f0f0" }}>{msg.username}</td>
                <td style={{ ...td, color: "#ccc", maxWidth: 400 }}>{msg.text}</td>
                <td style={{ ...td, color: "#555", whiteSpace: "nowrap" }}>
                  {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td style={{ ...td }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => deleteMutation.mutate({ id: msg.id, username: msg.username })}
                      style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#1a0000", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Delete
                    </button>
                    <button onClick={() => setMuteModal({ userId: msg.userId, username: msg.username })}
                      style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #252525", background: "#1a1a1a", color: "#888", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Mute
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && data?.rows.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 28, textAlign: "center", color: "#555" }}>No messages found</td></tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #222", display: "flex", gap: 8, alignItems: "center" }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #252525", background: "#1a1a1a", color: page === 1 ? "#333" : "#888", fontSize: 13, fontWeight: 600, cursor: page === 1 ? "not-allowed" : "pointer" }}>← Prev</button>
            <span style={{ fontSize: 13, color: "#555" }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #252525", background: "#1a1a1a", color: page === totalPages ? "#333" : "#888", fontSize: 13, fontWeight: 600, cursor: page === totalPages ? "not-allowed" : "pointer" }}>Next →</button>
          </div>
        )}
      </div>

      {/* Mute modal */}
      {muteModal && (
        <div onClick={() => setMuteModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#161616", border: "1px solid #222", borderRadius: 14, padding: "28px 32px", width: 340 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", margin: "0 0 6px" }}>Mute {muteModal.username}</h3>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 18 }}>Prevent this user from sending chat messages.</p>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 6 }}>Duration (hours)</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {["1", "24", "72", "168", "720"].map(h => (
                <button key={h} onClick={() => setMuteHours(h)}
                  style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${muteHours === h ? "#fff" : "#252525"}`, background: muteHours === h ? "#fff" : "#1a1a1a", color: muteHours === h ? "#111" : "#888", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {h}h
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={() => muteMutation.mutate({ userId: muteModal.userId, username: muteModal.username, hours: parseInt(muteHours) })}
                disabled={muteMutation.isPending}
                style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#fff", color: "#111", fontWeight: 800, fontSize: 13, border: "none", cursor: "pointer" }}>
                Mute {muteHours}h
              </button>
              <button onClick={() => { unmuteMutation.mutate({ userId: muteModal.userId, username: muteModal.username }); setMuteModal(null); }}
                style={{ padding: "10px 16px", borderRadius: 8, background: "#1a1a1a", border: "1px solid #252525", color: "#4ade80", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                Unmute
              </button>
              <button onClick={() => setMuteModal(null)}
                style={{ padding: "10px 16px", borderRadius: 8, background: "#1a1a1a", border: "1px solid #252525", color: "#888", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
