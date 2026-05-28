import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

export default function GameStats() {
  const { data, isLoading } = trpc.admin.getGameStats.useQuery(undefined, { refetchInterval: 30_000 });

  const totals = data?.reduce((acc, r) => ({
    bets: acc.bets + r.totalBets,
    wagered: acc.wagered + r.totalWagered,
    won: acc.won + r.totalWon,
    profit: acc.profit + r.houseProfit,
  }), { bets: 0, wagered: 0, won: 0, profit: 0 });

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Game Stats</h1>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>All-time breakdown per game</p>
      </div>

      {/* Summary row */}
      {totals && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Bets", value: totals.bets.toLocaleString() },
            { label: "Total Wagered", value: `$${totals.wagered.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
            { label: "Total Won (by players)", value: `$${totals.won.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
            { label: "House Profit", value: `$${totals.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "#16a34a" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.5 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color ?? "#1e293b", marginTop: 6 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Game", "Total Bets", "Total Wagered", "Paid Out", "House Profit", "House Edge %"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: "#94a3b8" }}>Loading…</td></tr>}
              {data?.map((row, i) => (
                <tr key={row.game} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 700, color: "#1e293b" }}>{row.game}</td>
                  <td style={{ padding: "9px 14px", color: "#475569" }}>{row.totalBets.toLocaleString()}</td>
                  <td style={{ padding: "9px 14px", color: "#475569" }}>${row.totalWagered.toFixed(2)}</td>
                  <td style={{ padding: "9px 14px", color: "#475569" }}>${row.totalWon.toFixed(2)}</td>
                  <td style={{ padding: "9px 14px", fontWeight: 700, color: row.houseProfit >= 0 ? "#16a34a" : "#dc2626" }}>
                    {row.houseProfit >= 0 ? "+" : ""}${row.houseProfit.toFixed(2)}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                      background: row.houseEdge >= 0 ? "#f0fdf4" : "#fee2e2",
                      color: row.houseEdge >= 0 ? "#16a34a" : "#dc2626",
                    }}>{row.houseEdge}%</span>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: "#94a3b8" }}>No game data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
