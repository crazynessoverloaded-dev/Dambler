import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function BannedUsers() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.getBannedUsers.useQuery({ page: 1, limit: 100 });

  const unbanMutation = trpc.admin.unbanUser.useMutation({
    onSuccess: () => utils.admin.getBannedUsers.invalidate(),
  });

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", margin: 0 }}>Banned Users</h1>
        <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
          {data?.total ?? 0} banned accounts —{" "}
          <span style={{ fontWeight: 700, color: "#f87171" }}>
            ${(data?.frozenTotal ?? 0).toFixed(2)} frozen
          </span>
        </p>
      </div>

      <div style={{ background: "#161616", borderRadius: 12, border: "1px solid #222", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#111" }}>
                {["ID", "Username", "Email", "Frozen Balance", "Ban Date", "Reason", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: "#555" }}>Loading…</td></tr>}
              {data?.rows.map((u, i) => (
                <tr key={u.id} style={{ borderTop: "1px solid #1e1e1e", background: i % 2 === 0 ? "#161616" : "#1a0000" }}>
                  <td style={{ padding: "9px 14px", color: "#555" }}>{u.id}</td>
                  <td style={{ padding: "9px 14px", fontWeight: 700, color: "#f87171" }}>{u.username}</td>
                  <td style={{ padding: "9px 14px", color: "#888" }}>{u.email}</td>
                  <td style={{ padding: "9px 14px", fontWeight: 700, color: "#f87171" }}>${Number(u.balance ?? 0).toFixed(2)}</td>
                  <td style={{ padding: "9px 14px", color: "#555" }}>{fmtDate(u.bannedAt)}</td>
                  <td style={{ padding: "9px 14px", color: "#888", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.banReason ?? "—"}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <button
                      onClick={() => unbanMutation.mutate({ userId: u.id })}
                      style={{
                        padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                        background: "#052e16", color: "#4ade80", fontWeight: 700, fontSize: 12,
                      }}>
                      Unban
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.rows.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: "#555" }}>No banned users</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
