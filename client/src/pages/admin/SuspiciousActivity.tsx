import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

const SEVERITY_COLORS: Record<string, { bg: string; color: string }> = {
  high:   { bg: "#fee2e2", color: "#dc2626" },
  medium: { bg: "#fef3c7", color: "#d97706" },
  low:    { bg: "#f0fdf4", color: "#16a34a" },
};

const TYPE_LABELS: Record<string, string> = {
  consecutive_wins:   "10 Wins in a Row",
  fast_betting:       "Bot-Speed Betting",
  multi_account:      "Multiple Accounts / Same IP",
  large_balance_jump: "Sudden Balance Jump",
  repeated_max_payout: "Repeated Max Payout",
};

export default function SuspiciousActivity() {
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.getSuspiciousActivity.useQuery(
    { page, limit: 50, onlyOpen },
    { refetchInterval: 5000, keepPreviousData: true },
  );

  const dismissMutation = trpc.admin.dismissFlag.useMutation({
    onSuccess: () => {
      utils.admin.getSuspiciousActivity.invalidate();
      utils.admin.getDashboard.invalidate();
    },
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 50);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Suspicious Activity</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{data?.total ?? 0} records</p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", cursor: "pointer" }}>
          <input type="checkbox" checked={onlyOpen} onChange={e => { setOnlyOpen(e.target.checked); setPage(1); }} />
          Show open flags only
        </label>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Date", "User", "Flag Type", "Severity", "Details", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: "#94a3b8" }}>Loading…</td></tr>}
              {data?.rows.map((row, i) => {
                const sev = SEVERITY_COLORS[row.severity] ?? SEVERITY_COLORS.medium;
                let details: Record<string, unknown> = {};
                try { details = JSON.parse(row.details); } catch { /* */ }
                return (
                  <tr key={row.id} style={{ borderTop: "1px solid #f1f5f9", background: row.dismissed ? "#fafafa" : i % 2 === 0 ? "#fff" : "#fffbeb" }}>
                    <td style={{ padding: "9px 14px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {new Date(row.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "9px 14px", fontWeight: 700, color: "#1e293b" }}>{row.username}</td>
                    <td style={{ padding: "9px 14px", color: "#1e293b", fontWeight: 600 }}>
                      {TYPE_LABELS[row.type] ?? row.type}
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, ...sev }}>
                        {row.severity.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "9px 14px", color: "#64748b", maxWidth: 240 }}>
                      {Object.entries(details).map(([k, v]) => (
                        <span key={k} style={{ marginRight: 8 }}>
                          <span style={{ color: "#94a3b8" }}>{k}:</span> {String(v)}
                        </span>
                      ))}
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: row.dismissed ? "#f1f5f9" : "#fef3c7",
                        color: row.dismissed ? "#94a3b8" : "#d97706",
                      }}>{row.dismissed ? "Dismissed" : "Open"}</span>
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      {!row.dismissed && (
                        <button onClick={() => dismissMutation.mutate({ id: row.id })}
                          style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 700 }}>
                          Dismiss
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && data?.rows.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: "#94a3b8" }}>No flags found 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #e2e8f0", background: page === 1 ? "#f8fafc" : "#fff", color: page === 1 ? "#cbd5e1" : "#475569", fontSize: 13, fontWeight: 600, cursor: page === 1 ? "not-allowed" : "pointer" }}>
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: "#64748b", lineHeight: "32px" }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #e2e8f0", background: page === totalPages ? "#f8fafc" : "#fff", color: page === totalPages ? "#cbd5e1" : "#475569", fontSize: 13, fontWeight: 600, cursor: page === totalPages ? "not-allowed" : "pointer" }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
