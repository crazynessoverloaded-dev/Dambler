import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      background: "#161616", borderRadius: 12, padding: "20px 22px",
      border: "1px solid #222",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#555", letterSpacing: 0.5, marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color ?? "#f0f0f0" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = trpc.admin.getDashboard.useQuery(undefined, { refetchInterval: 1000 });

  if (isLoading) return <AdminLayout><div style={{ color: "#555", padding: 40 }}>Loading…</div></AdminLayout>;

  const d = data!;

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Live overview — refreshes every second</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="House Profit" value={`$${d.houseProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} color="#4ade80" sub="All time" />
        <StatCard label="Active Users" value={d.activeUsers.toString()} sub="Last hour" />
        <StatCard label="Wagered Today" value={`$${d.wageredToday.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
        <StatCard label="Total Wagered" value={`$${d.totalWagered.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} sub="All time" />
        <StatCard label="Total Users" value={d.totalUsers.toLocaleString()} />
        <StatCard label="Banned Users" value={d.bannedUsers.toString()} color={d.bannedUsers > 0 ? "#f87171" : "#f0f0f0"} />
        <StatCard label="Open Flags" value={d.openFlags.toString()} color={d.openFlags > 0 ? "#fbbf24" : "#f0f0f0"} sub="Suspicious activity" />
      </div>

      {/* Live activity feed */}
      <div style={{ background: "#161616", borderRadius: 12, border: "1px solid #222", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #222" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", margin: 0 }}>Live Activity Feed</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#111" }}>
                {["Time", "User", "Game", "Type", "Amount"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.recentActivity.map((tx, i) => {
                const isWin = tx.type === "win";
                return (
                  <tr key={tx.id} style={{ borderTop: "1px solid #1e1e1e", background: i % 2 === 0 ? "#161616" : "#1a1a1a" }}>
                    <td style={{ padding: "9px 16px", color: "#555" }}>
                      {new Date(tx.createdAt).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: "9px 16px", fontWeight: 600, color: "#f0f0f0" }}>{tx.username}</td>
                    <td style={{ padding: "9px 16px", color: "#888" }}>{tx.game ?? "—"}</td>
                    <td style={{ padding: "9px 16px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: isWin ? "#052e16" : "#1a0000",
                        color: isWin ? "#4ade80" : "#f87171",
                      }}>{tx.type.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: "9px 16px", fontWeight: 700, color: isWin ? "#4ade80" : "#f87171" }}>
                      ${Number(tx.amount).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {d.recentActivity.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#555" }}>No activity yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
