import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

const SEVERITY_COLORS: Record<string, { bg: string; color: string }> = {
  high:   { bg: "#1a0000", color: "#f87171" },
  medium: { bg: "#1c1100", color: "#fbbf24" },
  low:    { bg: "#052e16", color: "#4ade80" },
};

const TYPE_LABELS: Record<string, string> = {
  consecutive_wins:    "10 Wins in a Row",
  fast_betting:        "Bot-Speed Betting",
  multi_account:       "Multiple Accounts / Same IP",
  large_balance_jump:  "Sudden Balance Jump",
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", margin: 0 }}>Suspicious Activity</h1>
          <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{data?.total ?? 0} records</p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#888", cursor: "pointer" }}>
          <input type="checkbox" checked={onlyOpen} onChange={e => { setOnlyOpen(e.target.checked); setPage(1); }} />
          Show open flags only
        </label>
      </div>

      <div style={{ background: "#161616", borderRadius: 12, border: "1px solid #222", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#111" }}>
                {["Date", "User", "Flag Type", "Severity", "Details", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: "#555" }}>Loading…</td></tr>}
              {data?.rows.map((row, i) => {
                const sev = SEVERITY_COLORS[row.severity] ?? SEVERITY_COLORS.medium;
                let details: Record<string, unknown> = {};
                try { details = JSON.parse(row.details); } catch { /* */ }
                return (
                  <tr key={row.id} style={{ borderTop: "1px solid #1e1e1e", background: row.dismissed ? "#1a1a1a" : i % 2 === 0 ? "#161616" : "#1c1100" }}>
                    <td style={{ padding: "9px 14px", color: "#555", whiteSpace: "nowrap" }}>
                      {new Date(row.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "9px 14px", fontWeight: 700, color: "#f0f0f0" }}>{row.username}</td>
                    <td style={{ padding: "9px 14px", color: "#f0f0f0", fontWeight: 600 }}>
                      {TYPE_LABELS[row.type] ?? row.type}
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, ...sev }}>
                        {row.severity.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "9px 14px", color: "#888", maxWidth: 240 }}>
                      {Object.entries(details).map(([k, v]) => (
                        <span key={k} style={{ marginRight: 8 }}>
                          <span style={{ color: "#555" }}>{k}:</span> {String(v)}
                        </span>
                      ))}
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: row.dismissed ? "#1a1a1a" : "#1c1100",
                        color: row.dismissed ? "#555" : "#fbbf24",
                      }}>{row.dismissed ? "Dismissed" : "Open"}</span>
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      {!row.dismissed && (
                        <button onClick={() => dismissMutation.mutate({ id: row.id })}
                          style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: "#222", color: "#888", fontSize: 11, fontWeight: 700 }}>
                          Dismiss
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && data?.rows.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: "#555" }}>No flags found 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #222", display: "flex", gap: 8 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #252525", background: "#1a1a1a", color: page === 1 ? "#333" : "#888", fontSize: 13, fontWeight: 600, cursor: page === 1 ? "not-allowed" : "pointer" }}>
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: "#555", lineHeight: "32px" }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #252525", background: "#1a1a1a", color: page === totalPages ? "#333" : "#888", fontSize: 13, fontWeight: 600, cursor: page === totalPages ? "not-allowed" : "pointer" }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
