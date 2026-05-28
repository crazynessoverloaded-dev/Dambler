import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

const ACTION_COLORS: Record<string, string> = {
  BAN_USER: "#f87171", UNBAN_USER: "#4ade80",
  ADJUST_XP: "#60a5fa", ADJUST_BALANCE: "#a78bfa",
  RESET_PASSWORD: "#fbbf24", MUTE_USER: "#f97316",
  UNMUTE_USER: "#4ade80", DELETE_MSG: "#f87171",
  ADD_NOTE: "#60a5fa", DELETE_NOTE: "#888",
  SET_CONFIG: "#e2e8f0", GAME_TOGGLE: "#e2e8f0",
};

export default function AuditLog() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.admin.getAuditLog.useQuery(
    { page, limit: 50 },
    { keepPreviousData: true, refetchInterval: 30_000 },
  );

  const totalPages = Math.ceil((data?.total ?? 0) / 50);

  const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12 };
  const td: React.CSSProperties = { padding: "9px 14px", fontSize: 13 };

  function fmtAction(a: string) {
    return a.replace(/_/g, " ");
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", margin: 0 }}>Audit Log</h1>
        <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{data?.total ?? 0} admin actions recorded</p>
      </div>

      <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#111" }}>
              {["Time", "Admin", "Action", "Target", "Details"].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} style={{ padding: 28, textAlign: "center", color: "#555" }}>Loading…</td></tr>}
            {data?.rows.map((log, i) => (
              <tr key={log.id} style={{ borderTop: "1px solid #1e1e1e", background: i % 2 === 0 ? "#161616" : "#1a1a1a" }}>
                <td style={{ ...td, color: "#555", whiteSpace: "nowrap" }}>
                  {new Date(log.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </td>
                <td style={{ ...td, fontWeight: 700, color: "#f0f0f0" }}>{log.adminUsername}</td>
                <td style={{ ...td }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                    background: `${ACTION_COLORS[log.action] ?? "#555"}18`,
                    color: ACTION_COLORS[log.action] ?? "#888",
                    letterSpacing: 0.3,
                  }}>
                    {fmtAction(log.action)}
                  </span>
                </td>
                <td style={{ ...td, color: "#888" }}>
                  {log.targetUsername ? (
                    <span style={{ color: "#f0f0f0", fontWeight: 600 }}>{log.targetUsername}</span>
                  ) : "—"}
                </td>
                <td style={{ ...td, color: "#666", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {log.details || "—"}
                </td>
              </tr>
            ))}
            {!isLoading && data?.rows.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 28, textAlign: "center", color: "#555" }}>No actions logged yet</td></tr>
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
    </AdminLayout>
  );
}
