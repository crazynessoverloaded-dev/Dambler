import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

function fmt(n: number) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function FinancialControls() {
  const { data, isLoading } = trpc.admin.getFinancialStats.useQuery(undefined, { refetchInterval: 60_000 });
  const { data: cfg } = trpc.admin.getSiteConfig.useQuery();
  const utils = trpc.useUtils();
  const setCfg = trpc.admin.setSiteConfig.useMutation({ onSuccess: () => utils.admin.getSiteConfig.invalidate() });

  const [maxBet, setMaxBet] = useState("");
  const [saved, setSaved] = useState(false);

  const currentMaxBet = cfg?.["max_bet"] ?? "";

  const games = data?.games ?? [];
  const daily = data?.daily ?? [];
  const maxProfit = Math.max(...daily.map(d => Math.abs(d.profit)), 1);

  function saveMaxBet() {
    const val = parseFloat(maxBet);
    if (isNaN(val) || val <= 0) return;
    setCfg.mutate({ key: "max_bet", value: String(val) }, { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); setMaxBet(""); } });
  }

  const totalWagered = games.reduce((s, g) => s + g.wagered, 0);
  const totalProfit  = games.reduce((s, g) => s + g.profit, 0);

  const th: React.CSSProperties = { padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12 };
  const td: React.CSSProperties = { padding: "9px 14px", fontSize: 13 };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", margin: 0 }}>Financial Controls</h1>
        <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>House profit, game breakdown, and bet limits</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Wagered (All Time)", value: `${fmt(totalWagered)} DMB` },
          { label: "Total House Profit", value: `${fmt(totalProfit)} DMB`, color: totalProfit >= 0 ? "#4ade80" : "#f87171" },
          { label: "Max Bet Setting", value: currentMaxBet ? `${currentMaxBet} DMB` : "Unlimited" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{c.label}</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: c.color ?? "#f0f0f0", margin: 0 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Daily profit chart */}
      <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 16 }}>Daily Profit — Last 30 Days</p>
        {daily.length === 0 ? (
          <p style={{ color: "#555", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No data yet</p>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 100 }}>
            {daily.map((d, i) => {
              const h = Math.max(4, Math.round((Math.abs(d.profit) / maxProfit) * 100));
              const positive = d.profit >= 0;
              return (
                <div key={i} title={`${d.day}: ${fmt(d.profit)} DMB`}
                  style={{ flex: 1, height: h, borderRadius: 3, background: positive ? "#4ade80" : "#f87171", opacity: 0.85, cursor: "default" }} />
              );
            })}
          </div>
        )}
        {daily.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 10, color: "#444" }}>{daily[0]?.day}</span>
            <span style={{ fontSize: 10, color: "#444" }}>{daily[daily.length - 1]?.day}</span>
          </div>
        )}
      </div>

      {/* Max bet setting */}
      <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>Global Max Bet Limit</p>
        <p style={{ fontSize: 12, color: "#555", marginBottom: 14 }}>
          Current: <span style={{ color: "#f0f0f0" }}>{currentMaxBet ? `${currentMaxBet} DMB` : "No limit set"}</span>
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={maxBet} onChange={e => setMaxBet(e.target.value)} placeholder="e.g. 1000"
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #252525", background: "#1a1a1a", color: "#f0f0f0", fontSize: 13, width: 160, outline: "none" }} />
          <span style={{ color: "#555", fontSize: 13 }}>DMB</span>
          <button onClick={saveMaxBet} disabled={setCfg.isPending}
            style={{ padding: "9px 20px", borderRadius: 8, background: "#fff", color: "#111", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
            {saved ? "✓ Saved" : "Save"}
          </button>
          {currentMaxBet && (
            <button onClick={() => setCfg.mutate({ key: "max_bet", value: "" })}
              style={{ padding: "9px 16px", borderRadius: 8, background: "#1a0000", border: "1px solid #3a0000", color: "#f87171", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Remove Limit
            </button>
          )}
        </div>
      </div>

      {/* Per-game breakdown */}
      <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", margin: 0 }}>Per-Game Breakdown</p>
          <p style={{ fontSize: 12, color: "#555", margin: 0 }}>{games.length} games with activity</p>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#111" }}>
              {["Game", "Bets", "Wagered", "Won", "Profit", "House Edge"].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: "#555" }}>Loading…</td></tr>}
            {games.map((g, i) => (
              <tr key={g.game} style={{ borderTop: "1px solid #1e1e1e", background: i % 2 === 0 ? "#161616" : "#1a1a1a" }}>
                <td style={{ ...td, fontWeight: 700, color: "#f0f0f0" }}>{g.game}</td>
                <td style={{ ...td, color: "#888" }}>{g.bets.toLocaleString()}</td>
                <td style={{ ...td, color: "#888" }}>{fmt(g.wagered)}</td>
                <td style={{ ...td, color: "#888" }}>{fmt(g.won)}</td>
                <td style={{ ...td, color: g.profit >= 0 ? "#4ade80" : "#f87171", fontWeight: 700 }}>{g.profit >= 0 ? "+" : ""}{fmt(g.profit)}</td>
                <td style={{ ...td, color: g.edge >= 0 ? "#4ade80" : "#f87171" }}>{g.edge}%</td>
              </tr>
            ))}
            {!isLoading && games.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: "#555" }}>No game activity yet</td></tr>
            )}
          </tbody>
        </table>
        {/* Totals row */}
        {games.length > 0 && (
          <div style={{ padding: "12px 14px", borderTop: "1px solid #222", display: "flex", gap: 32, background: "#111" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>TOTAL</span>
            <span style={{ fontSize: 12, color: "#888" }}>Wagered: {fmt(totalWagered)} DMB</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: totalProfit >= 0 ? "#4ade80" : "#f87171" }}>
              Profit: {totalProfit >= 0 ? "+" : ""}{fmt(totalProfit)} DMB
            </span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
