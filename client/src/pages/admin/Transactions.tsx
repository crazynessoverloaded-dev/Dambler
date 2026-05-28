import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

const TX_TYPES = ["", "bet", "win", "bonus", "deposit", "withdrawal", "refund"];

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [game, setGame] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.admin.getTransactions.useQuery(
    { search: search || undefined, type: type || undefined, game: game || undefined, page, limit: 50 },
    { keepPreviousData: true },
  );

  const totalPages = Math.ceil((data?.total ?? 0) / 50);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Transactions</h1>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{data?.total ?? 0} records</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by username…"
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, width: 220, outline: "none", background: "#fff" }} />
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, outline: "none", background: "#fff" }}>
          {TX_TYPES.map(t => <option key={t} value={t}>{t || "All Types"}</option>)}
        </select>
        <input value={game} onChange={e => { setGame(e.target.value); setPage(1); }}
          placeholder="Filter by game…"
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, width: 180, outline: "none", background: "#fff" }} />
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ID", "Date", "User", "Type", "Game", "Amount", "Before", "After", "Description"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={9} style={{ padding: 28, textAlign: "center", color: "#94a3b8" }}>Loading…</td></tr>}
              {data?.rows.map((tx, i) => {
                const isWin = tx.type === "win" || tx.type === "bonus" || tx.type === "deposit" || tx.type === "refund";
                const isLoss = tx.type === "bet" || tx.type === "withdrawal";
                return (
                  <tr key={tx.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "8px 14px", color: "#94a3b8" }}>{tx.id}</td>
                    <td style={{ padding: "8px 14px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {new Date(tx.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "8px 14px", fontWeight: 600, color: "#1e293b" }}>{tx.username}</td>
                    <td style={{ padding: "8px 14px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: isWin ? "#dcfce7" : isLoss ? "#fee2e2" : "#f1f5f9",
                        color: isWin ? "#16a34a" : isLoss ? "#dc2626" : "#475569",
                      }}>{tx.type.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: "8px 14px", color: "#475569" }}>{tx.game ?? "—"}</td>
                    <td style={{ padding: "8px 14px", fontWeight: 700, color: isWin ? "#16a34a" : isLoss ? "#dc2626" : "#475569" }}>
                      {isLoss ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: "8px 14px", color: "#94a3b8" }}>${Number(tx.balanceBefore).toFixed(2)}</td>
                    <td style={{ padding: "8px 14px", color: "#94a3b8" }}>${Number(tx.balanceAfter).toFixed(2)}</td>
                    <td style={{ padding: "8px 14px", color: "#64748b", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tx.description ?? "—"}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && data?.rows.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 28, textAlign: "center", color: "#94a3b8" }}>No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, alignItems: "center" }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #e2e8f0", background: page === 1 ? "#f8fafc" : "#fff", color: page === 1 ? "#cbd5e1" : "#475569", fontSize: 13, fontWeight: 600, cursor: page === 1 ? "not-allowed" : "pointer" }}>
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: "#64748b" }}>Page {page} of {totalPages}</span>
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
